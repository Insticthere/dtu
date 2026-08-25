/**
 * pages/MentorDashboard.jsx — Mentor's home page
 * Vercel-style clean status banners, profile overview, and quick links with dark mode.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi } from '../api/auth.js';
import { PageSpinner, PageHeader, Icon } from '../components/ui/index.js';

const STATUS_CONFIG = {
  PENDING: {
    icon: '⏳',
    badge: 'badge-pending',
    title: 'Application Under Review',
    message: "Your application is currently being reviewed by an admin. You will be able to set up availability and receive student bookings once approved.",
  },
  APPROVED: {
    icon: '✓',
    badge: 'badge-approved',
    title: 'Application Approved',
    message: "Your profile is verified and active. You can manage your recurring weekly availability and view upcoming student bookings.",
  },
  REJECTED: {
    icon: '✕',
    badge: 'badge-rejected',
    title: 'Application Not Approved',
    message: "Unfortunately, your application was not approved. Please reach out to support if you'd like more details.",
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
    return <PageSpinner />;
  }

  const status = profile?.applicationStatus || 'PENDING';
  const config = STATUS_CONFIG[status];

  return (
    <div className="page-container">
      <PageHeader
        title="Mentor Dashboard"
        subtitle={`Welcome back, ${user?.name}`}
      />

      {/* Application Status Banner */}
      <div className="card mb-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-start gap-4 p-6">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-lg shrink-0 border border-gray-200/60 dark:border-gray-800">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{config.title}</h2>
            <span className={config.badge}>{status}</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            {config.message}
          </p>
        </div>
      </div>

      {/* Profile summary */}
      {profile && (
        <div className="card mb-6 p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800/80 pb-3">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Profile Summary
            </h3>
            {profile.profileUrl && (
              <a
                href={profile.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>LinkedIn / Portfolio</span>
                <Icon name="arrow-up-right" size={12} />
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Title</p>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5 truncate">{profile.professionalTitle}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Experience</p>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5">{profile.yearsOfExperience} years</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Session Duration</p>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5">{profile.preferredSessionDuration} min</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Rating</p>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                {profile.totalReviews > 0
                  ? `★ ${profile.averageRating.toFixed(1)} (${profile.totalReviews})`
                  : 'No reviews yet'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Expertise</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.expertise?.map((exp) => (
                <span key={exp} className="tag">
                  {exp}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions (only for approved mentors) */}
      {status === 'APPROVED' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/mentor/availability"
            className="card group p-6 border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 block"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">📅</span>
              <Icon
                name="arrow-up-right"
                size={16}
                className="text-gray-300 group-hover:text-gray-600 dark:text-gray-700 dark:group-hover:text-gray-300 transition-colors"
              />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Manage Availability</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Add or adjust your recurring weekly schedule and time windows
            </p>
          </Link>

          <Link
            to="/mentor/bookings"
            className="card group p-6 border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 block"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">📋</span>
              <Icon
                name="arrow-up-right"
                size={16}
                className="text-gray-300 group-hover:text-gray-600 dark:text-gray-700 dark:group-hover:text-gray-300 transition-colors"
              />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">View Bookings</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Track student bookings, upcoming sessions, and cancellations
            </p>
          </Link>
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;
