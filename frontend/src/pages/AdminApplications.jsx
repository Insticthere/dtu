/**
 * pages/AdminApplications.jsx — Vercel-style admin applications table
 */
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.js';
import { Alert, Icon } from '../components/ui/index.js';
import { STATUS_BADGE_CLASS } from '../utils/constants.js';

const AdminApplications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(null);

  const fetchApps = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const d = await adminApi.listApplications(params);
      setApps(d.applications || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchApps, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchApps, search]);

  const act = async (fn, app) => {
    setProcessing(app._id); setError(''); setSuccess('');
    try { const r = await fn(app._id); setSuccess(r.message); await fetchApps(); }
    catch (e) { setError(e.message); }
    finally { setProcessing(null); }
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="mb-8">
        <h1 className="page-title">Mentor Applications</h1>
        <p className="page-subtitle">Review and approve mentor applications</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon name="search" size={16} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-full sm:max-w-[180px]"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner" /></div>
      ) : apps.length === 0 ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-16">No applications found.</p>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app._id} className="card">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {app.user?.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{app.user?.name}</span>
                      <span className={STATUS_BADGE_CLASS[app.applicationStatus]}>{app.applicationStatus}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{app.user?.email}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{app.professionalTitle}</p>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {app.expertise?.map((t) => <span key={t} className="tag">{t}</span>)}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{app.yearsOfExperience}y exp</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                      <span>{app.preferredSessionDuration} min</span>
                      {app.profileUrl && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                          <a href={app.profileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors">Profile →</a>
                        </>
                      )}
                    </div>

                    {app.bio && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 leading-relaxed italic max-w-xl">
                        "{app.bio.substring(0, 140)}{app.bio.length > 140 ? '…' : ''}"
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                      Applied {new Date(app.createdAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {app.applicationStatus === 'PENDING' && (
                  <div className="flex space-x-2 shrink-0">
                    <button onClick={() => act(adminApi.approve, app)} disabled={processing === app._id} className="btn-primary text-xs px-4 py-2">
                      {processing === app._id ? '…' : 'Approve'}
                    </button>
                    <button onClick={() => act(adminApi.reject, app)} disabled={processing === app._id} className="btn-danger text-xs px-4 py-2">
                      {processing === app._id ? '…' : 'Reject'}
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
