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
    const certNumber = req.params.certNumber.trim();
    const certificate = await Certificate.findOne({
      certificateNumber: { $regex: new RegExp(`^${certNumber}$`, 'i') }
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: `No certificate found matching number '${certNumber}'`
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
    const { qrToken } = req.params;

    const certificate = await Certificate.findOne({ qrToken })
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'userId', select: 'name orgDetails' },
          { path: 'instrumentId', populate: { path: 'categoryId' } },
          { path: 'inspectionRecordId', select: 'result conductedAt workingStandardsUsed' }
        ]
      });

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

    const maskedOwnerName = maskName(user?.orgDetails?.companyName || user?.name || 'Owner');

    res.json({
      success: true,
      valid: currentStatus === 'Active',
      data: {
        certificateNumber: certificate.certificateNumber,
        status: currentStatus,
        category: category?.name || 'Standard Metrology Instrument',
        applicableStandard: category?.applicableStandard || 'Legal Metrology Act, 2009',
        make: instrument?.make || 'Unknown',
        model: instrument?.model || 'Unknown',
        serialNumber: instrument?.serialNumber || 'N/A',
        maskedOwnerName: maskedOwnerName,
        premisesLocation: `${instrument?.location?.district || ''}, ${instrument?.location?.state || 'Delhi'}`,
        issuedDate: certificate.issuedDate,
        validUntil: certificate.validUntil,
        issuingAuthority: certificate.issuingAuthority,
        verifiedAt: new Date(),
        inspectionResult: app?.inspectionRecordId?.result || 'Pass',
      }
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
