/**
 * components/Navbar.jsx — Top navigation bar
 *
 * Shows different navigation links based on the user's role:
 * - Public: Login, Register
 * - Student: Dashboard, Find Mentors, My Bookings, Logout
 * - Mentor: Dashboard, Availability, Bookings, Logout
 * - Admin: Applications, Dashboard, Logout
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">MentorConnect</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {!user && (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </>
            )}

            {user?.role === 'student' && (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Dashboard</Link>
                <Link to="/mentors" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Find Mentors</Link>
                <Link to="/my-bookings" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">My Bookings</Link>
              </>
            )}

            {user?.role === 'mentor' && (
              <>
                <Link to="/mentor/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Dashboard</Link>
                <Link to="/mentor/availability" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Availability</Link>
                <Link to="/mentor/bookings" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Bookings</Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link to="/admin/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Dashboard</Link>
                <Link to="/admin/applications" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Applications</Link>
              </>
            )}

            {user && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  {user.name} <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{user.role}</span>
                </span>
                <button onClick={handleLogout} className="btn-secondary text-sm">Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
