/**
 * api/bookings.js — Booking creation, cancellation, and listing
 *
 * POST  /api/bookings              — Student creates a booking (§7.3 full chain)
 * GET   /api/bookings/me           — Student's own bookings (?status=)
 * GET   /api/mentor/bookings       — Mentor's bookings (?status=)
 * PATCH /api/bookings/:id/cancel   — Cancel a booking (student or mentor)
 *
 * The booking creation flow is the most complex part of the system and is
 * implemented in exactly the order specified in §7.3. Every step is documented.
 *
 * Double-booking prevention strategy (two independent layers):
 * 1. Application layer: findOneAndUpdate with status filter (atomic) — if two
 *    concurrent requests reach step 9, exactly one will match the filter and
 *    succeed; the other will get null back.
 * 2. Database layer: partial unique index on Booking.slot (status != CANCELLED).
 *    This is the backstop if somehow two bookings were created despite step 9
 *    (e.g. an application-level bug). MongoDB will reject the second insert.
 *
 * See README for the full reasoning on why a single-document atomic update is
 * sufficient and multi-document transactions are not needed here.
 */
import express from 'express';
import Booking from '../models/Booking.js';
import Slot from '../models/Slot.js';
import MentorProfile from '../models/MentorProfile.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { hasMentorConflict, hasStudentConflict } from '../utils/conflicts.js';

const router = express.Router();

const appError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

/**
 * lazyCompleteBookings — before returning bookings, flip any CONFIRMED booking
 * whose endTime has passed to COMPLETED status.
 *
 * Why lazy instead of a cron job?
 *   A cron job would be cleaner in production, but requires a scheduler (node-cron,
 *   an external trigger, etc.). For this assignment's scope, lazy completion is
 *   simpler, has zero additional infrastructure, and is correct: the status is always
 *   accurate when it's read. The README notes the cron approach as a future enhancement.
 *
 * @param {ObjectId|string} userId
 * @param {string} userField - 'student' or 'mentor'
 */
const lazyCompleteBookings = async (userId, userField) => {
  const now = new Date();
  await Booking.updateMany(
    {
      [userField]: userId,
      status: 'CONFIRMED',
      endTime: { $lt: now }, // Session has ended
    },
    { $set: { status: 'COMPLETED' } }
  );
};

