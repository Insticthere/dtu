const express = require('express');
const router = express.Router();
const InstrumentCategory = require('../models/InstrumentCategory');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/categories
// @desc    List all instrument categories
// @access  Public (so users can select when adding instruments)
router.get('/', async (req, res) => {
  try {
    const categories = await InstrumentCategory.find().sort({ name: 1 });
    res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await InstrumentCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/categories
// @desc    Create new instrument category + dynamic inspectionSchema
// @access  Admin only
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code, description, verificationValidityMonths, inspectionSchema, specSchema, applicableStandard } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const generatedCode = code ? code.toUpperCase() : name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 8);

    const category = await InstrumentCategory.create({
      name,
      code: generatedCode,
      description,
      verificationValidityMonths: verificationValidityMonths || 12,
      inspectionSchema: inspectionSchema || [],
      specSchema: specSchema || [],
      applicableStandard: applicableStandard || 'Legal Metrology (General) Rules, 2011',
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
