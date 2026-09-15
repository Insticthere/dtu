const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');

// Helper to mask sensitive owner name: e.g. "Ramesh Sharma" -> "R****h S****a"
const maskName = (name) => {
  if (!name) return 'Valued Citizen';
  return name.split(' ').map(word => {
    if (word.length <= 2) return word;
    return word[0] + '*'.repeat(Math.max(1, word.length - 2)) + word[word.length - 1];
  }).join(' ');
};

// @route   GET /api/verify/search/:certNumber
// @desc    PUBLIC — Search certificate by Certificate Number or Application Number
// @access  Public
// IMPORTANT: This route MUST be before /:qrToken to avoid being swallowed by the wildcard
router.get('/search/:certNumber', async (req, res) => {
  try {
    const rawParam = req.params.certNumber.trim();
    const regexPattern = `^${rawParam.replace(/[-_]/g, '[-_]')}$`;
    let certificate = await Certificate.findOne({
      certificateNumber: { $regex: new RegExp(regexPattern, 'i') }
    });

    if (!certificate) {
      certificate = await Certificate.findOne({ qrToken: rawParam });
    }

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: `No certificate found matching '${rawParam}'`
      });
    }

    res.json({
      success: true,
      qrToken: certificate.qrToken,
      certificateNumber: certificate.certificateNumber,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/verify/:qrToken
// @desc    PUBLIC, NO AUTH — Verification by QR Token (powers the QR code scan page)
// @access  Public
router.get('/:qrToken', async (req, res) => {
  try {
    const rawToken = req.params.qrToken.trim();

    let certificate = await Certificate.findOne({ qrToken: rawToken })
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'userId', select: 'name orgDetails' },
          { path: 'instrumentId', populate: { path: 'categoryId' } },
          { path: 'inspectionRecordId', select: 'result conductedAt workingStandardsUsed' }
        ]
      });

    // If not found by qrToken, also check if rawToken is a Certificate Number (e.g. LM-VER-2026-908123)
    if (!certificate) {
      const regexPattern = `^${rawToken.replace(/[-_]/g, '[-_]')}$`;
      certificate = await Certificate.findOne({
        certificateNumber: { $regex: new RegExp(regexPattern, 'i') }
      }).populate({
        path: 'applicationId',
        populate: [
          { path: 'userId', select: 'name orgDetails' },
          { path: 'instrumentId', populate: { path: 'categoryId' } },
          { path: 'inspectionRecordId', select: 'result conductedAt workingStandardsUsed' }
        ]
      });
    }

    if (!certificate) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid or unrecognized QR verification token. This certificate may be counterfeit or unregistered.',
      });
    }

    const app = certificate.applicationId;
    const instrument = app ? app.instrumentId : null;
    const category = instrument ? instrument.categoryId : null;
    const user = app ? app.userId : null;

    // Check dynamic expiration
    const now = new Date();
    let currentStatus = certificate.status;
    if (certificate.validUntil && new Date(certificate.validUntil) < now && currentStatus === 'Active') {
      currentStatus = 'Expired';
      certificate.status = 'Expired';
      await certificate.save();
    }

    const maskedOwnerName = maskName(user?.name || user?.orgDetails?.companyName || 'Owner');

    res.json({
      success: true,
      valid: currentStatus === 'Active',
      data: {
        certificateNumber: certificate.certificateNumber,
        qrToken: certificate.qrToken,
        status: currentStatus,
        category: category?.name || 'Standard Metrology Instrument',
        applicableStandard: category?.applicableStandard || 'Legal Metrology Act, 2009',
        make: instrument?.make || 'Unknown',
        model: instrument?.model || 'Unknown',
        serialNumber: instrument?.serialNumber || 'N/A',
        maskedOwnerName: maskedOwnerName,
        companyName: user?.orgDetails?.companyName || '',
        premisesLocation: `${instrument?.location?.district || ''}, ${instrument?.location?.state || 'Delhi'}`,
        issuedDate: certificate.issuedDate,
        validUntil: certificate.validUntil,
        issuingAuthority: certificate.issuingAuthority,
        verifiedAt: new Date(),
        inspectionResult: app?.inspectionRecordId?.result || 'Pass',
        pdfPath: certificate.pdfPath || null,
        downloadUrl: `/api/certificates/${certificate.certificateNumber}/download`,
      }
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
