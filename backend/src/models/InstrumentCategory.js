const mongoose = require('mongoose');

const instrumentCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: String,
  verificationValidityMonths: {
    type: Number,
    required: true,
    default: 12,
  },
  // Dynamic inspection field definitions so new categories can be added without code changes
  inspectionSchema: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },
  specSchema: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },
  applicableStandard: {
    type: String,
    default: 'Legal Metrology (General) Rules, 2011'
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('InstrumentCategory', instrumentCategorySchema);
