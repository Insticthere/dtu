/**
 * pages/StudentDashboard.jsx — Student's home page after login
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
        <p className="text-gray-500 mt-1">Find a mentor and book your next session.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/mentors" className="card hover:shadow-md transition-shadow text-center group">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">Find Mentors</h2>
          <p className="text-sm text-gray-500 mt-1">Browse our directory of approved mentors</p>
        </Link>

        <Link to="/my-bookings" className="card hover:shadow-md transition-shadow text-center group">
          <div className="text-4xl mb-3">📅</div>
          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">My Bookings</h2>
          <p className="text-sm text-gray-500 mt-1">View upcoming and past sessions</p>
        </Link>

        <div className="card text-center">
          <div className="text-4xl mb-3">⭐</div>
          <h2 className="text-lg font-semibold text-gray-900">Leave Reviews</h2>
          <p className="text-sm text-gray-500 mt-1">Rate completed sessions from My Bookings</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
