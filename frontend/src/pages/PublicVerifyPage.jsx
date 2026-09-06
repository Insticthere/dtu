import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
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
  AlertTriangle
} from 'lucide-react';

export default function PublicVerifyPage() {
  const { qrToken } = useParams();
  const navigate = useNavigate();

  const [tokenInput, setTokenInput] = useState(qrToken || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(!!qrToken);
  const [error, setError] = useState('');

  useEffect(() => {
    if (qrToken) {
      setTokenInput(qrToken);
      performVerification(qrToken);
    }
  }, [qrToken]);

  const performVerification = async (token) => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      setVerificationResult(null);

      // Check if user entered a certificate number (LM-VER-...) or QR token
      if (token.startsWith('LM-VER-')) {
        const searchRes = await api.get(`/verify/search/${token}`);
        if (searchRes.data.qrToken) {
          navigate(`/verify/${searchRes.data.qrToken}`);
          return;
        }
      }

      const res = await api.get(`/verify/${token}`);
      setVerificationResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. The scanned QR token is invalid, revoked, or unrecorded.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    performVerification(tokenInput.trim());
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Public Legal Metrology Verification Registry (GoI)</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Verify Instrument Certificate Authenticity
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Scan the QR code affixed to any commercial scale, fuel pump, or breath analyser, or enter the digital token below.
        </p>
      </div>

      {/* Search / Token Box */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-md">
        <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <QrCode className="w-5 h-5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste QR Token or Certificate Number (e.g. 4f8a92e10bc78d234a5b6c7d8e9f0123)"
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

        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <span>Official Verification Gateway • No Login Required</span>
          <div className="space-x-2">
            <span>Demo Tokens:</span>
            <button
              type="button"
              onClick={() => { setTokenInput('4f8a92e10bc78d234a5b6c7d8e9f0123'); performVerification('4f8a92e10bc78d234a5b6c7d8e9f0123'); }}
              className="text-blue-700 underline font-mono font-semibold"
            >
              Scale Token
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => { setTokenInput('8c2f1a7b9e0d456789abcdef11223344'); performVerification('8c2f1a7b9e0d456789abcdef11223344'); }}
              className="text-blue-700 underline font-mono font-semibold"
            >
              Breath Analyser Token
            </button>
          </div>
        </div>
      </div>

      {/* Verification Result Display */}
      {loading && (
        <div className="p-12 text-center text-slate-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="text-sm mt-3">Validating cryptographic QR token against Government Registry...</p>
        </div>
      )}

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
            <strong>Consumer Notice:</strong> Operating unverified weighing or measuring instruments in trade is an offense under Section 30 of India's Legal Metrology Act, 2009.
          </div>
        </div>
      )}

      {verificationResult && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
          
          {/* Status Header Banner */}
          <div className={`p-6 text-white ${
            verificationResult.status === 'Active'
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700'
              : 'bg-gradient-to-r from-rose-600 to-rose-700'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-2xl">
                  {verificationResult.status === 'Active' ? (
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  ) : (
                    <XCircle className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                    Official Statutory Record
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black mt-1">
                    {verificationResult.status === 'Active'
                      ? 'GENUINE & VERIFIED INSTRUMENT'
                      : `CERTIFICATE ${verificationResult.status.toUpperCase()}`}
                  </h2>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-emerald-100">Certificate No:</div>
                <div className="font-mono font-bold text-sm sm:text-base">{verificationResult.certificateNumber}</div>
              </div>
            </div>
          </div>

          {/* Verification Details Table */}
          <div className="p-6 sm:p-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Instrument Details */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-blue-700" />
                  Instrument Information
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
                    <span className="font-mono font-bold text-blue-900">{verificationResult.serialNumber}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Statutory Standard:</span>
                    <span className="font-medium text-slate-700">{verificationResult.applicableStandard}</span>
                  </div>
                </div>
              </div>

              {/* Owner & Validity */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-600" />
                  Ownership & Validity Window
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Owner (Masked for Privacy):</span>
                    <span className="font-bold text-slate-900 font-mono">{verificationResult.maskedOwnerName}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Premises Location:</span>
                    <span className="font-semibold text-slate-800">{verificationResult.premisesLocation}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Date of Stamping:</span>
                    <span className="font-semibold text-slate-800">{new Date(verificationResult.issuedDate).toLocaleDateString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Statutory Expiry Date:</span>
                    <span className="font-bold text-rose-700">{new Date(verificationResult.validUntil).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Issuing Authority Badge */}
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
                <div>
                  <span className="text-slate-500">Issuing Verification Officer:</span>
                  <span className="font-bold text-slate-900 ml-1">
                    {verificationResult.issuingAuthority?.officerName || 'Inspector'} ({verificationResult.issuingAuthority?.officerRole?.toUpperCase() || 'LMO'}, Badge: {verificationResult.issuingAuthority?.badgeNumber || 'DL-OFFICER'})
                  </span>
                </div>
              </div>

              <Link
                to={`/certificates/${verificationResult.certificateNumber}`}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
              >
                View Full Certificate &rarr;
              </Link>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
