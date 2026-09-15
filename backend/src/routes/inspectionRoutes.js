const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Application = require('../models/Application');
const Instrument = require('../models/Instrument');
const InspectionRecord = require('../models/InspectionRecord');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { generateCertificatePDF } = require('../services/certificateService');
const { createNotification } = require('../services/notificationService');

// Helper to generate unique Certificate Number
const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `LM-VER-${year}-${randomDigits}`;
};

// @route   POST /api/applications/:id/inspection
// @desc    Officer submits observations + photos + Pass/Fail
// @access  Private (LMO, GATC, Admin)
router.post('/:id/inspection', protect, authorize('lmo', 'gatc', 'admin'), upload.array('photos', 5), async (req, res) => {
  try {
    const applicationId = req.params.id;
    const {
      observations: rawObservations,
      result,
      remarks,
      environmentalConditions: rawEnv,
      workingStandardsUsed: rawStandards
    } = req.body;

    if (!result || !['Pass', 'Fail'].includes(result)) {
      return res.status(400).json({ success: false, message: "Result must be 'Pass' or 'Fail'" });
    }

    // GATC centre must be verified/approved by admin before issuing certificates
    if (req.user.role === 'gatc' && !req.user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your GATC testing centre has not been verified and approved by the Admin. Please contact the Metrology Department.',
      });
    }

    let observations = {};
    if (typeof rawObservations === 'string') {
      try {
        observations = JSON.parse(rawObservations);
      } catch (e) {
        observations = { raw: rawObservations };
      }
    } else if (typeof rawObservations === 'object') {
      observations = rawObservations;
    }

    let environmentalConditions = {};
    if (typeof rawEnv === 'string') {
      try { environmentalConditions = JSON.parse(rawEnv); } catch (e) {}
    } else if (rawEnv) {
      environmentalConditions = rawEnv;
    }

    let workingStandardsUsed = [];
    if (typeof rawStandards === 'string') {
      try { workingStandardsUsed = JSON.parse(rawStandards); } catch (e) {}
    } else if (Array.isArray(rawStandards)) {
      workingStandardsUsed = rawStandards;
    }

    const application = await Application.findById(applicationId)
      .populate({
        path: 'instrumentId',
        populate: { path: 'categoryId' }
      })
      .populate('userId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const photoPaths = (req.files || []).map(f => `/uploads/${f.filename}`);

    // Create Inspection Record
    const inspection = await InspectionRecord.create({
      applicationId: application._id,
      officerId: req.user._id,
      observations,
      result,
      photos: photoPaths,
      remarks: remarks || '',
      environmentalConditions,
      workingStandardsUsed,
      conductedAt: new Date(),
    });

    application.inspectionRecordId = inspection._id;
    const instrument = application.instrumentId;
    const category = instrument.categoryId;
    const user = application.userId;

    let certificate = null;

    if (result === 'Pass') {
      // 1. Generate unguessable QR Token
      const qrToken = crypto.randomBytes(24).toString('hex');

      // 2. Determine Validity Duration
      const validityMonths = category.verificationValidityMonths || 12;
      const issuedDate = new Date();
      const validUntil = new Date(issuedDate);
      validUntil.setMonth(validUntil.getMonth() + validityMonths);

      const certNumber = generateCertificateNumber();
      // FRONTEND_URL env var (e.g. https://e-metrology.example.com) or dev frontend port 5173
      const frontendBase = process.env.FRONTEND_URL ||
        `${req.protocol}://${req.hostname}${req.hostname === 'localhost' ? ':5173' : ''}`;
      const verificationUrl = `${frontendBase}/verify/${qrToken}`;

      // 3. Create Certificate Document in DB
      certificate = await Certificate.create({
        applicationId: application._id,
        certificateNumber: certNumber,
        qrToken,
        issuedDate,
        validUntil,
        verificationValidityMonths: validityMonths,
        status: 'Active',
        issuingAuthority: {
          officerName: req.user.name,
          officerRole: req.user.role,
          badgeNumber: req.user.badgeNumber || 'LMO-DL-OFFICER',
          jurisdiction: req.user.jurisdictionDistrict || 'Delhi Central',
        },
        verificationUrl,
      });

      // 4. Generate Certificate PDF using PDFKit
      try {
        const pdfPath = await generateCertificatePDF({
          certificate,
          application,
          instrument,
          category,
          user,
          inspection
        });
        certificate.pdfPath = pdfPath;
        await certificate.save();
      } catch (pdfErr) {
        console.error('PDF Generation warning:', pdfErr.message);
      }

      // Update Application & Instrument
      application.status = 'Certified';
      application.certificateId = certificate._id;
      application.timeline.push({
        status: 'Certified',
        timestamp: new Date(),
        performedBy: req.user._id,
        note: `Verification Passed. Certificate #${certNumber} issued, valid until ${validUntil.toLocaleDateString('en-IN')}.`
      });

      instrument.status = 'active';
      instrument.activeCertificateId = certificate._id;
      await instrument.save();

      // Create Notification
      await createNotification({
        userId: user._id,
        type: 'status_update',
        title: 'Verification Certificate Issued!',
        message: `Congratulations! Your instrument ${instrument.make} ${instrument.model} has been successfully verified. Certificate #${certNumber} is now active.`,
        relatedInstrumentId: instrument._id,
        relatedCertificateId: certificate._id,
        relatedApplicationId: application._id,
      });

    } else {
      // Rejection / Fail
      application.status = 'Rejected';
      application.timeline.push({
        status: 'Rejected',
        timestamp: new Date(),
        performedBy: req.user._id,
        note: `Verification Failed. Remarks: ${remarks || 'Tolerances exceeded statutory limits'}.`
      });

      instrument.status = 'rejected';
      await instrument.save();

      await createNotification({
        userId: user._id,
        type: 'status_update',
        title: 'Verification Test Failed',
        message: `Your instrument ${instrument.make} ${instrument.model} did not pass the verification test. Reason: ${remarks || 'Non-compliance with statutory standards'}.`,
        relatedInstrumentId: instrument._id,
        relatedApplicationId: application._id,
      });
    }

    await application.save();

    res.status(201).json({
      success: true,
      message: `Inspection recorded successfully. Result: ${result}`,
      inspection,
      certificate,
      application,
    });
  } catch (err) {
    console.error('Error recording inspection:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/applications/:id/inspection
// @desc    Get inspection record for an application
// @access  Private
router.get('/:id/inspection', protect, async (req, res) => {
  try {
    const inspection = await InspectionRecord.findOne({ applicationId: req.params.id })
      .populate('officerId', 'name email role badgeNumber jurisdictionDistrict');

    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection record not found for this application' });
    }

    res.json({
      success: true,
      inspection,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
