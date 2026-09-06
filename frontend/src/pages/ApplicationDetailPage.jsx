import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import DynamicInspectionForm from '../components/DynamicInspectionForm';
import {
  FileCheck,
  Scale,
  Calendar,
  UserCheck,
  Clock,
  ArrowLeft,
  Award,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Eye,
  Camera
} from 'lucide-react';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/applications/${id}`);
      setApplication(res.data.application);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading application details...</div>;
  }

  if (!application) {
    return (
      <div className="p-12 text-center text-slate-500">
        Application not found. <Link to="/dashboard" className="text-blue-700 underline">Back to dashboard</Link>
      </div>
    );
  }

  const instrument = application.instrumentId || {};
  const category = instrument.categoryId || {};
  const inspection = application.inspectionRecordId;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main Status Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {application.applicationNumber}
            </span>
            <StatusBadge status={application.status} />
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            {instrument.make} - {instrument.model}
          </h1>
          <p className="text-xs text-slate-500">
            Category: {category.name} • S/N: {instrument.serialNumber}
          </p>
        </div>

        {application.status === 'Certified' && application.certificateId && (
          <Link
            to={`/certificates/${application.certificateId.certificateNumber || application.certificateId}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <Award className="w-4 h-4" />
            View Issued Certificate
          </Link>
        )}
      </div>

      {/* 4-Step Visual Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-6">
          Statutory Verification Progress
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${
            ['Submitted', 'Scheduled', 'Inspected', 'Certified'].includes(application.status)
              ? 'bg-blue-50/70 border-blue-300 text-blue-900'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold">1. Submitted</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {new Date(application.createdAt).toLocaleDateString('en-IN')}
            </p>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col justify-between ${
            ['Scheduled', 'Inspected', 'Certified'].includes(application.status)
              ? 'bg-blue-50/70 border-blue-300 text-blue-900'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold">2. Scheduled</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {application.scheduledDate ? new Date(application.scheduledDate).toLocaleDateString('en-IN') : 'Awaiting allocation'}
            </p>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col justify-between ${
            ['Inspected', 'Certified', 'Rejected'].includes(application.status)
              ? 'bg-blue-50/70 border-blue-300 text-blue-900'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold">3. Inspected</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {inspection ? `${inspection.result} on ${new Date(inspection.conductedAt).toLocaleDateString('en-IN')}` : 'Pending test'}
            </p>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col justify-between ${
            application.status === 'Certified'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20'
              : application.status === 'Rejected'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {application.status === 'Certified' ? (
                <Award className="w-4 h-4 text-emerald-600" />
              ) : application.status === 'Rejected' ? (
                <XCircle className="w-4 h-4 text-rose-600" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-xs font-bold">4. {application.status === 'Rejected' ? 'Rejected' : 'Certified'}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {application.status === 'Certified' ? 'Stamped & Verified' : application.status === 'Rejected' ? 'Test Failed' : 'Final Step'}
            </p>
          </div>

        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Officer & Schedule Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
            Assigned Officer & Venue
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Assigned Officer:</span>
              <span className="font-semibold text-slate-800">
                {application.assignedOfficerId ? `${application.assignedOfficerId.name} (${application.assignedOfficerId.badgeNumber || 'DL-LMO'})` : 'Under Assignment'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Scheduled Inspection Date:</span>
              <span className="font-semibold text-slate-800">
                {application.scheduledDate ? new Date(application.scheduledDate).toLocaleDateString('en-IN') : 'Not scheduled yet'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Inspection Venue:</span>
              <span className="font-semibold text-slate-800">
                {application.inspectionVenue === 'gatc_centre' ? 'GATC Testing Laboratory' : 'On-Site Premises Visit'}
              </span>
            </div>

            {application.applicantRemarks && (
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Applicant Remarks:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 italic">
                  "{application.applicantRemarks}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instrument Location */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-600" />
            Instrument Location & Owner
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Owner Name:</span>
              <span className="font-semibold text-slate-800">{application.userId?.name}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Enterprise:</span>
              <span className="font-semibold text-slate-800">{application.userId?.orgDetails?.companyName || 'N/A'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Premises Address:</span>
              <span className="font-semibold text-slate-800 text-right">
                {instrument.location?.address}, {instrument.location?.district}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">Applicable Standard:</span>
              <span className="font-semibold text-slate-800">{category.applicableStandard || 'Legal Metrology Rules 2011'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recorded Inspection Results (If inspected) */}
      {inspection && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Official Inspection Observations & Tolerance Readings
            </h3>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              inspection.result === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              Result: {inspection.result}
            </span>
          </div>

          <DynamicInspectionForm
            schema={category.inspectionSchema || []}
            initialValues={inspection.observations || {}}
            readOnly={true}
          />

          {inspection.remarks && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Inspector Remarks / Security Seal:</span>
              <p className="text-slate-600">{inspection.remarks}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
