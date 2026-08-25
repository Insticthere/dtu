/**
 * App.jsx — Root React component: routing and auth context setup
 *
 * Structure:
 * - AuthProvider wraps everything (provides auth state globally)
 * - BrowserRouter handles client-side routing
 * - Navbar is always visible
 * - Routes are either public or wrapped in <ProtectedRoute roles={[...]}>
 *
 * Route access control:
 * - Public: /, /login, /register
 * - Student-only: /dashboard, /mentors, /mentors/:id, /my-bookings
 * - Mentor-only: /mentor/dashboard, /mentor/availability, /mentor/bookings
 * - Admin-only: /admin/dashboard, /admin/applications
 * - Any authenticated: /mentors (browse), /mentors/:id (view profile + book)
 *
 * Note: /mentors and /mentors/:id are gated to 'any authenticated' (not public)
 * because the API also requires authentication for these endpoints.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';

// Pages
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import MentorDirectory from './pages/MentorDirectory.jsx';
import MentorProfile from './pages/MentorProfile.jsx';
import MyBookings from './pages/MyBookings.jsx';
import MentorDashboard from './pages/MentorDashboard.jsx';
import MentorAvailability from './pages/MentorAvailability.jsx';
import MentorBookings from './pages/MentorBookings.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminApplications from './pages/AdminApplications.jsx';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Navbar is always rendered above all pages */}
        <Navbar />

        <Routes>
          {/* ── Public Routes ──────────────────────────────────────────── */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Student Routes ─────────────────────────────────────────── */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute roles={['student']}>
              <MyBookings />
            </ProtectedRoute>
          } />

          {/* Browse mentors — any authenticated user (student, mentor, admin can view) */}
          <Route path="/mentors" element={
            <ProtectedRoute roles={['student', 'mentor', 'admin']}>
              <MentorDirectory />
            </ProtectedRoute>
          } />
          <Route path="/mentors/:id" element={
            <ProtectedRoute roles={['student', 'mentor', 'admin']}>
              <MentorProfile />
            </ProtectedRoute>
          } />

          {/* ── Mentor Routes ──────────────────────────────────────────── */}
          <Route path="/mentor/dashboard" element={
            <ProtectedRoute roles={['mentor']}>
              <MentorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/mentor/availability" element={
            <ProtectedRoute roles={['mentor']}>
              <MentorAvailability />
            </ProtectedRoute>
          } />
          <Route path="/mentor/bookings" element={
            <ProtectedRoute roles={['mentor']}>
              <MentorBookings />
            </ProtectedRoute>
          } />

          {/* ── Admin Routes ───────────────────────────────────────────── */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/applications" element={
            <ProtectedRoute roles={['admin']}>
              <AdminApplications />
            </ProtectedRoute>
          } />

          {/* Catch-all: redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
