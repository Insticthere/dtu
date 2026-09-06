const mongoose = require('mongoose');

const instrumentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InstrumentCategory',
    required: true,
  },
  make: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  serialNumber: {
    type: String,
    required: true,
    trim: true,
  },
  // Specs dynamically filled based on category
  specs: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  location: {
    premisesName: String,
    address: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, default: 'Delhi' },
    pinCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  status: {
    type: String,
    enum: ['unverified', 'pending_verification', 'active', 'expired', 'rejected'],
    default: 'unverified'
  },
  activeCertificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Instrument', instrumentSchema);
