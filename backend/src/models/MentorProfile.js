/**
 * models/MentorProfile.js — Extended data for mentor users
 *
 * One document per mentor user (enforced by the unique index on `user`).
 * Created immediately after the User document during mentor registration —
 * if profile creation fails, the User is rolled back (see api/auth.js).
 *
 * Key design decisions:
 * - `preferredSessionDuration` is set ONCE at application time and applies
 *   to all availability blocks. This keeps slot generation simple (one chunk
 *   size per mentor) and matches how the spec phrases it.
 * - `applicationStatus` is managed exclusively by the admin API. Mentors
 *   cannot self-approve.
 * - `averageRating` and `totalReviews` are denormalized onto this document
 *   (recomputed via aggregation on each new review) to avoid a full
 *   aggregation on every profile GET.
 */
import mongoose from 'mongoose';

const mentorProfileSchema = new mongoose.Schema(
  {
    // The User document this profile belongs to
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One profile per mentor, enforced at the DB level
    },
    professionalTitle: {
      type: String,
      required: [true, 'Professional title is required'],
      trim: true,
    },
    // Array of skill strings, e.g. ["DSA", "System Design", "React"]
    expertise: {
      type: [String],
      required: [true, 'At least one area of expertise is required'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Expertise must be a non-empty array',
      },
    },
    yearsOfExperience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Years of experience cannot be negative'],
    },
    bio: {
      type: String,
      required: [true, 'Bio is required'],
      trim: true,
    },
    // Optional LinkedIn / portfolio URL
    profileUrl: {
      type: String,
      trim: true,
    },
    // Session duration in minutes — 30 or 60, chosen at application time, immutable thereafter.
    // Used by generateSlotsForAvailability to split availability windows into bookable chunks.
    preferredSessionDuration: {
      type: Number,
      enum: {
        values: [30, 60],
        message: 'Session duration must be 30 or 60 minutes',
      },
      required: [true, 'Preferred session duration is required'],
    },
    // Managed by admin only — mentors start PENDING and wait for review
    applicationStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'APPROVED', 'REJECTED'],
        message: 'Status must be PENDING, APPROVED, or REJECTED',
      },
      default: 'PENDING',
    },
    // Denormalized rating stats — updated via aggregation in api/reviews.js
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('MentorProfile', mentorProfileSchema);
