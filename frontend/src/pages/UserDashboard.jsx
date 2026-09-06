import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import {
  Scale,
  PlusCircle,
  FileCheck,
  Award,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Eye
} from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, instRes, appRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/instruments'),
        api.get('/applications')
      ]);

      setSummary(sumRes.data.metrics);
      setInstruments(instRes.data.instruments || []);
      setApplications(appRes.data.applications || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="text-slate-500 text-sm mt-3">Loading your metrology instruments and applications...</p>
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
              Welcome, {user?.name}
            </h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">
              Trader Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {user?.orgDetails?.companyName ? `${user.orgDetails.companyName} • ` : ''}
            {user?.orgDetails?.district || 'Delhi'}, {user?.orgDetails?.state || 'India'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/instruments/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            Add Instrument
          </Link>
          <Link
            to="/apply"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <FileCheck className="w-4 h-4" />
            Apply for Verification
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Instruments</span>
            <div className="text-2xl font-black text-slate-900">{summary?.totalInstruments || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Active & Certified</span>
            <div className="text-2xl font-black text-emerald-700">{summary?.activeInstruments || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Verification In-Progress</span>
            <div className="text-2xl font-black text-amber-700">{summary?.inProgressApplications || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Expiring / Overdue</span>
            <div className="text-2xl font-black text-rose-700">{summary?.expiringSoonCount || summary?.expired || 0}</div>
          </div>
        </div>
      </div>

      {/* Applications Queue Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-700" />
              Verification Applications Status
            </h2>
            <p className="text-xs text-slate-500">Track stage progress for pending and completed verifications</p>
          </div>
          <Link to="/apply" className="text-xs font-bold text-blue-700 hover:text-blue-900">
            + New Application
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No verification applications submitted yet. Click "Apply for Verification" to start.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Application Ref</th>
                  <th className="px-5 py-3">Instrument Details</th>
                  <th className="px-5 py-3">Submitted Date</th>
                  <th className="px-5 py-3">Scheduled / Assigned</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
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
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(app.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {app.scheduledDate ? (
                        <span className="font-medium text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {new Date(app.scheduledDate).toLocaleDateString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending schedule</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <Link
                        to={`/applications/${app._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </Link>
                      {app.status === 'Certified' && app.certificateId && (
                        <Link
                          to={`/certificates/${app.certificateId.certificateNumber || app.certificateId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                        >
                          <Award className="w-3.5 h-3.5" /> Certificate
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

      {/* Registered Instruments List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              Registered Measuring Instruments
            </h2>
            <p className="text-xs text-slate-500">All registered weighing and measuring equipment under your ownership</p>
          </div>
          <Link
            to="/instruments/new"
            className="text-xs font-bold text-blue-700 hover:text-blue-900"
          >
            + Register New
          </Link>
        </div>

        {instruments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Scale className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No instruments registered yet</p>
            <p className="text-xs text-slate-400 mt-1">Register your weighing scale, fuel dispenser, or analyser to start verification.</p>
            <Link
              to="/instruments/new"
              className="inline-block mt-4 px-4 py-2 bg-blue-700 text-white font-bold text-xs rounded-xl"
            >
              Register First Instrument
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5">
            {instruments.map((inst) => (
              <div
                key={inst._id}
                className="bg-slate-50/80 p-5 rounded-xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded uppercase">
                      {inst.categoryId?.name || 'Instrument'}
                    </span>
                    <StatusBadge status={inst.status} />
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{inst.make} - {inst.model}</h3>
                  <div className="font-mono text-xs text-slate-500 mt-0.5">S/N: {inst.serialNumber}</div>

                  <div className="mt-3 text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="truncate">
                      <strong>Location:</strong> {inst.location?.premisesName ? `${inst.location.premisesName}, ` : ''}{inst.location?.district}
                    </div>
                    {inst.specs && Object.keys(inst.specs).length > 0 && (
                      <div className="text-[11px] text-slate-500 truncate">
                        <strong>Specs:</strong> {Object.entries(inst.specs).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  {inst.activeCertificateId ? (
                    <Link
                      to={`/certificates/${inst.activeCertificateId.certificateNumber || inst.activeCertificateId}`}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
                    >
                      <Award className="w-3.5 h-3.5" /> View Certificate
                    </Link>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No active certificate</span>
                  )}

                  {inst.status !== 'pending_verification' && (
                    <Link
                      to={`/apply?instrumentId=${inst._id}`}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Apply Verification
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
