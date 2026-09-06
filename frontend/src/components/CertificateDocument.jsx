import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, ShieldCheck, CheckCircle2, Award, Calendar, Hash, UserCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function CertificateDocument({ certificate, application, qrCodeDataUrl }) {
  const certRef = useRef(null);

  if (!certificate) return null;

  const app = application || certificate.applicationId || {};
  const instrument = app.instrumentId || {};
  const category = instrument.categoryId || {};
  const owner = app.userId || {};
  const inspection = app.inspectionRecordId || {};

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    // If backend PDF is available, download directly from backend
    if (certificate.pdfPath) {
      window.open(`/api/certificates/${certificate.certificateNumber}/download`, '_blank');
      return;
    }

    // Fallback: Client-side PDF generation using html2canvas & jsPDF
    if (!certRef.current) return;
    try {
      const element = certRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      pdf.save(`Certificate_${certificate.certificateNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    }
  };

  const verificationUrl = certificate.verificationUrl || `${window.location.origin}/verify/${certificate.qrToken}`;

  return (
    <div className="max-w-4xl mx-auto my-6">
      {/* Action Buttons (Hidden when printing) */}
      <div className="no-print flex items-center justify-between mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Official Legal Metrology Verification Certificate</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Printable Certificate Sheet */}
      <div
        id="printable-certificate"
        ref={certRef}
        className="bg-white p-8 sm:p-12 border-8 border-double border-blue-900 shadow-2xl rounded-sm relative text-slate-800"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {/* Inner Gold Border */}
        <div className="absolute inset-2 border border-amber-600/60 pointer-events-none"></div>

        {/* Certificate Header */}
        <div className="text-center relative z-10 space-y-1">
          {/* Government Emblem Representation */}
          <div className="w-16 h-16 mx-auto mb-2 text-blue-950 flex flex-col items-center justify-center border-2 border-amber-600/40 rounded-full bg-amber-50/50 p-2">
            <Award className="w-10 h-10 text-blue-900" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-wider text-blue-950 uppercase">
            Government of India
          </h1>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">
            Directorate of Legal Metrology
          </h2>
          <p className="text-xs text-slate-600 italic font-sans">
            (Issued under the Legal Metrology Act, 2009 & Legal Metrology General Rules, 2011)
          </p>

          {/* Certificate Title Badge */}
          <div className="inline-block mt-4 mb-2 px-6 py-1.5 bg-emerald-50 border-2 border-emerald-600 rounded text-emerald-900 font-sans font-bold text-sm sm:text-base uppercase tracking-widest">
            Certificate of Verification & Stamping
          </div>
        </div>

        {/* Certificate Metadata Ribbon */}
        <div className="mt-6 font-sans grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Certificate Number</span>
            <span className="font-mono font-bold text-blue-900">{certificate.certificateNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Application Ref</span>
            <span className="font-mono font-semibold text-slate-800">{app.applicationNumber || 'APP-REF'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Date of Verification</span>
            <span className="font-semibold text-slate-800">{new Date(certificate.issuedDate).toLocaleDateString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Valid Until</span>
            <span className="font-bold text-rose-700">{new Date(certificate.validUntil).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        {/* Certificate Body Paragraph */}
        <div className="mt-6 text-xs sm:text-sm leading-relaxed text-slate-700 space-y-4">
          <p>
            This is to certify that the weighing / measuring instrument specified hereunder has been tested, inspected, and verified in accordance with the standards and tolerances prescribed under the <strong>Legal Metrology Act, 2009</strong> and found to be strictly compliant. The instrument has been duly stamped / sealed with the official verification mark.
          </p>

          {/* Section 1: Instrument Details Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden font-sans">
            <div className="bg-blue-900 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
              1. Instrument Particulars
            </div>
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-600 w-1/3 bg-slate-50">Category / Type</td>
                  <td className="px-3 py-2 font-bold text-slate-900">{category.name || 'Metrology Instrument'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-600 bg-slate-50">Make & Model</td>
                  <td className="px-3 py-2 text-slate-900">{instrument.make} - {instrument.model}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-600 bg-slate-50">Serial / Identification No.</td>
                  <td className="px-3 py-2 font-mono font-bold text-blue-900">{instrument.serialNumber}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-600 bg-slate-50">Applicable Standard</td>
                  <td className="px-3 py-2 text-slate-800">{category.applicableStandard || 'Legal Metrology Rules, 2011'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-600 bg-slate-50">Installation Location</td>
                  <td className="px-3 py-2 text-slate-800">
                    {instrument.location?.premisesName ? `${instrument.location.premisesName}, ` : ''}
                    {instrument.location?.address}, {instrument.location?.district}, {instrument.location?.state || 'Delhi'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Owner & Verification Authority */}
          <div className="border border-slate-200 rounded-lg overflow-hidden font-sans">
            <div className="bg-slate-800 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
              2. Applicant & Inspection Verification Details
            </div>
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-600 w-1/3 bg-slate-50">Registered Trader / Owner</td>
                  <td className="px-3 py-2 font-bold text-slate-900">{owner.orgDetails?.companyName || owner.name || 'Authorized User'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-600 bg-slate-50">GSTIN / Registration No.</td>
                  <td className="px-3 py-2 font-mono text-slate-800">{owner.orgDetails?.gstNumber || 'Unregistered / Personal'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-600 bg-slate-50">Verification Outcome</td>
                  <td className="px-3 py-2 text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    PASS — Maximum Permissible Error (MPE) Compliant & Security Seal Affixed
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer: QR Code + Digital Signature + Seal */}
        <div className="mt-8 pt-6 border-t-2 border-slate-200 font-sans grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          
          {/* QR Code Block */}
          <div className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Verification QR Code" className="w-24 h-24" />
              ) : (
                <QRCodeSVG
                  value={verificationUrl}
                  size={96}
                  level="H"
                  includeMargin={false}
                />
              )}
            </div>
            <span className="text-[10px] font-bold text-blue-900 mt-1 uppercase tracking-tight">
              Scan to Verify Online
            </span>
            <span className="text-[9px] text-slate-400 font-mono break-all max-w-[150px]">
              ID: {certificate.qrToken?.substring(0, 16)}...
            </span>
          </div>

          {/* Statutory Security Declaration */}
          <div className="text-center text-[10px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">GOVERNMENT STATUTORY SEAL</p>
            <div className="w-16 h-16 mx-auto border-2 border-amber-600/60 rounded-full flex flex-col items-center justify-center p-1 bg-amber-50/30">
              <span className="text-[7px] font-bold uppercase text-amber-800 text-center leading-tight">LEGAL METROLOGY DELHI</span>
            </div>
            <p className="leading-tight">
              This certificate is electronically generated and tamper-evident under the Information Technology Act, 2000.
            </p>
          </div>

          {/* Officer Digital Signature Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs space-y-1">
            <div className="text-[10px] font-bold text-blue-900 uppercase">Digitally Certified By</div>
            <div className="font-bold text-slate-900">{certificate.issuingAuthority?.officerName || 'Inspector of Legal Metrology'}</div>
            <div className="text-[11px] text-slate-600 uppercase font-semibold">
              {certificate.issuingAuthority?.officerRole?.toUpperCase() || 'LMO'} ({certificate.issuingAuthority?.badgeNumber || 'DL-OFFICER'})
            </div>
            <div className="text-[10px] text-slate-500">Jurisdiction: {certificate.issuingAuthority?.jurisdiction || 'New Delhi'}</div>
            <div className="text-[9px] text-emerald-700 font-semibold mt-1">✓ Digital Seal Applied</div>
          </div>
        </div>

      </div>
    </div>
  );
}
