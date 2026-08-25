/**
 * App.jsx — Root component with ThemeProvider added
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
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
    // ThemeProvider must wrap everything so Navbar can access toggleTheme
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* ── Public ── */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── Student ── */}
            <Route path="/dashboard" element={
              <ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>
            } />
            <Route path="/my-bookings" element={
              <ProtectedRoute roles={['student']}><MyBookings /></ProtectedRoute>
            } />
            <Route path="/mentors" element={
              <ProtectedRoute roles={['student','mentor','admin']}><MentorDirectory /></ProtectedRoute>
            } />
            <Route path="/mentors/:id" element={
              <ProtectedRoute roles={['student','mentor','admin']}><MentorProfile /></ProtectedRoute>
            } />

            {/* ── Mentor ── */}
            <Route path="/mentor/dashboard" element={
              <ProtectedRoute roles={['mentor']}><MentorDashboard /></ProtectedRoute>
            } />
            <Route path="/mentor/availability" element={
              <ProtectedRoute roles={['mentor']}><MentorAvailability /></ProtectedRoute>
            } />
            <Route path="/mentor/bookings" element={
              <ProtectedRoute roles={['mentor']}><MentorBookings /></ProtectedRoute>
            } />

            {/* ── Admin ── */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/applications" element={
              <ProtectedRoute roles={['admin']}><AdminApplications /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
