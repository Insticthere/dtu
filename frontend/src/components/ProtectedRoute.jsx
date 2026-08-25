/**
 * components/ProtectedRoute.jsx — Role-gated route wrapper
 *
 * Usage:
 *   <ProtectedRoute roles={['student']}>
 *     <StudentDashboard />
 *   </ProtectedRoute>
 *
 * Behavior:
 * - While auth is loading (initial token validation): show a spinner
 * - Not logged in: redirect to /login with `from` state so we can redirect back
 * - Logged in but wrong role: redirect to their appropriate dashboard
 * - Correct role: render children
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Map roles to their home dashboard pages */
const ROLE_HOME = {
  student: '/dashboard',
  mentor: '/mentor/dashboard',
  admin: '/admin/dashboard',
};

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show a full-page spinner while the initial auth check is in progress
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Not logged in — redirect to login, remembering where they were going
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role — send them to their appropriate home
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;
