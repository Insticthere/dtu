/**
 * utils/slots.js — Slot generation and regeneration algorithms (§7.1 and §7.2)
 *
 * This file contains the two most complex algorithms in the system.
 * Both are documented here in interview-defense detail per the spec's requirement.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ALGORITHM 1: generateSlotsForAvailability (§7.1)
 * ────────────────────────────────────────────────────────────────────────────
 * Purpose: Given a recurring weekly availability rule (e.g. "every Monday,
 * 09:00–12:00"), generate concrete, bookable Slot documents for the next N days.
 *
 * Why generate slots ahead of time instead of computing them on-the-fly?
 * - Students need to see and book specific slots; a rule alone isn't bookable.
 * - Pre-generating lets us track status (AVAILABLE/BOOKED/CANCELLED) per slot.
 * - It allows the atomic findOneAndUpdate double-booking prevention to work —
 *   the slot document must exist for the update to target it.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ALGORITHM 2: cleanupAndRegenerateSlots (§7.2)
 * ────────────────────────────────────────────────────────────────────────────
 * Purpose: When an availability rule is updated or deleted, safely refresh
 * the generated slots without touching booked or past slots.
 *
 * The three categories of slots and what happens to each:
 *   - Past slots (startTime <= now): NEVER touched, regardless of status.
 *     History is immutable.
 *   - Future AVAILABLE slots: DELETED and regenerated with new times.
 *   - Future BOOKED slots: LEFT ALONE. A student already holds this booking;
 *     we don't cancel it on their behalf. The mentor must cancel it manually.
 *
 * Why this satisfies the spec:
 *   "future unbooked slots may regenerate, past slots never change,
 *    confirmed bookings are never deleted."
 */
import MentorProfile from '../models/MentorProfile.js';
import Slot from '../models/Slot.js';

/**
 * generateSlotsForAvailability — creates Slot documents for a given rule.
 *
 * @param {Object} availabilityRule - Mongoose Availability document
 * @param {number} daysAhead - How many days into the future to generate (default 10)
 * @returns {Promise<number>} Number of new slots created
 */
export const generateSlotsForAvailability = async (availabilityRule, daysAhead = 10) => {
  // Step 1: Get the mentor's preferred session duration.
  // This is on MentorProfile, not on the rule itself, because duration is
  // a mentor-wide setting chosen at application time.
  const profile = await MentorProfile.findOne({ user: availabilityRule.mentor }).lean();
  if (!profile) {
    throw new Error(`MentorProfile not found for user ${availabilityRule.mentor}`);
  }
  const durationMinutes = profile.preferredSessionDuration; // 30 or 60

  // Step 2: Parse the rule's start and end times (stored as "HH:mm" strings).
  // We'll build full UTC timestamps by combining each candidate date with these times.
  const [startHour, startMin] = availabilityRule.startTime.split(':').map(Number);
  const [endHour, endMin] = availabilityRule.endTime.split(':').map(Number);

  // Step 3: Iterate over each calendar day from today through today + daysAhead.
  // "Today" is midnight UTC so all date comparisons are consistent.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Midnight UTC — timezone-agnostic

  const slotsToCreate = [];

  for (let i = 0; i <= daysAhead; i++) {
    // Construct the candidate date for day i
    const candidateDate = new Date(today);
    candidateDate.setUTCDate(today.getUTCDate() + i);

    // Skip days that don't match the rule's day of week.
    // getUTCDay() returns 0 (Sunday) through 6 (Saturday), matching our schema.
    if (candidateDate.getUTCDay() !== availabilityRule.dayOfWeek) {
      continue;
    }

    // Step 4: Slice the availability window [startTime, endTime) into chunks
    // of `durationMinutes`, creating one Slot per chunk.
    //
    // Example: 09:00–12:00 at 60 min → [09:00–10:00, 10:00–11:00, 11:00–12:00]
    // The loop ends when the next chunk's end would exceed the window's end.

    // Availability window start and end as minutes-since-midnight
    const windowStartMinutes = startHour * 60 + startMin;
    const windowEndMinutes = endHour * 60 + endMin;

    let chunkStart = windowStartMinutes;

    while (chunkStart + durationMinutes <= windowEndMinutes) {
      const chunkEnd = chunkStart + durationMinutes;

      // Build full UTC Date objects for this slot's start and end
      const slotStart = new Date(candidateDate);
      slotStart.setUTCHours(Math.floor(chunkStart / 60), chunkStart % 60, 0, 0);

      const slotEnd = new Date(candidateDate);
      slotEnd.setUTCHours(Math.floor(chunkEnd / 60), chunkEnd % 60, 0, 0);

      // Step 5: Idempotency guard — don't create a duplicate slot.
      // We check by (mentor, exact startTime). This handles the case where
      // generateSlotsForAvailability is called multiple times for the same rule
      // (e.g. dev restarts, retries after a partial failure).
      // We collect all candidates first and do a bulk check below.
      slotsToCreate.push({
        mentor: availabilityRule.mentor,
        availabilityRule: availabilityRule._id,
        date: new Date(candidateDate), // midnight UTC of this day
        startTime: slotStart,
        endTime: slotEnd,
      });

      chunkStart = chunkEnd; // Advance to the next chunk
    }
  }

  if (slotsToCreate.length === 0) {
    return 0;
  }

  // Bulk idempotency check: find which of these startTimes already have a slot
  // for this mentor. We do one query instead of N queries (one per slot).
  const existingStartTimes = await Slot.find({
    mentor: availabilityRule.mentor,
    startTime: { $in: slotsToCreate.map((s) => s.startTime) },
  })
    .select('startTime')
    .lean();

  // Build a Set of existing startTime ISO strings for O(1) lookup
  const existingSet = new Set(existingStartTimes.map((s) => s.startTime.toISOString()));

  // Filter out slots that already exist
  const newSlots = slotsToCreate.filter((s) => !existingSet.has(s.startTime.toISOString()));

  if (newSlots.length === 0) {
    return 0;
  }

  // insertMany with ordered: false continues inserting remaining slots if one
  // fails (e.g. a race condition duplicate). The duplicate will just be skipped.
  await Slot.insertMany(newSlots, { ordered: false });

  return newSlots.length;
};

/**
 * cleanupAndRegenerateSlots — §7.2 update/delete flow.
 *
 * Called on availability rule update (with regenerate = true) or delete (regenerate = false).
 *
 * @param {Object} availabilityRule - The (already updated) Availability document
 * @param {boolean} regenerate - If true, re-run generation after cleanup. If false (delete), skip.
 * @returns {Promise<{ deleted: number, created: number }>}
 */
export const cleanupAndRegenerateSlots = async (availabilityRule, regenerate = true) => {
  const now = new Date();

  // Delete future AVAILABLE slots for this rule.
  // Conditions:
  //   - availabilityRule matches (so we only touch slots from THIS rule)
  //   - status = 'AVAILABLE' (BOOKED slots are preserved, mentor must cancel manually)
  //   - startTime > now (past slots are never touched)
  const result = await Slot.deleteMany({
    availabilityRule: availabilityRule._id,
    status: 'AVAILABLE',
    startTime: { $gt: now },
  });

  const deleted = result.deletedCount;
  let created = 0;

  if (regenerate) {
    // Re-generate with the (now-updated) rule parameters
    created = await generateSlotsForAvailability(availabilityRule);
  }
  // If not regenerating (delete path), we're done — no new slots created.

  return { deleted, created };
};
