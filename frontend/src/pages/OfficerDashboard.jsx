import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import {
  Scale,
  ClipboardCheck,
  Clock,
  Calendar,
  UserCheck,
  Building,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleVenue, setScheduleVenue] = useState('on_site');
  const [scheduleRemarks, setScheduleRemarks] = useState('');
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [sumRes, appRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/applications')
      ]);
      setSummary(sumRes.data.metrics);
      setApplications(appRes.data.applications || []);
    } catch (err) {
      console.error('Error fetching officer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setScheduling(true);
      await api.patch(`/applications/${selectedApp._id}/schedule`, {
        scheduledDate: scheduleDate,
        inspectionVenue: scheduleVenue,
        officerRemarks: scheduleRemarks
      });
      setSelectedApp(null);
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule inspection');
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="text-slate-500 text-sm mt-3">Loading statutory inspection queue...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">
              {user?.name}
            </h1>
            <span className="bg-blue-100 text-blue-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 uppercase">
              {user?.role === 'gatc' ? 'GATC Testing Lab' : 'Legal Metrology Officer'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Badge: <span className="font-mono font-semibold text-slate-800">{user?.badgeNumber || 'LMO-DL-401'}</span> • Jurisdiction: <span className="font-semibold text-slate-800">{user?.jurisdictionDistrict || 'Central Delhi'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
            <div className="font-bold text-slate-700">Department Mandate</div>
            <div className="text-slate-500">Legal Metrology Act, 2009</div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Assigned to Me</span>
            <div className="text-2xl font-black text-slate-900">{summary?.assignedToMe || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Pending Inspection</span>
            <div className="text-2xl font-black text-amber-700">{summary?.pendingInspection || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Unassigned Pool</span>
            <div className="text-2xl font-black text-purple-700">{summary?.unassignedPool || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Completed & Certified</span>
            <div className="text-2xl font-black text-emerald-700">{summary?.completedInspections || 0}</div>
          </div>
        </div>
      </div>

      {/* Main Verification Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-700" />
              Inspection & Verification Queue
            </h2>
            <p className="text-xs text-slate-500">Scheduled field visits and testing centre verifications</p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No verification applications currently in queue.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">App Number</th>
                  <th className="px-5 py-3">Instrument & Category</th>
                  <th className="px-5 py-3">Trader / Owner</th>
                  <th className="px-5 py-3">Premises Location</th>
                  <th className="px-5 py-3">Scheduled Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Verification Action</th>
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
                      <div className="text-[11px] text-slate-500">{app.instrumentId?.categoryId?.name} • S/N: {app.instrumentId?.serialNumber}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{app.userId?.orgDetails?.companyName || app.userId?.name}</div>
                      <div className="text-[11px] text-slate-500">{app.userId?.phone}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div className="truncate max-w-[180px]">{app.instrumentId?.location?.address}</div>
                      <div className="text-[11px] text-slate-500">{app.instrumentId?.location?.district}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {app.scheduledDate ? (
                        <span className="font-semibold text-slate-800">
                          {new Date(app.scheduledDate).toLocaleDateString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">Unscheduled</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      {['Submitted', 'Scheduled'].includes(app.status) && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setScheduleDate(app.scheduledDate ? new Date(app.scheduledDate).toISOString().split('T')[0] : '');
                              setScheduleVenue(app.inspectionVenue || 'on_site');
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Schedule
                          </button>
                          <Link
                            to={`/inspection/${app._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" /> Inspect
                          </Link>
                        </>
                      )}

                      {app.status === 'Certified' && app.certificateId && (
                        <Link
                          to={`/certificates/${app.certificateId.certificateNumber || app.certificateId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> Certificate
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Schedule Verification Inspection
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Application: <span className="font-mono font-bold text-blue-900">{selectedApp.applicationNumber}</span>
            </p>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inspection Date *
                </label>
                <input
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inspection Venue
                </label>
                <select
                  value={scheduleVenue}
                  onChange={(e) => setScheduleVenue(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="on_site">On-Site Trader Premises</option>
                  <option value="gatc_centre">GATC Testing Laboratory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Officer Notes / Instructions for Applicant
                </label>
                <textarea
                  rows={2}
                  value={scheduleRemarks}
                  onChange={(e) => setScheduleRemarks(e.target.value)}
                  placeholder="e.g. Ensure instrument is powered and clean before inspection."
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {scheduling ? 'Saving...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
