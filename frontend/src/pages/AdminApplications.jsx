/**
 * pages/AdminApplications.jsx — Admin view of mentor applications
 * Filter by status, search by name, approve or reject applications.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.js';

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(null); // Track which application is being processed

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const data = await adminApi.listApplications(params);
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchApplications, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchApplications, search]);

  const handleApprove = async (app) => {
    if (!window.confirm(`Approve ${app.user?.name}?`)) return;
    setProcessing(app._id);
    setError('');
    setSuccess('');
    try {
      const res = await adminApi.approve(app._id);
      setSuccess(res.message);
      await fetchApplications();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (app) => {
    if (!window.confirm(`Reject ${app.user?.name}'s application?`)) return;
    setProcessing(app._id);
    setError('');
    setSuccess('');
    try {
      const res = await adminApi.reject(app._id);
      setSuccess(res.message);
      await fetchApplications();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const STATUS_BADGE = { PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected' };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentor Applications</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
      ) : applications.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No applications found.</p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app._id} className="card">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">{app.user?.name}</h3>
                    <span className={STATUS_BADGE[app.applicationStatus]}>{app.applicationStatus}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{app.user?.email}</p>
                  <p className="text-sm text-gray-600 mt-1">{app.professionalTitle}</p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {app.expertise?.map((tag) => (
                      <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{tag}</span>
                    ))}
                  </div>

                  <div className="mt-2 text-sm text-gray-500 space-y-1">
                    <p>📅 {app.yearsOfExperience} years experience · ⏱ {app.preferredSessionDuration} min sessions</p>
                    <p className="text-gray-600 italic">"{app.bio?.substring(0, 120)}{app.bio?.length > 120 ? '...' : ''}"</p>
                    {app.profileUrl && (
                      <a href={app.profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">View Profile →</a>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Applied {new Date(app.createdAt).toLocaleDateString('en-IN')}</p>
                </div>

                {/* Action buttons */}
                {app.applicationStatus === 'PENDING' && (
                  <div className="flex space-x-2 shrink-0">
                    <button
                      onClick={() => handleApprove(app)}
                      disabled={processing === app._id}
                      className="btn-primary text-sm"
                    >
                      {processing === app._id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(app)}
                      disabled={processing === app._id}
                      className="btn-danger text-sm"
                    >
                      {processing === app._id ? '...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
