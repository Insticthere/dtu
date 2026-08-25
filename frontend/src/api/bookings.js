/**
 * api/bookings.js (frontend) — Booking API calls
 * Mirrors backend: api/bookings.js
 */
import client from './client.js';

export const bookingsApi = {
  /** Student: create a booking */
  create: async (mentorId, slotId) => {
    const res = await client.post('/bookings', { mentorId, slotId });
    return res.data;
  },

  /** Student: get my bookings */
  getMyBookings: async (status) => {
    const res = await client.get('/bookings/me', { params: status ? { status } : {} });
    return res.data;
  },

  /** Mentor: get my incoming bookings */
  getMentorBookings: async (status) => {
    const res = await client.get('/mentor/bookings', { params: status ? { status } : {} });
    return res.data;
  },

  /** Cancel a booking (student or mentor) */
  cancel: async (id) => {
    const res = await client.patch(`/bookings/${id}/cancel`);
    return res.data;
  },
};
