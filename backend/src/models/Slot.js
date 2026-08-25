/**
 * models/Slot.js — A concrete, bookable time unit
 *
 * Slots are generated from Availability rules by utils/slots.js.
 * They represent a specific calendar date + time window that a student can book.
 *
 * Lifecycle:
 *   AVAILABLE → (student books) → BOOKED → (session ends, lazy update) → in Booking, not Slot
 *   AVAILABLE → (mentor deletes availability future+unbooked) → deleted
 *   BOOKED → (student/mentor cancels) → back to AVAILABLE (slot.booking = null)
 *
 * Indexes:
 *   { mentor, startTime } — used to check for existing slots during generation
 *                           (idempotency guard) and to fetch a mentor's slots by date.
 *   { availabilityRule, status } — used to find "future unbooked" slots when an
 *                                  availability rule is updated or deleted (§7.2).
 */
import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Back-reference to the Availability rule that generated this slot.
    // Used for regeneration: when a rule changes, find all AVAILABLE future slots
    // with this rule ID and delete/recreate them.
    availabilityRule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Availability',
      required: true,
    },
    // Calendar date at midnight UTC (e.g. 2024-07-15T00:00:00.000Z).
    // Stored for quick "which slots are on this date?" queries.
    date: {
      type: Date,
      required: true,
    },
    // Full UTC timestamp — startTime and endTime of the bookable window.
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
        values: ['AVAILABLE', 'BOOKED', 'CANCELLED'],
        message: 'Status must be AVAILABLE, BOOKED, or CANCELLED',
      },
      default: 'AVAILABLE',
    },
    // Populated when a booking is created, cleared when booking is cancelled.
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index 1: Used for lookups "all AVAILABLE future slots for this mentor"
// and for the idempotency check in slot generation.
slotSchema.index({ mentor: 1, startTime: 1 });

// Index 2: Used in the regeneration step — "find all AVAILABLE slots for this rule"
slotSchema.index({ availabilityRule: 1, status: 1 });

export default mongoose.model('Slot', slotSchema);
