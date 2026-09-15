const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const seedDatabase = require('../seed/seedData');

// @route   POST /api/admin/reset-demo
// @desc    Wipe all collections and re-seed with fresh demo data (BASE_URL-aware)
// @access  Private (Admin only)
router.post('/reset-demo', protect, authorize('admin'), async (req, res) => {
  try {
    console.log(`[ADMIN RESET] Demo reset triggered by ${req.user.email} at ${new Date().toISOString()}`);
    await seedDatabase();
    res.json({
      success: true,
      message: 'Database wiped and re-seeded successfully with fresh demo data. All QR codes now point to the correct domain.',
      credentials: {
        note: 'All accounts reset to password: password123',
        admin: 'admin@metrology.gov.in',
        lmo: 'lmo.verma@metrology.gov.in',
        gatc: 'gatc.lab@testcentre.org',
        user1: 'ramesh.traders@gmail.com',
        user2: 'delhi.hospital@medhealth.in',
      }
    });
  } catch (err) {
    console.error('[ADMIN RESET] Seed failed:', err);
    res.status(500).json({ success: false, message: `Reset failed: ${err.message}` });
  }
});

module.exports = router;
