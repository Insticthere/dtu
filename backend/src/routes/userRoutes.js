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

module.exports = router;
