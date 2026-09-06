const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Application = require('../models/Application');
const Instrument = require('../models/Instrument');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');

// Helper to generate unique Application Number
const generateAppNumber = () => {
  const dateStr = new Date().getFullYear();
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `APP-${dateStr}-${randomHex}`;
};

// @route   POST /api/applications
// @desc    Submit application for verification / re-verification
// @access  Private (User/Admin)
router.post('/', protect, async (req, res) => {
  try {
    const { instrumentId, applicationType, applicantRemarks, inspectionVenue } = req.body;

    if (!instrumentId) {
      return res.status(400).json({ success: false, message: 'Instrument ID is required' });
    }

    const instrument = await Instrument.findById(instrumentId).populate('categoryId');
    if (!instrument) {
      return res.status(404).json({ success: false, message: 'Instrument not found' });
    }

    // Check ownership if user
    if (req.user.role === 'user' && instrument.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to apply for this instrument' });
    }

    // Check if there's an ongoing active application
    const ongoingApp = await Application.findOne({
      instrumentId,
      status: { $in: ['Submitted', 'Scheduled'] }
    });

    if (ongoingApp) {
      return res.status(400).json({
        success: false,
        message: `An application (${ongoingApp.applicationNumber}) is already in progress for this instrument.`
      });
    }

    const appNumber = generateAppNumber();

    const application = await Application.create({
      applicationNumber: appNumber,
      instrumentId,
      userId: req.user._id,
      applicationType: applicationType || 'initial_verification',
      applicantRemarks: applicantRemarks || '',
      inspectionVenue: inspectionVenue || 'on_site',
      status: 'Submitted',
      timeline: [{
        status: 'Submitted',
        timestamp: new Date(),
        performedBy: req.user._id,
        note: 'Application submitted for Legal Metrology verification.'
      }]
    });

    // Update instrument status
    instrument.status = 'pending_verification';
    await instrument.save();

    // Create Notification
    await createNotification({
      userId: req.user._id,
      type: 'status_update',
      title: 'Application Submitted',
      message: `Your verification application #${appNumber} for ${instrument.make} ${instrument.model} has been submitted successfully.`,
      relatedInstrumentId: instrument._id,
      relatedApplicationId: application._id,
    });

    const populatedApp = await Application.findById(application._id)
      .populate('instrumentId')
      .populate('userId', 'name email phone orgDetails');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: populatedApp,
    });
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/applications
// @desc    Get applications filtered by role: own for user, assigned for LMO/GATC, all for admin
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'user') {
      query.userId = req.user._id;
    } else if (req.user.role === 'lmo' || req.user.role === 'gatc') {
      // Officer sees applications assigned to them OR unassigned applications in their jurisdiction
      query = {
        $or: [
          { assignedOfficerId: req.user._id },
          { assignedOfficerId: null, status: 'Submitted' }
        ]
      };
    }
    // Admin sees all applications (query remains empty)

    const applications = await Application.find(query)
      .populate({
        path: 'instrumentId',
        populate: { path: 'categoryId' }
      })
      .populate('userId', 'name email phone orgDetails')
      .populate('assignedOfficerId', 'name email role badgeNumber jurisdictionDistrict')
      .populate('certificateId')
      .populate('inspectionRecordId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/applications/:id
// @desc    Get single application details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({
        path: 'instrumentId',
        populate: { path: 'categoryId' }
      })
      .populate('userId', 'name email phone orgDetails')
      .populate('assignedOfficerId', 'name email role badgeNumber jurisdictionDistrict')
      .populate('inspectionRecordId')
      .populate('certificateId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (req.user.role === 'user' && application.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this application' });
    }

    res.json({
      success: true,
      application,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/applications/:id/schedule
// @desc    LMO/Admin schedules date and assigns officer
// @access  Private (LMO, GATC, Admin)
router.patch('/:id/schedule', protect, authorize('lmo', 'gatc', 'admin'), async (req, res) => {
  try {
    const { scheduledDate, assignedOfficerId, officerRemarks, inspectionVenue } = req.body;

    const application = await Application.findById(req.params.id).populate('instrumentId').populate('userId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status === 'Certified' || application.status === 'Rejected') {
      return res.status(400).json({ success: false, message: `Cannot reschedule an application with status '${application.status}'` });
    }

    // Set assigned officer: specified officer or current caller if LMO/GATC
    const officerToAssign = assignedOfficerId || req.user._id;
    const officer = await User.findById(officerToAssign);

    application.scheduledDate = scheduledDate ? new Date(scheduledDate) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    application.assignedOfficerId = officerToAssign;
    application.assignedAt = new Date();
    application.status = 'Scheduled';
    if (officerRemarks) application.officerRemarks = officerRemarks;
    if (inspectionVenue) application.inspectionVenue = inspectionVenue;

    application.timeline.push({
      status: 'Scheduled',
      timestamp: new Date(),
      performedBy: req.user._id,
      note: `Inspection scheduled for ${application.scheduledDate.toLocaleDateString('en-IN')}. Assigned to ${officer ? officer.name : 'Officer'}.`
    });

    await application.save();

    // Notify user
    await createNotification({
      userId: application.userId._id,
      type: 'status_update',
      title: 'Verification Scheduled',
      message: `Your application #${application.applicationNumber} has been scheduled for inspection on ${application.scheduledDate.toLocaleDateString('en-IN')} by ${officer ? officer.name : 'an inspector'}.`,
      relatedInstrumentId: application.instrumentId._id,
      relatedApplicationId: application._id,
    });

    res.json({
      success: true,
      message: 'Application scheduled successfully',
      application,
    });
  } catch (err) {
    console.error('Error scheduling application:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/applications/:id/status
// @desc    Update application status directly (Admin / LMO)
// @access  Private (LMO, GATC, Admin)
router.patch('/:id/status', protect, authorize('lmo', 'gatc', 'admin'), async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (status) application.status = status;
    if (remarks) application.officerRemarks = remarks;

    application.timeline.push({
      status: status || application.status,
      timestamp: new Date(),
      performedBy: req.user._id,
      note: remarks || `Status updated to ${status}`
    });

    await application.save();

    res.json({
      success: true,
      message: 'Status updated successfully',
      application,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
