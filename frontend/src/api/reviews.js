/**
 * api/reviews.js (frontend) — Reviews API calls
 * Mirrors backend: api/reviews.js
 */
import client from './client.js';

export const reviewsApi = {
  /** Student: submit a review for a completed booking */
  create: async (bookingId, rating, feedback) => {
    const res = await client.post('/reviews', { bookingId, rating, feedback });
    return res.data;
  },
};
