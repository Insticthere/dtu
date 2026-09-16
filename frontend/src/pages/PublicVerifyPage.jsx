import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/client';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  QrCode,
  Search,
  Scale,
  Lock,
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info
} from 'lucide-react';

export default function PublicVerifyPage() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract token from URL params, wildcard, or pathname
  const extractToken = () => {
    if (params.qrToken) return params.qrToken;
    if (params['*']) {
      const w = params['*'].replace(/^\/+|\/+$/g, '');
      if (w) return w;
    }
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.replace(/\/+/g, '/');
      if (p.includes('/verify/')) {
        const seg = p.split('/verify/')[1]?.split('/')[0]?.split('?')[0]?.trim();
        if (seg) return seg;
      }
    }
    return '';
  };

  const initialToken = extractToken();
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!!initialToken);
  const [error, setError] = useState('');

  // Collapsible sections
  const [showInstrument, setShowInstrument] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [showOfficer, setShowOfficer] = useState(false);

  useEffect(() => {
    const t = extractToken();
    if (t) {
      setTokenInput(t);
      verify(t);
    }
  }, [params.qrToken, params['*'], location.pathname]);

  const verify = async (raw) => {
    if (!raw) return;
    const token = raw.trim();
    try {
      setLoading(true);
      setError('');
      setResult(null);

      // If it looks like a certificate number, search first
      if (/^LM[-_]VER/i.test(token)) {
        try {
          const s = await api.get(`/verify/search/${encodeURIComponent(token)}`);
          if (s.data.qrToken) {
            navigate(`/verify/${s.data.qrToken}`, { replace: true });
            return;
          }
        } catch (_) { /* fall through */ }
      }

      const res = await api.get(`/verify/${encodeURIComponent(token)}`);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Token is invalid or unrecognized.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    navigate(`/verify/${tokenInput.trim()}`);
  };

  // Collapsible section component
  const Section = ({ title, icon: Icon, open, toggle, children }) => (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Icon className="w-4 h-4 text-blue-700" />
          {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="p-4 bg-white space-y-2">{children}</div>}
    </div>
  );

  const Row = ({ label, value, bold, mono, color }) => (
    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right ${bold ? 'font-bold' : 'font-medium'} ${mono ? 'font-mono' : ''} ${color || 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          Public Verification Registry
        </div>
        <h1 className="text-2xl font-black text-slate-900">Verify Certificate</h1>
        <p className="text-xs text-slate-500">Scan the QR code or enter a token / certificate number below.</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="QR Token or Certificate Number"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Checking...' : 'Verify'}
          </button>
        </form>

        {/* Demo links */}
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
          <span>Try:</span>
          <button type="button" onClick={() => { setTokenInput('4f8a92e10bc78d234a5b6c7d8e9f0123'); navigate('/verify/4f8a92e10bc78d234a5b6c7d8e9f0123'); }} className="text-blue-600 hover:underline">Scale Token</button>
          <span>•</span>
          <button type="button" onClick={() => { setTokenInput('8c2f1a7b9e0d456789abcdef11223344'); navigate('/verify/8c2f1a7b9e0d456789abcdef11223344'); }} className="text-blue-600 hover:underline">Breath Analyser</button>
          <span>•</span>
          <button type="button" onClick={() => { setTokenInput('LM-VER-2026-908123'); navigate('/verify/LM-VER-2026-908123'); }} className="text-blue-600 hover:underline">Cert #908123</button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700 mx-auto"></div>
          <p className="text-sm text-slate-500 mt-3">Verifying against registry...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-6 text-center space-y-2">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Not Verified</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden space-y-0">

          {/* Status Banner */}
          <div className={`p-5 text-white ${result.status === 'Active' ? 'bg-emerald-700' : 'bg-rose-700'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-xl">
                {result.status === 'Active' ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {result.status === 'Active' ? 'Genuine & Verified' : `Certificate ${result.status}`}
                </p>
                <p className="font-mono font-bold text-lg">{result.certificateNumber}</p>
              </div>
            </div>
          </div>

          {/* Quick Info (always visible) */}
          <div className="p-4 border-b border-slate-200 space-y-1">
            <Row label="Category" value={result.category} bold />
            <Row label="Make & Model" value={`${result.make} — ${result.model}`} />
            <Row label="Serial Number" value={result.serialNumber} mono bold color="text-blue-900" />
            <Row label="Result" value={result.inspectionResult || 'Pass'} bold color="text-emerald-700" />
            <Row label="Issued" value={new Date(result.issuedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
            <Row label="Expires" value={new Date(result.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} bold color="text-rose-700" />
          </div>

          {/* Expandable Sections */}
          <div className="p-4 space-y-3">

            <Section title="Instrument Details" icon={Scale} open={showInstrument} toggle={() => setShowInstrument(!showInstrument)}>
              <Row label="Category / Type" value={result.category} bold />
              <Row label="Manufacturer" value={result.make} />
              <Row label="Model" value={result.model} />
              <Row label="Serial No." value={result.serialNumber} mono bold />
              <Row label="Applicable Standard" value={result.applicableStandard} />
              <Row label="Inspection Result" value={result.inspectionResult || 'Pass — Within Statutory MPE Limits'} bold color="text-emerald-700" />
            </Section>

            <Section title="Ownership & Validity" icon={Lock} open={showOwner} toggle={() => setShowOwner(!showOwner)}>
              <Row label="Owner (Privacy Masked)" value={result.maskedOwnerName} mono bold />
              {result.companyName && <Row label="Organization" value={result.companyName} />}
              <Row label="Premises" value={result.premisesLocation} />
              <Row label="Date of Stamping" value={new Date(result.issuedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
              <Row label="Statutory Expiry" value={new Date(result.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} bold color="text-rose-700" />
            </Section>

            <Section title="Issuing Officer" icon={ShieldCheck} open={showOfficer} toggle={() => setShowOfficer(!showOfficer)}>
              <Row label="Officer Name" value={result.issuingAuthority?.officerName || 'Inspector'} bold />
              <Row label="Role" value={result.issuingAuthority?.officerRole?.toUpperCase() || 'LMO'} />
              <Row label="Badge Number" value={result.issuingAuthority?.badgeNumber || 'DL-OFFICER'} mono />
              <Row label="Jurisdiction" value={result.issuingAuthority?.jurisdiction || 'Delhi Central'} />
            </Section>

          </div>

          {/* Actions */}
          <div className="p-4 border-t border-slate-200 flex flex-wrap gap-2">
            <Link
              to={`/certificates/${result.certificateNumber}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Full Certificate Page
            </Link>
          </div>

        </div>
      )}

      {/* Default state — no search yet */}
      {!loading && !result && !error && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            How It Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">1. Scan QR</div>
              <p className="text-slate-500">Point your phone camera at the QR sticker on the instrument.</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">2. Auto Verify</div>
              <p className="text-slate-500">The token is checked against the national database in real-time.</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">3. View Result</div>
              <p className="text-slate-500">See certificate status, instrument details, and issuing officer.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
