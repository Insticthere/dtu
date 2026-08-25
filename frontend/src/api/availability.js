/**
 * api/availability.js (frontend) — Mentor availability API calls
 * Mirrors backend: api/availability.js
 */
import client from './client.js';

export const availabilityApi = {
  /** List the current mentor's availability rules */
  list: async () => {
    const res = await client.get('/mentor/availability');
    return res.data;
  },

  /** Create a new availability rule */
  create: async (data) => {
    const res = await client.post('/mentor/availability', data);
    return res.data;
  },

  /** Update an existing availability rule */
  update: async (id, data) => {
    const res = await client.put(`/mentor/availability/${id}`, data);
    return res.data;
  },

  /** Soft-delete an availability rule */
  remove: async (id) => {
    const res = await client.delete(`/mentor/availability/${id}`);
    return res.data;
  },
};
