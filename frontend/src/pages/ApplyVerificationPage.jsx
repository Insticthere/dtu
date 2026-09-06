import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { FileCheck, Scale, ArrowLeft, AlertCircle, Building2, MapPin } from 'lucide-react';

export default function ApplyVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedInstId = searchParams.get('instrumentId');

  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    instrumentId: preselectedInstId || '',
    applicationType: 'initial_verification',
    inspectionVenue: 'on_site',
    applicantRemarks: '',
  });

  useEffect(() => {
    loadInstruments();
  }, []);

  const loadInstruments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/instruments');
      const list = res.data.instruments || [];
      setInstruments(list);
      if (!formData.instrumentId && list.length > 0) {
        setFormData(prev => ({ ...prev, instrumentId: list[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/applications', formData);
      navigate(`/applications/${res.data.application._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit verification application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading your instruments...</div>;
  }

  if (instruments.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-lg">
        <Scale className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">No Instruments Registered</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          You must register an instrument before you can apply for verification and certification.
        </p>
        <button
          onClick={() => navigate('/instruments/new')}
          className="px-6 py-2.5 bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
        >
          Register Instrument Now
        </button>
      </div>
    );
  }

  const selectedInst = instruments.find(i => i._id === formData.instrumentId);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        
        <div className="p-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Apply for Legal Metrology Verification</h1>
              <p className="text-xs text-amber-100">Submit instrument for statutory stamping and certification under the Act</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          {/* Select Instrument */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Instrument to Verify *
            </label>
            <select
              value={formData.instrumentId}
              onChange={(e) => setFormData({ ...formData, instrumentId: e.target.value })}
              required
              className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {instruments.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.make} {i.model} (S/N: {i.serialNumber}) — {i.categoryId?.name}
                </option>
              ))}
            </select>
          </div>

          {selectedInst && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{selectedInst.make} - {selectedInst.model}</div>
              <div className="text-slate-500">Category: {selectedInst.categoryId?.name} | Standard: {selectedInst.categoryId?.applicableStandard}</div>
              <div className="text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{selectedInst.location?.address}, {selectedInst.location?.district}</span>
              </div>
            </div>
          )}

          {/* Verification Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Application Type
              </label>
              <select
                value={formData.applicationType}
                onChange={(e) => setFormData({ ...formData, applicationType: e.target.value })}
                className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="initial_verification">Initial Verification (New Instrument)</option>
                <option value="re_verification">Periodic Re-Verification / Re-Stamping</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Inspection Venue
              </label>
              <select
                value={formData.inspectionVenue}
                onChange={(e) => setFormData({ ...formData, inspectionVenue: e.target.value })}
                className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="on_site">On-Site Inspector Visit (Premises)</option>
                <option value="gatc_centre">Government Approved Test Centre (GATC Lab)</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Applicant Remarks / Preferred Timings
            </label>
            <textarea
              rows={3}
              value={formData.applicantRemarks}
              onChange={(e) => setFormData({ ...formData, applicantRemarks: e.target.value })}
              placeholder="e.g. Please arrange inspection in morning hours. Working weights available on site."
              className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-md disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting Application...' : 'Submit Verification Request'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
