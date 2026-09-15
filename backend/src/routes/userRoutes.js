const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/users/officers
// @desc    Get list of LMO & GATC officers for assignment
// @access  Private (Admin / LMO)
router.get('/officers', protect, authorize('admin', 'lmo', 'gatc'), async (req, res) => {
  try {
    const officers = await User.find({ role: { $in: ['lmo', 'gatc'] } })
      .select('name email role badgeNumber jurisdictionDistrict orgDetails')
      .sort({ name: 1 });

    res.json({
      success: true,
      officers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/users/traders
// @desc    Get list of registered traders/users for instrument registration & ownership assignment
// @access  Private (Admin / LMO / GATC)
router.get('/traders', protect, authorize('admin', 'lmo', 'gatc'), async (req, res) => {
  try {
    const traders = await User.find({ role: 'user' })
      .select('name email phone orgDetails jurisdictionDistrict')
      .sort({ name: 1 });

    res.json({
      success: true,
      traders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/users
// @desc    Admin lists all registered users
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/users/pending-officers
// @desc    Get list of LMO/GATC officers pending admin approval
// @access  Private (Admin)
router.get('/pending-officers', protect, authorize('admin'), async (req, res) => {
  try {
    const pendingOfficers = await User.find({
      role: { $in: ['lmo', 'gatc'] },
      isApproved: false
    }).select('-passwordHash').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingOfficers.length,
      officers: pendingOfficers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/users/:id/approve
// @desc    Admin approves or revokes a LMO/GATC officer account
// @access  Private (Admin)
router.patch('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { approved } = req.body; // boolean: true = approve, false = revoke

    const officer = await User.findById(req.params.id).select('-passwordHash');
    if (!officer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!['lmo', 'gatc'].includes(officer.role)) {
      return res.status(400).json({ success: false, message: 'Only LMO/GATC officer accounts can be approved via this endpoint' });
    }

    officer.isApproved = approved !== false; // default true
    await officer.save();

    res.json({
      success: true,
      message: `Officer account ${officer.isApproved ? 'approved and activated' : 'revoked and deactivated'} successfully.`,
      officer,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
