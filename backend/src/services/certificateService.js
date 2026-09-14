const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { generateQRCodeBuffer } = require('./qrService');
const { storage } = require('./storageService');

const generateCertificatePDF = async ({ certificate, application, instrument, category, user, inspection }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Verification Certificate - ${certificate.certificateNumber}`,
          Author: 'Department of Legal Metrology',
          Subject: 'Certificate of Verification under Legal Metrology Act, 2009',
        }
      });

      const certDir = path.join(__dirname, '../../uploads/certificates');
      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
      }

      const filename = `cert-${certificate.certificateNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const filePath = path.join(certDir, filename);
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Certificate Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(2)
         .stroke('#1e3a8a');
      
      doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50)
         .lineWidth(0.5)
         .stroke('#d97706');

      // Header
      doc.fillColor('#1e3a8a')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('GOVERNMENT OF INDIA', { align: 'center' });
      
      doc.fontSize(13)
         .font('Helvetica-Bold')
         .fillColor('#334155')
         .text('DEPARTMENT OF LEGAL METROLOGY', { align: 'center' });
      
      doc.fontSize(10)
         .font('Helvetica-Oblique')
         .fillColor('#64748b')
         .text('(Under Legal Metrology Act, 2009 & Legal Metrology (General) Rules, 2011)', { align: 'center' });

      doc.moveDown(0.5);

      // Certificate Title Box
      doc.rect(80, doc.y, doc.page.width - 160, 28)
         .fillAndStroke('#f0fdf4', '#16a34a');

      doc.fillColor('#15803d')
         .fontSize(13)
         .font('Helvetica-Bold')
         .text('CERTIFICATE OF VERIFICATION', 80, doc.y - 22, { width: doc.page.width - 160, align: 'center' });

      doc.moveDown(1.2);

      // Top Meta Box (Cert No & Dates)
      const metaY = doc.y;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a');
      doc.text(`Certificate No: ${certificate.certificateNumber}`, 40, metaY);
      doc.font('Helvetica').fillColor('#475569');
      doc.text(`Application Ref: ${application.applicationNumber}`, 40, metaY + 14);

      doc.font('Helvetica-Bold').fillColor('#0f172a');
      doc.text(`Date of Issue: ${new Date(certificate.issuedDate).toLocaleDateString('en-IN')}`, 350, metaY);
      doc.fillColor('#b91c1c').text(`Valid Until: ${new Date(certificate.validUntil).toLocaleDateString('en-IN')}`, 350, metaY + 14);

      doc.moveDown(2);

      // Section: Verified Instrument Details
      doc.fillColor('#1e3a8a').fontSize(11).font('Helvetica-Bold').text('1. INSTRUMENT PARTICULARS', 40, doc.y);
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y + 2).lineTo(550, doc.y + 2).stroke();
      doc.moveDown(0.5);

      const tableData = [
        ['Category / Type:', category?.name || 'N/A'],
        ['Make / Manufacturer:', instrument?.make || 'N/A'],
        ['Model Designation:', instrument?.model || 'N/A'],
        ['Serial Number:', instrument?.serialNumber || 'N/A'],
        ['Applicable Standard:', category?.applicableStandard || 'Legal Metrology Rules, 2011'],
        ['Installation Location:', `${instrument?.location?.address || ''}, ${instrument?.location?.district || ''}, ${instrument?.location?.state || 'Delhi'}`]
      ];

      tableData.forEach(([label, value]) => {
        const rowY = doc.y;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#334155').text(label, 45, rowY, { width: 150 });
        doc.font('Helvetica').fillColor('#0f172a').text(value, 200, rowY, { width: 340 });
        doc.moveDown(0.4);
      });

      // Technical Specs
      if (instrument.specs && Object.keys(instrument.specs).length > 0) {
        doc.moveDown(0.2);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text('Technical Specifications:', 45, doc.y);
        const specsText = Object.entries(instrument.specs)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
        doc.font('Helvetica').fillColor('#1e293b').text(specsText, 45, doc.y + 2, { width: 490 });
        doc.moveDown(0.8);
      }

      // Section: Owner & Inspection Details
      doc.moveDown(0.5);
      doc.fillColor('#1e3a8a').fontSize(11).font('Helvetica-Bold').text('2. APPLICANT & VERIFICATION DETAILS', 40, doc.y);
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y + 2).lineTo(550, doc.y + 2).stroke();
      doc.moveDown(0.5);

      const userTable = [
        ['Owner / Organization:', user?.orgDetails?.companyName || user?.name || 'N/A'],
        ['Contact Person:', user?.name || 'N/A'],
        ['GST / Tax ID:', user?.orgDetails?.gstNumber || 'N/A'],
        ['Inspection Result:', inspection?.result ? `${inspection.result} (Complies with Maximum Permissible Error tolerances)` : 'PASS - Complies with Statutory Standards'],
        ['Verified By:', `${certificate.issuingAuthority?.officerName || 'Inspector'} (${certificate.issuingAuthority?.officerRole?.toUpperCase() || 'LMO'}, Badge: ${certificate.issuingAuthority?.badgeNumber || 'DL-OFFICER'})`]
      ];

      userTable.forEach(([label, value]) => {
        const rowY = doc.y;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#334155').text(label, 45, rowY, { width: 150 });
        doc.font('Helvetica').fillColor('#0f172a').text(value, 200, rowY, { width: 340 });
        doc.moveDown(0.4);
      });

      // Statutory Declaration
      doc.moveDown(0.5);
      const declY = doc.y;
      doc.rect(40, declY, 510, 45).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#475569').text(
        'Statutory Declaration: Certified that the weighing/measuring instrument described above has been inspected, tested, and verified in accordance with the provisions of the Legal Metrology Act, 2009 and the Rules made thereunder, and found to satisfy statutory tolerances. The official security seal has been affixed.',
        45, declY + 5, { width: 500, lineGap: 2 }
      );

      // Footer with QR Code and Official Stamp
      const footerY = 660;
      const verifyUrl = certificate.verificationUrl || `https://e-metrology.gov.in/verify/${certificate.qrToken}`;

      // QR Code
      try {
        const qrBuffer = await generateQRCodeBuffer(verifyUrl);
        doc.image(qrBuffer, 45, footerY, { width: 90, height: 90 });
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#1e3a8a').text('Scan to Verify Authenticity', 40, footerY + 95, { width: 100, align: 'center' });
      } catch (qrErr) {
        console.error('Failed to attach QR to PDF', qrErr);
      }

      // Security Notice
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text(
        `Digital Certificate ID: ${certificate.qrToken}\nTampering with or forging this certificate is punishable under Section 44 of the Act.\nVerify online at:\n${verifyUrl}`,
        155, footerY + 15, { width: 220 }
      );

      // Officer Signature Block
      doc.rect(390, footerY, 160, 90).stroke('#cbd5e1');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e3a8a').text('DIGITALLY SIGNED & ISSUED', 395, footerY + 8, { width: 150, align: 'center' });
      doc.fontSize(7.5).font('Helvetica').fillColor('#334155').text(
        `Officer: ${certificate.issuingAuthority?.officerName || 'Legal Metrology Officer'}\nJurisdiction: ${certificate.issuingAuthority?.jurisdiction || 'New Delhi'}\nDate: ${new Date(certificate.issuedDate).toLocaleDateString('en-IN')}\nStatus: VERIFIED & SEALED`,
        395, footerY + 28, { width: 150, align: 'center', lineGap: 2 }
      );

      doc.end();

      writeStream.on('finish', () => {
        resolve(`/uploads/certificates/${filename}`);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateCertificatePDF,
};
