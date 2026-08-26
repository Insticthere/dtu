/**
 * app.js — Express application entry point
 *
 * IMPORTANT: dotenv.config() is called FIRST, before any other imports that
 * might read process.env. We resolve the path two directories up (from
 * backend/src/ to the project root) so both backend and frontend share the
 * single root-level .env file — no per-package env files needed.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// __dirname is not available in ESM; reconstruct it from import.meta.url.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the project-root .env before anything else touches process.env.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import connectDB from './db.js';

// Route modules — each owns its resource's entire surface area
import authRoutes from './api/auth.js';
import mentorRoutes from './api/mentors.js';
import availabilityRoutes from './api/availability.js';
import bookingRoutes from './api/bookings.js';
import reviewRoutes from './api/reviews.js';
import adminRoutes from './api/admin.js';

// Central error handler — must be imported after routes
import errorHandler from './middleware/errorHandler.js';

const app = express();

// ── Connect to MongoDB Atlas ──────────────────────────────────────────────────
connectDB();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors());           // Safety net for direct API testing (Postman, curl).
                           // In-browser the same-origin setup means this is
                           // not load-bearing for the actual app.
app.use(express.json());   // Parse JSON request bodies.

// ── API routes ────────────────────────────────────────────────────────────────
// All routes are namespaced under /api so the frontend catch-all below
// never accidentally intercepts an API call.
app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/mentor', availabilityRoutes); // /api/mentor/availability — mentor-specific actions
// Mount bookings router under both /api/bookings and /api/mentor:
//   GET /api/mentor/bookings  → spec §8 route for mentor's incoming bookings
//   Other booking routes live under /api/bookings
app.use('/api/bookings', bookingRoutes);
app.use('/api/mentor', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// ── Static frontend (production only, non-serverless) ────────────────────────
// In production (standalone node server), Express serves the Vite build output.
// On Vercel, static files are served directly by Vercel CDN.
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  // Serve the built React app's static files (root dist or frontend/dist).
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));

  // Catch-all: for any route that is NOT /api/*, return index.html so that
  // React Router's client-side routing works on hard refresh / direct URL.
  // This MUST be registered AFTER all /api/* routes to avoid swallowing API 404s.
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Centralised error handler ─────────────────────────────────────────────────
// Must come after all routes. Any error thrown or passed to next(err) lands here.
app.use(errorHandler);

// ── Start server (only when run directly / locally, not in serverless) ────────
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

export default app;
