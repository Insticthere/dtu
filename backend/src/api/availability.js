/**
 * api/availability.js — Mentor availability rule management
 *
 * Mounted at /api/mentor — so paths here are relative to that:
 *
 * GET    /api/mentor/availability       — List the current mentor's rules
 * POST   /api/mentor/availability       — Add a new rule (triggers slot generation)
 * PUT    /api/mentor/availability/:id   — Update a rule (triggers regeneration)
 * DELETE /api/mentor/availability/:id   — Soft-delete a rule (cleanup future slots)
 *
 * Authorization:
 *   All routes require: authenticated + role === 'mentor' + applicationStatus === 'APPROVED'
 *   A PENDING or REJECTED mentor cannot configure availability.
 *
 * Overlap validation (§6, Availability model comment):
 *   On create/update, we reject if the new time range overlaps any OTHER active rule
 *   for the same mentor on the same dayOfWeek. Overlap formula:
 *     new.start < existing.end AND new.end > existing.start
 *   (strict inequalities — touching boundaries are allowed, e.g. 09:00–10:00 and
 *    10:00–11:00 can coexist)
 */
import express from 'express';
import Availability from '../models/Availability.js';
import MentorProfile from '../models/MentorProfile.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { generateSlotsForAvailability, cleanupAndRegenerateSlots } from '../utils/slots.js';

const router = express.Router();

const appError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

/**
 * requireApprovedMentor — middleware that checks the mentor is APPROVED.
 * Runs after authenticate + requireRole('mentor').
 */
const requireApprovedMentor = async (req, res, next) => {
  try {
    const profile = await MentorProfile.findOne({ user: req.user.id }).lean();
    if (!profile) {
      return next(appError('Mentor profile not found.', 404));
    }
    if (profile.applicationStatus !== 'APPROVED') {
      return next(appError(`Your application is ${profile.applicationStatus}. Only APPROVED mentors can manage availability.`, 403));
    }
    // Attach for reuse in handlers (avoids another DB call)
    req.mentorProfile = profile;
    next();
  } catch (err) {
    next(err);
  }
};

// Apply auth chain to all availability routes
router.use(authenticate, requireRole('mentor'), requireApprovedMentor);

// ── Helper: validate time range ───────────────────────────────────────────────
/**
 * Validate that startTime < endTime and the window fits at least one session.
 * Times are "HH:mm" strings; duration is in minutes.
 */
const validateTimeRange = (startTime, endTime, durationMinutes) => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (endMinutes <= startMinutes) {
    return 'endTime must be strictly after startTime.';
  }
  if (endMinutes - startMinutes < durationMinutes) {
    return `The time window (${endMinutes - startMinutes} min) must fit at least one ${durationMinutes}-minute session.`;
  }
  return null; // Valid
};

// ── Helper: check for overlapping rules ──────────────────────────────────────
/**
 * Returns an existing rule if it overlaps the given time window,
 * otherwise null.
 *
 * @param {ObjectId} mentorId
 * @param {number} dayOfWeek
 * @param {string} startTime - "HH:mm"
 * @param {string} endTime   - "HH:mm"
 * @param {ObjectId|null} excludeId - Rule ID to exclude (used on update, so we don't flag ourselves)
 */
