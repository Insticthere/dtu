import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  Scale,
  Users,
  ShieldCheck,
  AlertTriangle,
  Layers,
  FileCheck,
  UserCheck,
  Calendar,
  Building,
  Plus,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  BadgeCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [applications, setApplications] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [allOfficers, setAllOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocatingAppId, setAllocatingAppId] = useState(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [sumRes, appRes, offRes, allOffRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/applications'),
        api.get('/users/officers'),
        api.get('/users').catch(() => ({ data: { users: [] } }))
      ]);

      setSummary(sumRes.data);
      setApplications(appRes.data.applications || []);
      setOfficers(offRes.data.officers || []);
      // Filter only officer-role users from all users
      const officerUsers = (allOffRes.data.users || []).filter(u => ['lmo', 'gatc'].includes(u.role));
      setAllOfficers(officerUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOfficer = async (officerId, approve) => {
    try {
      setApprovingId(officerId);
      await api.patch(`/users/${officerId}/approve`, { approved: approve });
      loadAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update officer status.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleResetDemo = async () => {
    try {
      setResetting(true);
      setShowResetConfirm(false);
      const res = await api.post('/admin/reset-demo');
      alert(`✅ ${res.data.message}\n\nYou will be logged out. Log back in with:\n• Admin: admin@metrology.gov.in\n• Password: password123`);
      // Clear JWT and reload — the admin user was re-created with a new _id
      localStorage.removeItem('lm_token');
      localStorage.removeItem('lm_user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      alert(`Reset failed: ${err.response?.data?.message || err.message}`);
      setResetting(false);
    }
  };

  const handleAllocate = async (appId) => {
    if (!selectedOfficerId) {
      alert('Please select an officer to assign.');
      return;
    }

    try {
      await api.patch(`/applications/${appId}/schedule`, {
        assignedOfficerId: selectedOfficerId,
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      });
      setAllocatingAppId(null);
      setSelectedOfficerId('');
      loadAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to allocate officer.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="text-slate-500 text-sm mt-3">Loading State Legal Metrology Console...</p>
      </div>
    );
  }

  const metrics = summary?.metrics || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black">
              State Metrology Administration HQ
            </h1>
            <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-400/30">
              Controller Portal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Directorate of Legal Metrology • State-Wide Application Allocation & Category Management
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/instruments/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-md transition-all border border-slate-700"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Register Instrument
          </Link>
          <Link
            to="/admin/categories"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Layers className="w-4 h-4" />
            Manage Dynamic Categories
          </Link>
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md transition-all border border-rose-500 disabled:opacity-60"
            title="Wipe all data and re-seed the demo database"
          >
            <AlertTriangle className="w-4 h-4" />
            {resetting ? 'Resetting…' : 'Reset Demo Data'}
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-rose-700 px-6 py-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white" />
              <h2 className="text-white font-black text-lg">⚠️ Reset Demo Database?</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-700 text-sm leading-relaxed">
                This will <strong>permanently delete ALL data</strong> — instruments, applications, certificates, users, and notifications — and replace everything with fresh seed data.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                <div className="font-bold mb-1">After reset, log in with:</div>
                <div>Admin: <span className="font-mono">admin@metrology.gov.in</span></div>
                <div>LMO: <span className="font-mono">lmo.verma@metrology.gov.in</span></div>
                <div>GATC: <span className="font-mono">gatc.lab@testcentre.org</span></div>
                <div>Password for all: <span className="font-mono font-bold">password123</span></div>
              </div>
              <p className="text-xs text-slate-500">
                ✅ All QR codes in the new seed data will point to: <code className="bg-slate-100 px-1 rounded">{window.location.origin}</code>
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDemo}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow transition-colors"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State-Wide Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Instruments</span>
            <div className="text-2xl font-black text-slate-900">{metrics.totalInstruments || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Active & Certified</span>
            <div className="text-2xl font-black text-emerald-700">{metrics.activeVerifiedInstruments || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Pending Allocation</span>
            <div className="text-2xl font-black text-amber-700">{metrics.pendingApplications || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Registered Officers</span>
            <div className="text-2xl font-black text-purple-700">{metrics.totalOfficers || 0}</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Badges */}
      {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            Active Instrument Category Distribution
          </h3>
          <div className="flex flex-wrap gap-3">
            {summary.categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <span className="font-semibold text-slate-800">{cat.name}:</span>
                <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">{cat.count} Units</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Allocation Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-700" />
              State Application Allocation Queue
            </h2>
            <p className="text-xs text-slate-500">Assign incoming verification requests to LMO Inspectors or GATC Centres</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">App Number</th>
                <th className="px-5 py-3">Instrument Category</th>
                <th className="px-5 py-3">Applicant / Trader</th>
                <th className="px-5 py-3">District</th>
                <th className="px-5 py-3">Assigned Officer</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Allocation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {applications.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-blue-900">
                    {app.applicationNumber}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">{app.instrumentId?.make} {app.instrumentId?.model}</div>
                    <div className="text-[11px] text-slate-500">{app.instrumentId?.categoryId?.name}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">{app.userId?.name}</div>
                    <div className="text-[11px] text-slate-500">{app.userId?.orgDetails?.companyName || 'Trader'}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {app.instrumentId?.location?.district}
                  </td>
                  <td className="px-5 py-4">
                    {app.assignedOfficerId ? (
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        {app.assignedOfficerId.name} ({app.assignedOfficerId.badgeNumber || 'LMO'})
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    {allocatingAppId === app._id ? (
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={selectedOfficerId}
                          onChange={(e) => setSelectedOfficerId(e.target.value)}
                          className="text-xs rounded-lg border-slate-300 border p-1 bg-white"
                        >
                          <option value="">-- Choose Officer --</option>
                          {officers.map((off) => (
                            <option key={off._id} value={off._id}>
                              {off.name} ({off.role.toUpperCase()} - {off.badgeNumber})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAllocate(app._id)}
                          className="px-2.5 py-1 bg-blue-700 text-white rounded text-xs font-bold"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => setAllocatingAppId(null)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAllocatingAppId(app._id);
                          setSelectedOfficerId(app.assignedOfficerId?._id || '');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        {app.assignedOfficerId ? 'Re-assign' : 'Assign Officer'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Officer Management Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-purple-700" />
              Officer & GATC Centre Management
            </h2>
            <p className="text-xs text-slate-500">Approve, verify or revoke access for LMO Inspectors and GATC Testing Centres</p>
          </div>
        </div>

        {allOfficers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No LMO/GATC officer accounts registered yet.</div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Name / Badge</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Jurisdiction</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {allOfficers.map((off) => (
                  <tr key={off._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{off.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{off.badgeNumber || 'No badge assigned'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        off.role === 'gatc'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {off.role === 'gatc' ? 'GATC Lab' : 'LMO Inspector'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{off.email}</td>
                    <td className="px-5 py-4 text-slate-600">{off.jurisdictionDistrict || off.orgDetails?.district || 'N/A'}</td>
                    <td className="px-5 py-4">
                      {off.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Verified & Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <ShieldAlert className="w-3 h-3" /> Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      {off.isApproved ? (
                        <button
                          onClick={() => handleApproveOfficer(off._id, false)}
                          disabled={approvingId === off._id}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {approvingId === off._id ? 'Revoking...' : 'Revoke Access'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproveOfficer(off._id, true)}
                          disabled={approvingId === off._id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {approvingId === off._id ? 'Approving...' : 'Approve Officer'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
