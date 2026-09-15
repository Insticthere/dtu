const express = require('express');
const router = express.Router();
const Instrument = require('../models/Instrument');
const InstrumentCategory = require('../models/InstrumentCategory');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/instruments
// @desc    Register a new instrument (Trader or Admin only)
// @access  Private (User/Admin) — LMO/GATC officers cannot register instruments
router.post('/', protect, authorize('user', 'admin'), async (req, res) => {
  try {
    const {
      categoryId,
      make,
      model,
      serialNumber,
      specs,
      location,
      ownerId,
      newTrader,
      modelApprovalNumber,
      accuracyClass,
      verificationType,
      maxCapacity,
      minCapacity,
      verificationIntervalE,
      actualIntervalD,
      yearOfManufacture,
      countryOfOrigin,
      manufacturerName,
      feePaymentRef
    } = req.body;

    if (!categoryId || !make || !model || !serialNumber || !location?.address || !location?.district) {
      return res.status(400).json({
        success: false,
        message: 'Category, make, model, serial number, address, and district are required.',
      });
    }

    const category = await InstrumentCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Invalid instrument category selected.' });
    }

    // Determine owner:
    // If standard user, owner is caller.
    // If officer/admin, can assign to existing trader or quick-register a new trader.
    let targetOwnerId = req.user._id;

    if (req.user.role !== 'user') {
      if (ownerId) {
        const existingOwner = await User.findById(ownerId);
        if (existingOwner) {
          targetOwnerId = existingOwner._id;
        }
      } else if (newTrader && newTrader.name) {
        // Quick register trader by officer/admin
        const traderEmail = (newTrader.email || `trader.${Date.now()}@metrology.local`).toLowerCase();
        let trader = await User.findOne({ email: traderEmail });
        if (!trader) {
          const salt = await bcrypt.genSalt(10);
          const defaultPassword = await bcrypt.hash('trader123', salt);
          trader = await User.create({
            name: newTrader.name,
            email: traderEmail,
            passwordHash: defaultPassword,
            role: 'user',
            phone: newTrader.phone || '',
            orgDetails: {
              companyName: newTrader.companyName || newTrader.name,
              gstNumber: newTrader.gstNumber || '',
              address: location?.address || '',
              district: location?.district || 'Central Delhi',
              state: location?.state || 'Delhi',
            },
            isApproved: true,
            jurisdictionDistrict: location?.district || 'New Delhi'
          });
        }
        targetOwnerId = trader._id;
      }
    }

    const instrument = await Instrument.create({
      ownerId: targetOwnerId,
      categoryId,
      make,
      model,
      serialNumber,
      specs: specs || {},
      modelApprovalNumber: modelApprovalNumber || (category.code ? `DLM/IND/APP/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}` : undefined),
      accuracyClass: accuracyClass || 'Class III (Medium)',
      verificationType: verificationType || 'initial_verification',
      maxCapacity: maxCapacity || (specs?.maxCapacityKg ? `${specs.maxCapacityKg} kg` : undefined),
      minCapacity: minCapacity || (specs?.minCapacityG ? `${specs.minCapacityG} g` : undefined),
      verificationIntervalE: verificationIntervalE || (specs?.verificationIntervalE ? `${specs.verificationIntervalE} g` : undefined),
      actualIntervalD: actualIntervalD || undefined,
      yearOfManufacture: yearOfManufacture || new Date().getFullYear(),
      countryOfOrigin: countryOfOrigin || 'India',
      manufacturerName: manufacturerName || make,
      feePaymentRef: feePaymentRef || {
        challanNumber: `BK/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`,
        amountPaid: 250,
        paymentDate: new Date(),
        paymentStatus: 'Paid'
      },
      registeredBy: {
        userId: req.user._id,
        role: req.user.role,
        name: req.user.name
      },
      location: {
        premisesName: location.premisesName || '',
        address: location.address,
        district: location.district,
        state: location.state || 'Delhi',
        pinCode: location.pinCode || '',
        coordinates: location.coordinates || { lat: 28.6139, lng: 77.2090 }
      },
      status: 'unverified'
    });

    const populated = await Instrument.findById(instrument._id)
      .populate('categoryId')
      .populate('ownerId', 'name email phone orgDetails')
      .populate('registeredBy.userId', 'name role badgeNumber');

    res.status(201).json({
      success: true,
      message: 'Instrument registered successfully with statutory metrology parameters',
      instrument: populated,
    });
  } catch (err) {
    console.error('Error creating instrument:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/instruments
// @desc    List own instruments (for user), or all instruments (for admin/LMO/GATC)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'user') {
      query.ownerId = req.user._id;
    }

    const instruments = await Instrument.find(query)
      .populate('categoryId')
      .populate('ownerId', 'name email phone orgDetails')
      .populate('registeredBy.userId', 'name role badgeNumber')
      .populate('activeCertificateId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: instruments.length,
      instruments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/instruments/:id
// @desc    Get single instrument by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const instrument = await Instrument.findById(req.params.id)
      .populate('categoryId')
      .populate('ownerId', 'name email phone orgDetails')
      .populate('registeredBy.userId', 'name role badgeNumber')
      .populate('activeCertificateId');

    if (!instrument) {
      return res.status(404).json({ success: false, message: 'Instrument not found' });
    }

    if (req.user.role === 'user' && instrument.ownerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this instrument' });
    }

    res.json({
      success: true,
      instrument,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
