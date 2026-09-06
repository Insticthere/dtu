const express = require('express');
const router = express.Router();
const Instrument = require('../models/Instrument');
const Application = require('../models/Application');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const InstrumentCategory = require('../models/InstrumentCategory');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/summary
// @desc    Role-aware dashboard summary metrics
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    if (role === 'user') {
      // User metrics
      const totalInstruments = await Instrument.countDocuments({ ownerId: userId });
      const activeInstruments = await Instrument.countDocuments({ ownerId: userId, status: 'active' });
      const pendingVerification = await Instrument.countDocuments({ ownerId: userId, status: 'pending_verification' });
      const unverified = await Instrument.countDocuments({ ownerId: userId, status: 'unverified' });
      const expired = await Instrument.countDocuments({ ownerId: userId, status: 'expired' });

      const totalApplications = await Application.countDocuments({ userId });
      const inProgressApplications = await Application.countDocuments({
        userId,
        status: { $in: ['Submitted', 'Scheduled'] }
      });
      const certifiedApplications = await Application.countDocuments({ userId, status: 'Certified' });

      // Recent applications
      const recentApplications = await Application.find({ userId })
        .populate({ path: 'instrumentId', populate: { path: 'categoryId' } })
        .populate('certificateId')
        .sort({ createdAt: -1 })
        .limit(5);

      // Instruments nearing expiry (next 60 days)
      const now = new Date();
      const sixtyDaysAhead = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const expiringCertificates = await Certificate.find({
        status: 'Active',
        validUntil: { $gte: now, $lte: sixtyDaysAhead }
      }).populate({
        path: 'applicationId',
        match: { userId },
        populate: { path: 'instrumentId' }
      });

      const userExpiring = expiringCertificates.filter(c => c.applicationId != null);

      return res.json({
        success: true,
        role: 'user',
        metrics: {
          totalInstruments,
          activeInstruments,
          pendingVerification,
          unverified,
          expired,
          totalApplications,
          inProgressApplications,
          certifiedApplications,
          expiringSoonCount: userExpiring.length,
        },
        recentApplications,
        expiringInstruments: userExpiring,
      });

    } else if (role === 'lmo' || role === 'gatc') {
      // Officer metrics
      const assignedToMe = await Application.countDocuments({ assignedOfficerId: userId });
      const pendingInspection = await Application.countDocuments({
        assignedOfficerId: userId,
        status: { $in: ['Scheduled', 'Submitted'] }
      });
      const unassignedPool = await Application.countDocuments({
        assignedOfficerId: null,
        status: 'Submitted'
      });
      const completedInspections = await Application.countDocuments({
        assignedOfficerId: userId,
        status: { $in: ['Certified', 'Rejected'] }
      });

      const upcomingQueue = await Application.find({
        $or: [
          { assignedOfficerId: userId, status: { $in: ['Scheduled', 'Submitted'] } },
          { assignedOfficerId: null, status: 'Submitted' }
        ]
      })
      .populate({ path: 'instrumentId', populate: { path: 'categoryId' } })
      .populate('userId', 'name email phone orgDetails')
      .sort({ scheduledDate: 1, createdAt: 1 })
      .limit(10);

      return res.json({
        success: true,
        role: req.user.role,
        metrics: {
          assignedToMe,
          pendingInspection,
          unassignedPool,
          completedInspections,
        },
        upcomingQueue,
      });

    } else if (role === 'admin') {
      // State-wide metrics for Admin
      const totalUsers = await User.countDocuments({ role: 'user' });
      const totalOfficers = await User.countDocuments({ role: { $in: ['lmo', 'gatc'] } });
      const totalInstruments = await Instrument.countDocuments();
      const activeVerifiedInstruments = await Instrument.countDocuments({ status: 'active' });
      const expiredInstruments = await Instrument.countDocuments({ status: 'expired' });

      const totalApplications = await Application.countDocuments();
      const pendingApplications = await Application.countDocuments({ status: 'Submitted' });
      const scheduledApplications = await Application.countDocuments({ status: 'Scheduled' });
      const certifiedApplications = await Application.countDocuments({ status: 'Certified' });
      const rejectedApplications = await Application.countDocuments({ status: 'Rejected' });

      // Breakdown by Category
      const categories = await InstrumentCategory.find();
      const categoryBreakdown = await Promise.all(
        categories.map(async (cat) => {
          const count = await Instrument.countDocuments({ categoryId: cat._id });
          return { name: cat.name, count };
        })
      );

      // Overdue Instruments (Active cert validUntil in the past)
      const now = new Date();
      const overdueCount = await Certificate.countDocuments({
        status: 'Active',
        validUntil: { $lt: now }
      });

      const recentApplications = await Application.find()
        .populate({ path: 'instrumentId', populate: { path: 'categoryId' } })
        .populate('userId', 'name email phone orgDetails')
        .populate('assignedOfficerId', 'name badgeNumber')
        .sort({ createdAt: -1 })
        .limit(10);

      return res.json({
        success: true,
        role: 'admin',
        metrics: {
          totalUsers,
          totalOfficers,
          totalInstruments,
          activeVerifiedInstruments,
          expiredInstruments,
          overdueCount,
          totalApplications,
          pendingApplications,
          scheduledApplications,
          certifiedApplications,
          rejectedApplications,
        },
        categoryBreakdown,
        recentApplications,
      });
    }

    res.status(400).json({ success: false, message: 'Unrecognized user role' });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
