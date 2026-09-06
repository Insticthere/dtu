const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'lmo', 'gatc', 'admin'],
    default: 'user',
    required: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  orgDetails: {
    companyName: String,
    gstNumber: String,
    address: String,
    district: String,
    state: { type: String, default: 'Delhi' },
    approvedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InstrumentCategory' }] // for GATC centre scope
  },
  passwordHash: {
    type: String,
    required: true,
  },
  isApproved: {
    type: Boolean,
    default: true, // Auto-active for MVP per brief
  },
  badgeNumber: {
    type: String, // e.g. LMO-DL-401 or GATC-DL-08
  },
  jurisdictionDistrict: {
    type: String,
    default: 'New Delhi'
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
