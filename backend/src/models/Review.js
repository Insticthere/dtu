/**
 * models/Review.js — Post-session review from a student
 *
 * Rules enforced at the API level (api/reviews.js):
 * - Only the owning student can submit a review.
 * - The booking must be in COMPLETED status.
 * - Exactly one review per booking (enforced by the `unique` index on `booking`).
 * - Rating is 1–5 (integers, validated by min/max).
 *
 * After each review is created, the mentor's averageRating and totalReviews on
 * MentorProfile are recomputed via an aggregation pipeline (simpler than
 * incremental math and guaranteed to stay correct even if a review is somehow
 * deleted in the future).
 */
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    // Unique: one review per booking session
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    // Denormalized for faster aggregation — no need to populate booking to get mentor
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    // Optional written feedback
    feedback: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient "all reviews for this mentor" queries (used in aggregation)
reviewSchema.index({ mentor: 1 });

export default mongoose.model('Review', reviewSchema);
