const express = require('express');
const router = express.Router();
const Instrument = require('../models/Instrument');
const InstrumentCategory = require('../models/InstrumentCategory');
const { protect } = require('../middleware/auth');

// @route   POST /api/instruments
// @desc    User adds an instrument
// @access  Private (User/Admin)
router.post('/', protect, async (req, res) => {
  try {
    const { categoryId, make, model, serialNumber, specs, location } = req.body;

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

    const instrument = await Instrument.create({
      ownerId: req.user._id,
      categoryId,
      make,
      model,
      serialNumber,
      specs: specs || {},
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

    const populated = await Instrument.findById(instrument._id).populate('categoryId').populate('ownerId', 'name email phone orgDetails');

    res.status(201).json({
      success: true,
      message: 'Instrument registered successfully',
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
