import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import CertificateDocument from '../components/CertificateDocument';
import { ArrowLeft, Award, ShieldCheck, AlertCircle } from 'lucide-react';

export default function CertificatePage() {
  const { certNumber } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCertificate();
  }, [certNumber]);

  const loadCertificate = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/certificates/${certNumber}`);
      setCertificate(res.data.certificate);
      setQrCodeDataUrl(res.data.qrCodeDataUrl);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Certificate not found.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="mt-3 text-sm">Rendering digital verification certificate...</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-lg">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Certificate Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {error || 'The requested verification certificate could not be located.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-blue-700 text-white font-bold text-xs rounded-xl"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      
      <div className="no-print">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <CertificateDocument
        certificate={certificate}
        application={certificate.applicationId}
        qrCodeDataUrl={qrCodeDataUrl}
      />

    </div>
  );
}
