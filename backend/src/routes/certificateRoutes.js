const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Certificate = require('../models/Certificate');
const Application = require('../models/Application');
const { protect } = require('../middleware/auth');
const { generateQRCodeDataUrl } = require('../services/qrService');

// @route   GET /api/certificates/:certNumber
// @desc    Get certificate details + QR code for viewing
// @access  Public / Authenticated
router.get('/:certNumber', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateNumber: req.params.certNumber })
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'userId', select: 'name email phone orgDetails' },
          { path: 'instrumentId', populate: { path: 'categoryId' } },
          { path: 'inspectionRecordId', populate: { path: 'officerId', select: 'name role badgeNumber' } }
        ]
      });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Generate dynamic QR Code Data URL
    const qrCodeDataUrl = await generateQRCodeDataUrl(certificate.verificationUrl);

    res.json({
      success: true,
      certificate,
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
