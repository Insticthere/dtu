/**
 * api/reviews.js — Post-session reviews
 *
 * POST /api/reviews — Student submits a review for a completed booking
 *
 * Validation chain (§7.4):
 * 1. Authenticate + student role
 * 2. Booking exists and belongs to this student
 * 3. Booking status is COMPLETED (lazy completion runs first)
 * 4. No review already exists for this booking (unique index is the backstop,
 *    but we check explicitly for a cleaner error message)
 *
 * After creating the review, mentor stats are recomputed via aggregation.
 * Aggregation is used instead of incremental math (averageRating + newRating / (totalReviews + 1))
 * because aggregation is always correct regardless of any past data anomalies,
 * and it's a single Atlas operation that's fast enough at this scale.
 */
import express from 'express';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import MentorProfile from '../models/MentorProfile.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

const appError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ── POST /api/reviews ─────────────────────────────────────────────────────────
router.post('/', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const { bookingId, rating, feedback } = req.body;

    if (!bookingId || !rating) {
      return next(appError('bookingId and rating are required.', 400));
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return next(appError('Rating must be a number between 1 and 5.', 400));
    }

    // Run lazy completion first — the booking might have just ended
    const now = new Date();
    await Booking.updateMany(
      { student: req.user.id, status: 'CONFIRMED', endTime: { $lt: now } },
      { $set: { status: 'COMPLETED' } }
    );

    // Load the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(appError('Booking not found.', 404));
    }

    // Must be the student's booking
    if (!booking.student.equals(req.user.id)) {
      return next(appError('You can only review your own sessions.', 403));
    }

    // Session must be completed before leaving a review
    if (booking.status !== 'COMPLETED') {
      return next(appError('You can only review sessions that have been completed.', 400));
    }

    // Check for existing review (explicit check for a clean error message;
    // the unique index on Review.booking is the DB-level backstop)
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return next(appError('You have already submitted a review for this session.', 409));
    }

    // Create the review
    const review = await Review.create({
      booking: bookingId,
      mentor: booking.mentor,
      student: req.user.id,
      rating: ratingNum,
      feedback: feedback || '',
    });

    // Recompute mentor stats via aggregation.
    // This is always correct — no risk of drift from incremental math.
    const [stats] = await Review.aggregate([
      { $match: { mentor: booking.mentor } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats) {
      await MentorProfile.findOneAndUpdate(
        { user: booking.mentor },
        {
          averageRating: Math.round(stats.avg * 10) / 10, // Round to 1 decimal place
          totalReviews: stats.count,
        }
      );
    }

    res.status(201).json({ message: 'Review submitted. Thank you for your feedback!', review });
  } catch (err) {
    next(err);
  }
});

export default router;
