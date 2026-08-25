/**
 * api/mentors.js (frontend) — Mentor discovery API calls
 * Mirrors backend: api/mentors.js
 */
import client from './client.js';

export const mentorsApi = {
  /** Get approved mentors list with optional search/expertise filter */
  list: async (params = {}) => {
    const res = await client.get('/mentors', { params });
    return res.data;
  },

  /** Get single approved mentor profile */
  getById: async (id) => {
    const res = await client.get(`/mentors/${id}`);
    return res.data;
  },

  /** Get future AVAILABLE slots for a mentor */
  getSlots: async (id, days = 10) => {
    const res = await client.get(`/mentors/${id}/slots`, { params: { days } });
    return res.data;
  },

  /** Get reviews for a mentor */
  getReviews: async (id) => {
    const res = await client.get(`/mentors/${id}/reviews`);
    return res.data;
  },
};
