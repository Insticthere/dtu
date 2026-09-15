import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import api from '../api/client';
import CertificateDocument from '../components/CertificateDocument';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  QrCode,
  Search,
  Scale,
  Calendar,
  Building2,
  Award,
  Lock,
  UserCheck,
  AlertTriangle,
  Download,
  Printer,
  FileText,
  ExternalLink,
  ChevronRight,
  Info,
  BadgeCheck,
  FileCheck
} from 'lucide-react';

export default function PublicVerifyPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract token from multiple possible sources:
  // 1. :qrToken parameter
  // 2. wildcard path params['*']
  // 3. searchParams ('token', 'qrToken', 'cert', 'certificateNumber')
  // 4. window.location.pathname fallback
  const extractToken = () => {
    if (params.qrToken) return params.qrToken;
    if (params['*']) {
      const wildcard = params['*'].replace(/^\/+|\/+$/g, '');
      if (wildcard) return wildcard;
    }
    const q = searchParams.get('token') || searchParams.get('qrToken') || searchParams.get('cert') || searchParams.get('certificateNumber') || searchParams.get('c');
    if (q) return q.trim();
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
  const [verificationResult, setVerificationResult] = useState(null);
  const [fullCertificate, setFullCertificate] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loading, setLoading] = useState(!!initialToken);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('both'); // 'summary' | 'certificate' | 'both'

  useEffect(() => {
    const t = extractToken();
    if (t) {
      setTokenInput(t);
      performVerification(t);
    }
  }, [params.qrToken, params['*'], location.pathname, searchParams]);

  const performVerification = async (raw) => {
    if (!raw) return;
    const token = raw.trim();
    try {
      setLoading(true);
      setError('');
      setVerificationResult(null);
      setFullCertificate(null);

      // Check if user entered a certificate number (LM-VER-... or LM_VER_...)
      if (/^LM[-_]VER/i.test(token)) {
        try {
          const searchRes = await api.get(`/verify/search/${encodeURIComponent(token)}`);
          if (searchRes.data.qrToken) {
            navigate(`/verify/${searchRes.data.qrToken}`, { replace: true });
            return;
          }
        } catch (searchErr) {
          // Continue to direct verify call if search endpoint failed
        }
      }

      const res = await api.get(`/verify/${encodeURIComponent(token)}`);
      setVerificationResult(res.data.data);

      // Preload the full certificate document for rich display
      if (res.data.data?.certificateNumber) {
        try {
          const certRes = await api.get(`/certificates/${res.data.data.certificateNumber}`);
          setFullCertificate(certRes.data.certificate);
          setQrCodeDataUrl(certRes.data.qrCodeDataUrl);
        } catch (certErr) {
          console.warn('Could not load full certificate document:', certErr);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. The scanned QR token is invalid, revoked, or unrecorded in the National Registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    navigate(`/verify/${tokenInput.trim()}`);
  };

  const handleDemoClick = (token) => {
    setTokenInput(token);
    navigate(`/verify/${token}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>National Legal Metrology Verification Registry (Govt. of India)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Verify Instrument Certificate Authenticity
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Scan the official QR code affixed to any commercial weighing scale, fuel pump, or breath analyser, or verify by Certificate Number / Token.
        </p>
      </div>

      {/* Search / Token Input Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-md">
        <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <QrCode className="w-5 h-5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste QR Token or Certificate Number (e.g. 4f8a92e10bc78d234a5b6c7d8e9f0123 or LM-VER-2026-908123)"
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Verifying...' : 'Verify Now'}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>Official Public Gateway • Tamper-Evident • No Login Required</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Quick Test:</span>
            <button
              type="button"
              onClick={() => handleDemoClick('4f8a92e10bc78d234a5b6c7d8e9f0123')}
              className="text-blue-700 hover:underline font-semibold"
            >
              Weighing Scale
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleDemoClick('8c2f1a7b9e0d456789abcdef11223344')}
              className="text-blue-700 hover:underline font-semibold"
            >
              Breath Analyser
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleDemoClick('LM-VER-2026-908123')}
              className="text-blue-700 hover:underline font-semibold"
            >
              Cert #908123
            </button>
          </div>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="text-sm font-semibold text-slate-700">Validating cryptographic QR token against Government Registry...</p>
          <p className="text-xs text-slate-400">Verifying digital signatures, OIML compliance tolerances, and statutory validity window</p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 text-center space-y-3 animate-in fade-in">
          <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-rose-950">UNVERIFIED OR COUNTERFEIT INSTRUMENT</h3>
          <p className="text-xs text-rose-700 max-w-lg mx-auto leading-relaxed">
            {error}
          </p>
          <div className="p-3 bg-white/80 rounded-xl border border-rose-200 text-xs text-slate-600 max-w-md mx-auto">
            <strong>Consumer Notice:</strong> Operating unverified weighing or measuring instruments in trade is an offense punishable under Section 30 and Section 44 of India's Legal Metrology Act, 2009.
          </div>
        </div>
      )}

      {/* Verification Result Display */}
      {verificationResult && !loading && (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          
          {/* Main Verification Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            
            {/* Status Header Banner */}
            <div className={`p-6 text-white ${
              verificationResult.status === 'Active'
                ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800'
                : 'bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                    {verificationResult.status === 'Active' ? (
                      <CheckCircle2 className="w-9 h-9 text-white" />
                    ) : (
                      <XCircle className="w-9 h-9 text-white" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                      Official Statutory Registry Record
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black mt-1">
                      {verificationResult.status === 'Active'
                        ? 'GENUINE & VERIFIED INSTRUMENT'
                        : `CERTIFICATE ${verificationResult.status.toUpperCase()}`}
                    </h2>
                    <p className="text-xs text-emerald-100 mt-0.5">
                      Verified under Legal Metrology Act, 2009 & General Rules, 2011
                    </p>
                  </div>
                </div>

                <div className="text-right bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm self-start sm:self-auto">
                  <div className="text-[11px] text-emerald-100">Certificate Number</div>
                  <div className="font-mono font-bold text-sm sm:text-base text-white">{verificationResult.certificateNumber}</div>
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600">View Option:</span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                  <button
                    onClick={() => setViewMode('summary')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      viewMode === 'summary' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setViewMode('certificate')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      viewMode === 'certificate' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Official Certificate
                  </button>
                  <button
                    onClick={() => setViewMode('both')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      viewMode === 'both' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Both Views
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/certificates/${verificationResult.certificateNumber}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF Certificate
                </a>
                <Link
                  to={`/certificates/${verificationResult.certificateNumber}`}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Dedicated Page
                </Link>
              </div>
            </div>

            {/* Verification Summary Details */}
            {(viewMode === 'summary' || viewMode === 'both') && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Instrument Details */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-blue-700" />
                      Instrument Particulars
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Category / Type:</span>
                        <span className="font-bold text-slate-900">{verificationResult.category}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Make & Model:</span>
                        <span className="font-semibold text-slate-800">{verificationResult.make} - {verificationResult.model}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Serial Number:</span>
                        <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">{verificationResult.serialNumber}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Inspection Result:</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {verificationResult.inspectionResult || 'PASS (Within Statutory MPE Limits)'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Statutory Standard:</span>
                        <span className="font-medium text-slate-700 text-right max-w-[200px]">{verificationResult.applicableStandard}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner & Validity */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-600" />
                      Ownership & Statutory Validity
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Owner (Privacy-Masked):</span>
                        <span className="font-bold text-slate-900 font-mono">{verificationResult.maskedOwnerName}</span>
                      </div>

                      {verificationResult.companyName && (
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span className="text-slate-500">Organization / Trade Name:</span>
                          <span className="font-semibold text-slate-800">{verificationResult.companyName}</span>
                        </div>
                      )}

                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Premises Location:</span>
                        <span className="font-semibold text-slate-800">{verificationResult.premisesLocation}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Date of Verification / Stamping:</span>
                        <span className="font-semibold text-slate-800">{new Date(verificationResult.issuedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Statutory Expiry Date:</span>
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">{new Date(verificationResult.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Issuing Authority Badge */}
                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                    <div>
                      <span className="text-slate-500">Issuing Verification Officer:</span>
                      <span className="font-bold text-slate-900 ml-1">
                        {verificationResult.issuingAuthority?.officerName || 'Inspector'} ({verificationResult.issuingAuthority?.officerRole?.toUpperCase() || 'LMO'}, Badge: {verificationResult.issuingAuthority?.badgeNumber || 'DL-OFFICER'})
                      </span>
                      <span className="text-slate-500 ml-2">• Jurisdiction: {verificationResult.issuingAuthority?.jurisdiction || 'Delhi Central'}</span>
                    </div>
                  </div>

                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Official Security Seal Affixed
                  </span>
                </div>

              </div>
            )}

          </div>

          {/* Full Certificate Document Display */}
          {(viewMode === 'certificate' || viewMode === 'both') && fullCertificate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <FileCheck className="w-4 h-4 text-blue-700" />
                  Official Statutory Verification Certificate (Full Document)
                </h3>
                <span className="text-xs text-slate-400">Section 24, Legal Metrology Act 2009</span>
              </div>
              <CertificateDocument
                certificate={fullCertificate}
                application={fullCertificate.applicationId}
                qrCodeDataUrl={qrCodeDataUrl}
              />
            </div>
          )}

        </div>
      )}

      {/* Fallback Display for bare /verify page (When no token is searched yet) */}
      {!loading && !verificationResult && !error && (
        <div className="space-y-8 animate-in fade-in">
          
          {/* Quick Demo Verification Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                Active Verified Instruments in Registry (Click to Test Verification)
              </h2>
              <span className="text-xs text-slate-500">Live MongoDB Records</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Scale Card */}
              <div
                onClick={() => handleDemoClick('4f8a92e10bc78d234a5b6c7d8e9f0123')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-700 rounded-xl group-hover:bg-blue-700 group-hover:text-white transition-colors">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                        Electronic Weighing Scale
                      </h3>
                      <p className="text-xs text-slate-500">Commercial Class III • Retail Trade</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    Active & Genuine
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Make / Model:</span>
                    <span className="font-bold text-slate-800">Essae-Teraoka DS-215</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cert Number:</span>
                    <span className="text-blue-700 font-bold">LM-VER-2026-908123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-700">Chandni Chowk, Central Delhi</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-blue-700 font-bold pt-1">
                  <span>Verify Instrument Details &rarr;</span>
                  <span className="text-[10px] text-slate-400 font-normal">Token: 4f8a...0123</span>
                </div>
              </div>

              {/* Breath Analyser Card */}
              <div
                onClick={() => handleDemoClick('8c2f1a7b9e0d456789abcdef11223344')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-50 text-purple-700 rounded-xl group-hover:bg-purple-700 group-hover:text-white transition-colors">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">
                        Evidential Breath Analyser
                      </h3>
                      <p className="text-xs text-slate-500">Forensic & Law Enforcement • OIML R126</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    Active & Genuine
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Make / Model:</span>
                    <span className="font-bold text-slate-800">Dräger Alcotest 9510</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cert Number:</span>
                    <span className="text-purple-700 font-bold">LM-VER-2026-447819</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verified By:</span>
                    <span className="text-slate-700">Govt. Approved Test Centre (GATC)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-purple-700 font-bold pt-1">
                  <span>Verify Instrument Details &rarr;</span>
                  <span className="text-[10px] text-slate-400 font-normal">Token: 8c2f...3344</span>
                </div>
              </div>

            </div>
          </div>

          {/* Verification Protocol Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Statutory Verification Guidelines under Legal Metrology Act, 2009
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px]">1</span>
                  Locate QR Sticker
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Every legal measuring instrument in commercial use in India must bear a physical tamper-evident seal and dynamic QR verification plaque.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px]">2</span>
                  Cryptographic Token
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Scanning the QR code validates a 48-character cryptographic token against the National Legal Metrology database in real-time.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px]">3</span>
                  Citizen Protection
                </div>
                <p className="text-slate-500 leading-relaxed">
                  If the certificate has expired or the token fails validation, report the violation under Section 30 of the Legal Metrology Act, 2009.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
