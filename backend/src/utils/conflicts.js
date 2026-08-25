/**
 * utils/conflicts.js — Booking overlap detection
 *
 * This module provides the overlap check used in the booking creation flow (§7.3).
 * It is separated from api/bookings.js because:
 * 1. The same logic needs to be run for BOTH the mentor AND the student.
 * 2. Naming it explicitly makes it easy to test in isolation.
 *
 * Interval overlap formula:
 *   Two intervals [A_start, A_end) and [B_start, B_end) overlap if and only if:
 *     A_start < B_end  AND  A_end > B_start
 *   (Standard half-open interval test. Note strict inequalities — two sessions
 *    that share only an endpoint, e.g. 09:00–10:00 and 10:00–11:00, do NOT
 *    overlap. Back-to-back sessions are allowed.)
 */
import Booking from '../models/Booking.js';

/**
 * hasMentorConflict — checks whether the mentor already has a CONFIRMED booking
 * that overlaps the proposed slot's time window.
 *
 * @param {string|ObjectId} mentorId
 * @param {Date} startTime - Proposed session start
 * @param {Date} endTime   - Proposed session end
 * @param {string|null} excludeBookingId - Optional booking ID to exclude (used for rescheduling, not currently in spec but defensive)
 * @returns {Promise<boolean>} true if a conflict exists
 */
export const hasMentorConflict = async (mentorId, startTime, endTime, excludeBookingId = null) => {
  const query = {
    mentor: mentorId,
    status: 'CONFIRMED',
    // Overlap condition: existing.startTime < proposed.endTime AND existing.endTime > proposed.startTime
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await Booking.findOne(query).lean();
  return conflict !== null;
};

/**
 * hasStudentConflict — same overlap check but for the student side.
 * Prevents a student from booking two sessions that overlap in time.
 *
 * @param {string|ObjectId} studentId
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {string|null} excludeBookingId
 * @returns {Promise<boolean>} true if a conflict exists
 */
export const hasStudentConflict = async (studentId, startTime, endTime, excludeBookingId = null) => {
  const query = {
    student: studentId,
    status: 'CONFIRMED',
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await Booking.findOne(query).lean();
  return conflict !== null;
};
