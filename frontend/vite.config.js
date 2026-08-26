/**
 * vite.config.js — Vite configuration for the MentorConnect frontend
 *
 * Two important settings:
 *
 * 1. envDir: Points to the project root (one directory up from frontend/).
 *    This makes Vite read the shared root-level .env instead of expecting
 *    a separate frontend/.env file. Both backend and frontend share ONE config file.
 *
 * 2. server.proxy: In development, any request from the browser to /api/*
 *    is forwarded to the backend Express server on port 5000.
 *    This means the browser talks to Vite's own origin (port 5173), and Vite
 *    forwards the API calls — so there's zero CORS configuration needed.
 *    In production, Express serves the built frontend directly (same origin,
 *    same port), so no proxy is needed and no base URL config is required.
 *
 * This is why frontend/src/api/ files can just call '/api/...' with no base URL —
 * the code is identical in dev (Vite proxies it) and prod (Express serves it).
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },

  // Read .env from the project root, not from frontend/
  envDir: path.resolve(__dirname, '..'),

  server: {
    port: 5173,
    proxy: {
      // Forward all /api/* requests to the Express backend in development
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // No rewrite needed — the path /api/... goes to Express as /api/...
      },
    },
  },
});