// ── POST /api/bookings ────────────────────────────────────────────────────────
// §7.3 full validation chain — 12 steps in order
router.post('/', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const { mentorId, slotId } = req.body;
    const studentId = req.user.id;

    // Step 1: Auth + role checked by middleware above ✓

    // Step 2: Load MentorProfile and verify APPROVED status
    const mentorProfile = await MentorProfile.findOne({ user: mentorId });
    if (!mentorProfile) {
      return next(appError('Mentor not found.', 404));
    }
    if (mentorProfile.applicationStatus !== 'APPROVED') {
      return next(appError('This mentor is not approved for bookings.', 403));
    }

    // Step 3: Load the slot
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return next(appError('Slot not found.', 404));
    }

    // Step 4: Verify the slot belongs to the stated mentor
    // Use .equals() for ObjectId comparison (string == ObjectId is unreliable)
    if (!slot.mentor.equals(mentorId)) {
      return next(appError('This slot does not belong to the specified mentor.', 400));
    }

    // Step 5: Slot must be in the future
    const now = new Date();
    if (slot.startTime <= now) {
      return next(appError('This slot is in the past and cannot be booked.', 400));
    }

    // Step 6: Fast-fail if slot is not AVAILABLE (will be re-checked atomically at step 9)
    if (slot.status !== 'AVAILABLE') {
      return next(appError('This slot is no longer available.', 409));
    }

    // Step 7: Check mentor conflict — does the mentor have another CONFIRMED booking
    // that overlaps this slot's time window?
    const mentorConflict = await hasMentorConflict(mentorId, slot.startTime, slot.endTime);
    if (mentorConflict) {
      return next(appError('The mentor already has a confirmed booking during this time.', 409));
    }

    // Step 8: Check student conflict — same overlap query for the student
    const studentConflict = await hasStudentConflict(studentId, slot.startTime, slot.endTime);
    if (studentConflict) {
      return next(appError('You already have a confirmed booking during this time.', 409));
    }

    // Step 9: ATOMIC CLAIM — the actual double-booking prevention.
    // findOneAndUpdate atomically reads and writes the slot document in a single
    // MongoDB operation. The `status: 'AVAILABLE'` in the filter ensures only one
    // concurrent request can win — if this returns null, the slot was claimed
    // between steps 6 and now by a concurrent request.
    //
    // Why not a multi-document transaction?
    // The race condition we're protecting against is two concurrent requests
    // both reading status='AVAILABLE' in step 6 and then both trying to book.
    // The ONLY document that changes atomically is the Slot (status flip).
    // MongoDB guarantees single-document updates are atomic, so findOneAndUpdate
    // with the status filter is sufficient — one will match, one won't.
    // Transactions span multiple documents and add latency; they're not needed here.
    const claimedSlot = await Slot.findOneAndUpdate(
      { _id: slotId, status: 'AVAILABLE' }, // Filter: only succeeds if still AVAILABLE
      { status: 'BOOKED' },                  // Update: mark as BOOKED
      { new: true }                          // Return the updated document (for confirmation)
    );

    if (!claimedSlot) {
      // Someone else claimed it between step 6 and now — race condition hit
      return next(appError('This slot is no longer available. Please choose another.', 409));
    }

    // Step 10: Create the Booking document
    // Copy startTime/endTime from the slot so conflict queries are self-contained
    const booking = await Booking.create({
      slot: slotId,
      mentor: mentorId,
      student: studentId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'CONFIRMED',
    });

    // Step 11: Link the booking back to the slot for easy lookup
    claimedSlot.booking = booking._id;
    await claimedSlot.save();

    // Step 12: Return 201 with the new booking
    res.status(201).json({
      message: 'Booking confirmed.',
      booking,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/bookings/me ──────────────────────────────────────────────────────
// Student's own bookings. Supports ?status=CONFIRMED|CANCELLED|COMPLETED
router.get('/me', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    // Lazy completion before reading
    await lazyCompleteBookings(req.user.id, 'student');

    const filter = { student: req.user.id };
    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    const bookings = await Booking.find(filter)
      .populate('slot')
      .populate('mentor', 'name email')
      .sort({ startTime: 1 })
      .lean();

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/mentor/bookings ──────────────────────────────────────────────────
// Mentor's incoming bookings. Supports ?status=
// This route is registered as '/bookings' because the router is mounted at both:
//   /api/bookings → full path becomes /api/bookings/bookings (not used)
//   /api/mentor   → full path becomes /api/mentor/bookings ✓ (per spec §8)
// The router.get('/me') and router.post('/') routes are only reachable via /api/bookings
router.get('/bookings', authenticate, requireRole('mentor'), async (req, res, next) => {
  try {
    await lazyCompleteBookings(req.user.id, 'mentor');

    const filter = { mentor: req.user.id };
    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    const bookings = await Booking.find(filter)
      .populate('slot')
      .populate('student', 'name email')
      .sort({ startTime: 1 })
      .lean();

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/bookings/:id/cancel ────────────────────────────────────────────
// Allowed for the owning student OR the owning mentor, only while CONFIRMED and
// startTime is in the future.
// On cancel: booking → CANCELLED, slot → AVAILABLE + slot.booking = null.
router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('slot');
    if (!booking) {
      return next(appError('Booking not found.', 404));
    }

    // Authorization: only the student or mentor on this booking can cancel
    const userId = req.user.id;
    const isStudent = booking.student.equals(userId);
    const isMentor = booking.mentor.equals(userId);

    if (!isStudent && !isMentor) {
      return next(appError('You are not authorized to cancel this booking.', 403));
    }

    // Can only cancel CONFIRMED bookings
    if (booking.status !== 'CONFIRMED') {
      return next(appError(`Cannot cancel a booking with status '${booking.status}'.`, 400));
    }

    // Can only cancel future sessions
    if (booking.startTime <= new Date()) {
      return next(appError('Cannot cancel a session that has already started or passed.', 400));
    }

    // Update booking status
    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    await booking.save();

    // Revert the slot back to AVAILABLE so it can be rebooked
    if (booking.slot) {
      booking.slot.status = 'AVAILABLE';
      booking.slot.booking = null;
      await booking.slot.save();
    }

    res.json({ message: 'Booking cancelled. The slot is now available again.', booking });
  } catch (err) {
    next(err);
  }
});

export default router;
