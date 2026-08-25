/**
 * api/client.js — Axios instance with auth header injection
 *
 * All API calls in this app go through this axios instance.
 * It automatically:
 *   1. Sets the base URL to '/api' (relative — works in both dev proxy and prod)
 *   2. Injects the JWT Authorization header from localStorage if present
 *   3. Extracts the error message from the server's { message } response
 *      so callers just catch a plain Error with a readable message
 *
 * Why no base URL like 'http://localhost:5000'?
 * In dev, Vite proxies /api/* to Express. In prod, Express serves the frontend
 * directly. So '/api/...' always reaches Express regardless of environment.
 */
import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — inject auth token ───────────────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — normalize error messages ───────────────────────────
client.interceptors.response.use(
  (response) => response, // Pass through successful responses unchanged
  (error) => {
    // Extract the server's error message (our API always returns { message: "..." })
    // Fall back to a generic message if the network is down or response is malformed.
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    // Re-throw as a plain Error with the extracted message
    // This means all callers can just: catch (err) { setError(err.message) }
    return Promise.reject(new Error(message));
  }
);

export default client;
