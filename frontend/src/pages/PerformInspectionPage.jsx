import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import DynamicInspectionForm from '../components/DynamicInspectionForm';
import {
  Scale,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  AlertCircle,
  Camera,
  Layers,
  Thermometer,
  ShieldCheck,
  UploadCloud
} from 'lucide-react';

export default function PerformInspectionPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [observations, setObservations] = useState({});
  const [result, setResult] = useState('Pass');
  const [remarks, setRemarks] = useState('');
  const [tempC, setTempC] = useState('24.0');
  const [humidityPct, setHumidityPct] = useState('50');
  const [standardsText, setStandardsText] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  useEffect(() => {
    loadApplicationData();
  }, [applicationId]);

  const loadApplicationData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/applications/${applicationId}`);
      const app = res.data.application;
      setApplication(app);

      // Pre-fill default observations from category schema
      const category = app.instrumentId?.categoryId;
      if (category && category.inspectionSchema) {
        const defaultObs = {};
        category.inspectionSchema.forEach(f => {
          if (f.default !== undefined) defaultObs[f.id] = f.default;
          else if (f.type === 'select') defaultObs[f.id] = 'Pass';
        });
        setObservations(defaultObs);
      }

      // Pre-fill default working standards
      setStandardsText(`Standard Working Reference Standards Set (Calibrated against NPL / RRSL standards, Valid until 2027)`);
      setRemarks(`All tolerance checkpoints verified. Official tamper-proof security seal serial DL-SEAL-${Math.floor(1000 + Math.random() * 9000)} affixed.`);
    } catch (err) {
      console.error(err);
      setError('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files) {
      setSelectedPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('observations', JSON.stringify(observations));
      formData.append('result', result);
      formData.append('remarks', remarks);
      formData.append('environmentalConditions', JSON.stringify({
        temperatureC: Number(tempC),
        relativeHumidityPct: Number(humidityPct)
      }));
      formData.append('workingStandardsUsed', JSON.stringify([
        { standardName: standardsText, certificateRef: 'NPL/RRSL/TRACE/2026', validUntil: new Date('2027-12-31') }
      ]));

      // Attach photos
      selectedPhotos.forEach(file => {
        formData.append('photos', file);
      });

      const res = await api.post(`/applications/${applicationId}/inspection`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.certificate) {
        navigate(`/certificates/${res.data.certificate.certificateNumber}`);
      } else {
        navigate(`/applications/${applicationId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit inspection record.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading statutory inspection form...</div>;
  }

  if (!application) {
    return <div className="p-12 text-center text-slate-500">Application not found</div>;
  }

  const instrument = application.instrumentId || {};
  const category = instrument.categoryId || {};

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </button>

      {/* Inspection Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              {application.applicationNumber}
            </span>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
              {category.name}
            </span>
          </div>
          <h1 className="text-xl font-bold">
            Statutory Metrological Verification Test
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {instrument.make} - {instrument.model} (S/N: {instrument.serialNumber}) • Standard: {category.applicableStandard}
          </p>
        </div>

        <div className="text-right text-xs text-slate-300">
          <div>Owner: <span className="font-bold text-white">{application.userId?.name}</span></div>
          <div>Location: <span className="text-slate-400">{instrument.location?.district}</span></div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Environmental Conditions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-blue-600" />
            1. Environmental Ambient Conditions & Working Standards
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ambient Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={tempC}
                onChange={(e) => setTempC(e.target.value)}
                required
                className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relative Humidity (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={humidityPct}
                onChange={(e) => setHumidityPct(e.target.value)}
                required
                className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Working Standards / Traceable Test Weights Used
            </label>
            <input
              type="text"
              value={standardsText}
              onChange={(e) => setStandardsText(e.target.value)}
              required
              className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Dynamic Schema Form Checkpoints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                2. Category-Specific Inspection Checkpoints ({category.name})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record tolerance test readings and statutory checks as defined in this instrument's schema.
              </p>
            </div>
          </div>

          <DynamicInspectionForm
            schema={category.inspectionSchema || []}
            initialValues={observations}
            onChange={(updated) => setObservations(updated)}
          />
        </div>

        {/* Photos & Evidence */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-blue-600" />
            3. Photographic Evidence & Stamping Plaque
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Photos (Security seal, Stamping Plaque, Dial/Display)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handlePhotoChange}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-[11px] text-slate-400 mt-1">Accepts JPG, PNG, WEBP files up to 10MB.</p>
          </div>
        </div>

        {/* Statutory Result & Seal Remarks */}
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-900/20 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            4. Statutory Verification Verdict & Digital Certificate Issuance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
              result === 'Pass' ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200'
            }`}>
              <input
                type="radio"
                name="result"
                value="Pass"
                checked={result === 'Pass'}
                onChange={() => setResult('Pass')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="font-bold text-sm flex items-center gap-1 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" /> PASS & Issue Certificate
                </div>
                <div className="text-[11px] text-emerald-700">Satisfies Maximum Permissible Errors & Statutory Rules.</div>
              </div>
            </label>

            <label className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
              result === 'Fail' ? 'bg-rose-50 border-rose-600 text-rose-900 ring-2 ring-rose-500/20' : 'bg-white border-slate-200'
            }`}>
              <input
                type="radio"
                name="result"
                value="Fail"
                checked={result === 'Fail'}
                onChange={() => setResult('Fail')}
                className="text-rose-600 focus:ring-rose-500"
              />
              <div>
                <div className="font-bold text-sm flex items-center gap-1 text-rose-800">
                  <XCircle className="w-4 h-4" /> FAIL / Reject Instrument
                </div>
                <div className="text-[11px] text-rose-700">Tolerances exceeded or mechanical defect observed.</div>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Officer Remarks / Official Seal Number *
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
              placeholder="e.g. Verified and sealed. Security lead wire seal #DL-SEAL-8821 affixed."
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
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? 'Recording Inspection & Generating Certificate...' : 'Complete & Issue Statutory Certificate'}
            </button>
          </div>

        </div>

      </form>

    </div>
  );
}
