const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Certificate = require('../models/Certificate');
const Application = require('../models/Application');
const { generateQRCodeDataUrl } = require('../services/qrService');

// Helper to mask sensitive owner name: e.g. "Ramesh Sharma" -> "R****h S****a"
const maskName = (name) => {
  if (!name) return 'Valued Citizen';
  return name.split(' ').map(word => {
    if (word.length <= 2) return word;
    return word[0] + '*'.repeat(Math.max(1, word.length - 2)) + word[word.length - 1];
  }).join(' ');
};

// @route   GET /api/certificates/:certNumber
// @desc    Get certificate details + QR code for viewing
// @access  Public
router.get('/:certNumber', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateNumber: req.params.certNumber })
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'userId', select: 'name orgDetails' }, // Only select non-sensitive fields
          { path: 'instrumentId', populate: { path: 'categoryId' } },
          { path: 'inspectionRecordId', populate: { path: 'officerId', select: 'name role badgeNumber' } }
        ]
      });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Generate dynamic QR Code Data URL
    const qrCodeDataUrl = await generateQRCodeDataUrl(certificate.verificationUrl);

    // Build a sanitized certificate object — mask personal identity info for public view
    const certObj = certificate.toObject();
    const app = certObj.applicationId;
    if (app && app.userId) {
      // Mask personal name for privacy; also expose company name for official records
      app.userId.maskedName = maskName(app.userId.name || app.userId.orgDetails?.companyName);
      app.userId.companyName = app.userId.orgDetails?.companyName || '';
      // Remove sensitive contact details
      delete app.userId.email;
      delete app.userId.phone;
      // Remove address from orgDetails (keep companyName and gstNumber for official use)
      if (app.userId.orgDetails) {
        delete app.userId.orgDetails.address;
      }
    }

    res.json({
      success: true,
      certificate: certObj,
      qrCodeDataUrl,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/certificates/:certNumber/download
// @desc    Download the official Certificate PDF
// @access  Public
router.get('/:certNumber/download', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateNumber: req.params.certNumber });
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    if (!certificate.pdfPath) {
      return res.status(404).json({ success: false, message: 'PDF document not generated for this certificate' });
    }

    const fullPath = path.join(__dirname, '../..', certificate.pdfPath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Certificate_${certificate.certificateNumber}.pdf"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
