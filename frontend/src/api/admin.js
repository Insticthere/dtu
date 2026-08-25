/**
 * api/admin.js (frontend) — Admin API calls
 * Mirrors backend: api/admin.js
 */
import client from './client.js';

export const adminApi = {
  /** List mentor applications with optional status/search filters */
  listApplications: async (params = {}) => {
    const res = await client.get('/admin/mentor-applications', { params });
    return res.data;
  },

  /** Approve a mentor application by MentorProfile ID */
  approve: async (id) => {
    const res = await client.patch(`/admin/mentor-applications/${id}/approve`);
    return res.data;
  },

  /** Reject a mentor application by MentorProfile ID */
  reject: async (id) => {
    const res = await client.patch(`/admin/mentor-applications/${id}/reject`);
    return res.data;
  },

  /** Get dashboard stats */
  getDashboard: async () => {
    const res = await client.get('/admin/dashboard');
    return res.data;
  },
};
