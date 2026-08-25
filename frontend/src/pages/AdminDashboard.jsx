/**
 * pages/AdminDashboard.jsx — Admin overview with basic stats
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin.js';

const StatCard = ({ label, value, color = 'blue', icon }) => (
  <div className="card flex items-center space-x-4">
    <div className={`text-3xl bg-${color}-100 rounded-full p-3`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getDashboard()
      .then((data) => setStats(data.stats))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Platform overview and management</p>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <StatCard icon="👥" label="Total Users" value={stats.totalUsers} />
          <StatCard icon="🎓" label="Total Students" value={stats.totalStudents} color="green" />
          <StatCard icon="🏆" label="Total Mentors" value={stats.totalMentors} color="purple" />
          <StatCard icon="⏳" label="Pending Applications" value={stats.pendingApplications} color="yellow" />
          <StatCard icon="✅" label="Approved Mentors" value={stats.approvedMentors} color="green" />
          <StatCard icon="📅" label="Total Bookings" value={stats.totalBookings} color="blue" />
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/admin/applications" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-center space-x-4">
            <span className="text-3xl">📋</span>
            <div>
              <h2 className="font-semibold text-gray-900 group-hover:text-blue-600">Review Applications</h2>
              <p className="text-sm text-gray-500">Approve or reject pending mentor applications</p>
              {stats?.pendingApplications > 0 && (
                <span className="badge-pending mt-1 inline-block">{stats.pendingApplications} pending</span>
              )}
            </div>
          </div>
        </Link>
        <div className="card">
          <div className="flex items-center space-x-4">
            <span className="text-3xl">🔒</span>
            <div>
              <h2 className="font-semibold text-gray-900">Security Note</h2>
              <p className="text-sm text-gray-500">Admin accounts are not self-registrable. Created via seed.js from environment variables only.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
