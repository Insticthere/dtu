/**
 * models/Availability.js — A recurring weekly availability rule
 *
 * Each document represents "I'm available every [dayOfWeek] from [startTime] to [endTime]".
 * From these rules, concrete bookable Slot documents are generated (see utils/slots.js).
 *
 * Overlap validation:
 * This model does NOT validate overlaps itself (Mongoose validators can't do
 * cross-document queries). Overlap checking is done in api/availability.js
 * before saving. The logic: reject if any other ACTIVE rule for the same
 * mentor on the same dayOfWeek has a time range that overlaps the new one.
 * Overlapping time ranges: new.start < existing.end AND new.end > existing.start
 * (standard interval-overlap test — note strict inequalities: touching boundaries
 * at exactly the same minute are NOT considered overlapping, e.g. 09:00-10:00
 * and 10:00-12:00 are fine; 09:00-11:00 and 10:00-12:00 are not).
 *
 * Soft delete:
 * We set isActive = false instead of deleting, so existing Slot documents
 * can still reference this rule for traceability (audit trail).
 */
import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    // The mentor user this rule belongs to
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // We query availability by mentor frequently
    },
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday (matches JS Date.getDay())
    dayOfWeek: {
      type: Number,
      required: [true, 'Day of week is required'],
      min: [0, 'dayOfWeek must be 0 (Sunday) through 6 (Saturday)'],
      max: [6, 'dayOfWeek must be 0 (Sunday) through 6 (Saturday)'],
    },
    // "HH:mm" 24-hour format, e.g. "09:00", "14:30"
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^\d{2}:\d{2}$/, 'startTime must be in HH:mm format'],
    },
    // Must be strictly after startTime, and the gap must fit at least one
    // session of the mentor's preferredSessionDuration. Validated in the route.
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^\d{2}:\d{2}$/, 'endTime must be in HH:mm format'],
    },
    // Soft-delete flag — set to false instead of removing the document
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to speed up overlap queries (mentor + day)
availabilitySchema.index({ mentor: 1, dayOfWeek: 1 });

export default mongoose.model('Availability', availabilitySchema);
