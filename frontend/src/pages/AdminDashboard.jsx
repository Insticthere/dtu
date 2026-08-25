/**
 * pages/AdminDashboard.jsx — Vercel-style admin overview
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin.js';
import { Alert, Icon } from '../components/ui/index.js';

const StatCard = ({ label, value, sub }) => (
  <div className="card">
    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{label}</p>
    <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{value ?? '—'}</p>
    {sub && <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{sub}</p>}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getDashboard()
      .then((d) => setStats(d.stats))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner" /></div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Users" value={stats.totalUsers} />
            <StatCard label="Students" value={stats.totalStudents} />
            <StatCard label="Mentors" value={stats.totalMentors} />
            <StatCard label="Pending" value={stats.pendingApplications} sub="Awaiting review" />
            <StatCard label="Approved Mentors" value={stats.approvedMentors} />
            <StatCard label="Total Bookings" value={stats.totalBookings} />
          </div>

          {/* Divider */}
          <div className="divider mb-8" />

          {/* Quick actions */}
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/admin/applications"
              className="card group hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Review Applications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Approve or reject mentor applications</p>
                {stats.pendingApplications > 0 && (
                  <span className="badge-pending mt-2 inline-block">{stats.pendingApplications} pending</span>
                )}
              </div>
              <Icon name="arrow-up-right" size={16} />
            </Link>

            <div className="card bg-gray-50 dark:bg-gray-950">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Security</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Admin accounts are created only via <code className="font-mono text-xs bg-gray-200 dark:bg-gray-800 px-1 rounded">npm run seed</code> from environment variables. No public registration.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
