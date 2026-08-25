/**
 * api/auth.js (frontend) — Auth API calls
 * Mirrors backend: api/auth.js
 */
import client from './client.js';

export const authApi = {
  /** Register as student or mentor */
  register: async (data) => {
    const res = await client.post('/auth/register', data);
    return res.data;
  },

  /** Login and receive token + user */
  login: async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    return res.data;
  },

  /**
   * Get current user — used on mount to validate stored token.
   * Accepts token as param because it may be called before the
   * interceptor picks it up from localStorage.
   */
  getMe: async (token) => {
    const res = await client.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};
