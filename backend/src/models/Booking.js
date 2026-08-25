/**
 * models/Booking.js — A student's reservation of a Slot
 *
 * Key design decisions:
 *
 * 1. Denormalized `mentor` field: The mentor's ID is stored here even though
 *    it's available via slot → mentor. This allows fast conflict queries without
 *    a join: "does this mentor have any confirmed booking overlapping this time?"
 *    (See utils/conflicts.js).
 *
 * 2. Copied startTime/endTime: Copied from the Slot at booking creation time.
 *    This makes time-overlap queries on bookings self-contained — no need to
 *    populate the Slot just to read times.
 *
 * 3. Partial unique index on slot:
 *    { slot: 1 } UNIQUE WHERE status != 'CANCELLED'
 *    This is a DB-level backstop: at most one non-cancelled booking may exist
 *    per slot. A cancelled booking does NOT block a new booking on the same slot
 *    (which happens when a cancellation reopens a slot for rebooking).
 *    This is the second layer of double-booking prevention — the first is the
 *    atomic findOneAndUpdate in api/bookings.js (see §7.3 and README).
 *
 * 4. Bookings are never hard-deleted — they are the audit trail.
 *    Cancellation sets status = 'CANCELLED' and cancelledAt = now.
 */
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: true,
    },
    // Denormalized for fast conflict queries — see comment above
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
    // Copied from the Slot at booking time — makes overlap queries self-contained
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
        message: 'Status must be CONFIRMED, CANCELLED, or COMPLETED',
      },
      default: 'CONFIRMED',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index 1: Mentor's booking history — used for conflict checks and mentor booking list
bookingSchema.index({ mentor: 1, status: 1, startTime: 1 });

// Index 2: Student's booking history — used for conflict checks and student booking list
bookingSchema.index({ student: 1, status: 1, startTime: 1 });

// Index 3 (Partial unique): DB-level double-booking prevention.
// Only one non-cancelled booking allowed per slot at any time.
// A partial index is used because MongoDB allows multiple cancelled bookings
// on the same slot (they represent the audit history of re-bookings).
// NOTE: Mongoose 8 supports partialFilterExpression in index options.
bookingSchema.index(
  { slot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: 'CANCELLED' } },
    name: 'unique_active_booking_per_slot',
  }
);

export default mongoose.model('Booking', bookingSchema);
