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
  // Government Legal Metrology Act 2009 statutory fields
  modelApprovalNumber: {
    type: String,
    trim: true,
    // Model Approval Certificate under Section 22 of Legal Metrology Act, 2009
  },
  accuracyClass: {
    type: String,
    enum: ['Class I (Special)', 'Class II (High)', 'Class III (Medium)', 'Class IIII (Ordinary)', 'Class 0.2', 'Class 0.5', 'Class 1', 'Class 2', 'N/A'],
    default: 'Class III (Medium)'
  },
  verificationType: {
    type: String,
    enum: ['initial_verification', 'periodical_reverification', 'post_repair', 'field_seizure_test'],
    default: 'initial_verification'
  },
  maxCapacity: String,
  minCapacity: String,
  verificationIntervalE: String,
  actualIntervalD: String,
  yearOfManufacture: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  countryOfOrigin: {
    type: String,
    default: 'India'
  },
  manufacturerName: String,
  feePaymentRef: {
    challanNumber: String,
    amountPaid: Number,
    paymentDate: Date,
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Exempted'],
      default: 'Paid'
    }
  },
  registeredBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    name: String
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