const findOverlappingRule = async (mentorId, dayOfWeek, startTime, endTime, excludeId = null) => {
  // Convert to minutes-since-midnight for comparison
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const newStart = sh * 60 + sm;
  const newEnd = eh * 60 + em;

  // Fetch all active rules for this mentor on the same day
  const existingRules = await Availability.find({
    mentor: mentorId,
    dayOfWeek,
    isActive: true,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}), // Exclude self on update
  }).lean();

  for (const rule of existingRules) {
    const [rsh, rsm] = rule.startTime.split(':').map(Number);
    const [reh, rem] = rule.endTime.split(':').map(Number);
    const rStart = rsh * 60 + rsm;
    const rEnd = reh * 60 + rem;

    // Interval overlap: new.start < existing.end AND new.end > existing.start
    if (newStart < rEnd && newEnd > rStart) {
      return rule; // Overlap found
    }
  }
  return null; // No overlap
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── GET /api/mentor/availability ──────────────────────────────────────────────
router.get('/availability', async (req, res, next) => {
  try {
    const rules = await Availability.find({ mentor: req.user.id }).sort({ dayOfWeek: 1, startTime: 1 }).lean();
    res.json({ availability: rules });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/mentor/availability ─────────────────────────────────────────────
router.post('/availability', async (req, res, next) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;

    // Basic field presence check
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return next(appError('dayOfWeek, startTime, and endTime are required.', 400));
    }

    const day = Number(dayOfWeek);
    if (isNaN(day) || day < 0 || day > 6) {
      return next(appError('dayOfWeek must be 0 (Sunday) through 6 (Saturday).', 400));
    }

    // Validate time range vs mentor's session duration
    const durationError = validateTimeRange(startTime, endTime, req.mentorProfile.preferredSessionDuration);
    if (durationError) {
      return next(appError(durationError, 400));
    }

    // Check for overlapping rules
    const overlap = await findOverlappingRule(req.user.id, day, startTime, endTime);
    if (overlap) {
      return next(appError(
        `This time range overlaps your existing ${DAY_NAMES[day]} rule (${overlap.startTime}–${overlap.endTime}). Please adjust the times.`,
        409
      ));
    }

    // Create the rule
    const rule = await Availability.create({
      mentor: req.user.id,
      dayOfWeek: day,
      startTime,
      endTime,
    });

    // Generate slots for the new rule (10 days ahead by default)
    const created = await generateSlotsForAvailability(rule);

    res.status(201).json({
      message: `Availability rule created. ${created} slot(s) generated.`,
      rule,
    });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/mentor/availability/:id ─────────────────────────────────────────
router.put('/availability/:id', async (req, res, next) => {
  try {
    const rule = await Availability.findOne({ _id: req.params.id, mentor: req.user.id });
    if (!rule) {
      return next(appError('Availability rule not found.', 404));
    }

    const { dayOfWeek, startTime, endTime } = req.body;

    // Apply updates (fall back to existing values if not provided)
    const newDay = dayOfWeek !== undefined ? Number(dayOfWeek) : rule.dayOfWeek;
    const newStart = startTime || rule.startTime;
    const newEnd = endTime || rule.endTime;

    if (isNaN(newDay) || newDay < 0 || newDay > 6) {
      return next(appError('dayOfWeek must be 0–6.', 400));
    }

    const durationError = validateTimeRange(newStart, newEnd, req.mentorProfile.preferredSessionDuration);
    if (durationError) {
      return next(appError(durationError, 400));
    }

    // Check overlaps, excluding the rule being updated (so it doesn't conflict with itself)
    const overlap = await findOverlappingRule(req.user.id, newDay, newStart, newEnd, rule._id);
    if (overlap) {
      return next(appError(
        `This time range overlaps your existing ${DAY_NAMES[newDay]} rule (${overlap.startTime}–${overlap.endTime}).`,
        409
      ));
    }

    // Apply changes to the rule document
    rule.dayOfWeek = newDay;
    rule.startTime = newStart;
    rule.endTime = newEnd;
    await rule.save();

    // §7.2: delete future AVAILABLE slots and regenerate
    const { deleted, created } = await cleanupAndRegenerateSlots(rule, true);

    res.json({
      message: `Rule updated. ${deleted} old slot(s) removed, ${created} new slot(s) generated.`,
      rule,
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/mentor/availability/:id ───────────────────────────────────────
router.delete('/availability/:id', async (req, res, next) => {
  try {
    const rule = await Availability.findOne({ _id: req.params.id, mentor: req.user.id });
    if (!rule) {
      return next(appError('Availability rule not found.', 404));
    }

    // Soft delete: set isActive = false (so historical slots retain a valid reference)
    rule.isActive = false;
    await rule.save();

    // §7.2 cleanup: delete future AVAILABLE slots; do NOT regenerate (regenerate = false)
    const { deleted } = await cleanupAndRegenerateSlots(rule, false);

    res.json({
      message: `Availability rule deactivated. ${deleted} future unbooked slot(s) removed. Existing bookings are unaffected.`,
    });
  } catch (err) {
    next(err);
  }
});

// Also mount bookings route for mentor under the same router
// (The mentor bookings route is in bookings.js and mounted at /api/bookings,
//  but we need GET /api/mentor/bookings too)

export default router;
