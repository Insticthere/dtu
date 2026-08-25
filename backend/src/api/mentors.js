/**
 * api/mentors.js — Public mentor discovery and profile routes
 *
 * GET /api/mentors          — Approved mentor list with search/filter
 * GET /api/mentors/:id      — Single mentor profile with rating
 * GET /api/mentors/:id/slots   — Future AVAILABLE slots for a mentor
 * GET /api/mentors/:id/reviews — Reviews for a mentor
 *
 * All routes require authentication (any role). The `authenticate` middleware
 * is applied to the router — no guest browsing of mentor data.
 */
import express from 'express';
import MentorProfile from '../models/MentorProfile.js';
import Slot from '../models/Slot.js';
import Review from '../models/Review.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All mentor routes require a valid JWT
router.use(authenticate);

const appError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ── GET /api/mentors ──────────────────────────────────────────────────────────
// Returns only APPROVED mentors. Supports optional query params:
//   ?search=    — searches name and professionalTitle (case-insensitive)
//   ?expertise= — filters by a single expertise tag (case-insensitive)
router.get('/', async (req, res, next) => {
  try {
    const { search, expertise } = req.query;

    // Base filter: only approved mentors are publicly visible
    const profileFilter = { applicationStatus: 'APPROVED' };

    // Expertise filter: checks if the expertise array contains the given tag
    if (expertise) {
      // Case-insensitive match against the expertise array
      profileFilter.expertise = { $elemMatch: { $regex: new RegExp(expertise, 'i') } };
    }

    // Get matching profiles
    let profiles = await MentorProfile.find(profileFilter)
      .populate('user', 'name email createdAt') // Join user data
      .lean();

    // Apply name/title text search (done in JS because we're searching a joined field).
    // For a larger dataset, this would move to a MongoDB text index. With a free
    // M0 cluster and small datasets, this is fast enough and simpler to reason about.
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      profiles = profiles.filter(
        (p) =>
          searchRegex.test(p.user?.name) ||
          searchRegex.test(p.professionalTitle)
      );
    }

    res.json({ mentors: profiles });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/mentors/:id ──────────────────────────────────────────────────────
// Returns the full profile of a single APPROVED mentor.
router.get('/:id', async (req, res, next) => {
  try {
    const profile = await MentorProfile.findOne({
      user: req.params.id,
      applicationStatus: 'APPROVED',
    })
      .populate('user', 'name email createdAt')
      .lean();

    if (!profile) {
      return next(appError('Mentor not found.', 404));
    }

    res.json({ mentor: profile });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/mentors/:id/slots ────────────────────────────────────────────────
// Returns future AVAILABLE slots for a mentor.
// ?days= — look ahead this many days (default 10, max 60)
router.get('/:id/slots', async (req, res, next) => {
  try {
    const daysAhead = Math.min(parseInt(req.query.days) || 10, 60);
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    const slots = await Slot.find({
      mentor: req.params.id,
      status: 'AVAILABLE',
      startTime: { $gt: now, $lt: cutoff },
    })
      .sort({ startTime: 1 }) // Chronological order
      .lean();

    res.json({ slots });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/mentors/:id/reviews ──────────────────────────────────────────────
// Returns all reviews for a mentor, newest first.
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await Review.find({ mentor: req.params.id })
      .populate('student', 'name') // Show reviewer name
      .sort({ createdAt: -1 })
      .lean();

    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

export default router;
