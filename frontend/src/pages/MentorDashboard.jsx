/**
 * pages/MentorDashboard.jsx — Mentor's home page
 * Shows application status (PENDING / REJECTED / APPROVED) with appropriate messaging.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi } from '../api/auth.js';

const STATUS_CONFIG = {
  PENDING: {
    icon: '⏳',
    color: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-800',
    badge: 'badge-pending',
    title: 'Application Under Review',
    message: 'Your mentor application has been submitted and is waiting for admin review. You\'ll receive access to availability management once approved.',
  },
  APPROVED: {
    icon: '✅',
    color: 'bg-green-50 border-green-200',
    textColor: 'text-green-800',
    badge: 'badge-approved',
    title: 'Application Approved!',
    message: 'Your application has been approved. You can now set your availability and start accepting bookings.',
  },
  REJECTED: {
    icon: '❌',
    color: 'bg-red-50 border-red-200',
    textColor: 'text-red-800',
    badge: 'badge-rejected',
    title: 'Application Not Approved',
    message: 'Unfortunately, your application was not approved at this time. Please contact support for more information.',
  },
};

const MentorDashboard = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getMe(token)
      .then((data) => setProfile(data.user.mentorProfile))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  }

  const status = profile?.applicationStatus || 'PENDING';
  const config = STATUS_CONFIG[status];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mentor Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.name}!</p>
      </div>

      {/* Application Status Banner */}
      <div className={`p-6 rounded-xl border mb-8 ${config.color}`}>
        <div className="flex items-center space-x-3 mb-2">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h2 className={`text-lg font-semibold ${config.textColor}`}>{config.title}</h2>
            <span className={config.badge}>{status}</span>
          </div>
        </div>
        <p className={`text-sm mt-2 ${config.textColor}`}>{config.message}</p>
      </div>

      {/* Profile summary */}
      {profile && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Your Profile</h3>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
            <div><span className="font-medium">Title:</span> {profile.professionalTitle}</div>
            <div><span className="font-medium">Experience:</span> {profile.yearsOfExperience} years</div>
            <div><span className="font-medium">Session Duration:</span> {profile.preferredSessionDuration} min</div>
            <div><span className="font-medium">Rating:</span> {profile.totalReviews > 0 ? `${profile.averageRating.toFixed(1)} ★ (${profile.totalReviews} reviews)` : 'No reviews yet'}</div>
            <div className="col-span-2"><span className="font-medium">Expertise:</span> {profile.expertise?.join(', ')}</div>
          </div>
        </div>
      )}

      {/* Actions (only for approved mentors) */}
      {status === 'APPROVED' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/mentor/availability" className="card hover:shadow-md transition-shadow text-center group">
            <div className="text-4xl mb-3">📅</div>
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">Manage Availability</h2>
            <p className="text-sm text-gray-500 mt-1">Add or edit your weekly schedule</p>
          </Link>
          <Link to="/mentor/bookings" className="card hover:shadow-md transition-shadow text-center group">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">View Bookings</h2>
            <p className="text-sm text-gray-500 mt-1">See your upcoming and past sessions</p>
          </Link>
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;
