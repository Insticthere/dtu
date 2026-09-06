const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
  },
  certificateNumber: {
    type: String,
    unique: true,
    required: true,
  },
  // Random unguessable token for QR code verification
  qrToken: {
    type: String,
    unique: true,
    required: true,
  },
  issuedDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  verificationValidityMonths: {
    type: Number,
    default: 12,
  },
  pdfPath: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Revoked'],
    default: 'Active',
  },
  issuingAuthority: {
    officerName: String,
    officerRole: String,
    badgeNumber: String,
    jurisdiction: String,
  },
  verificationUrl: String,
  revocationReason: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Certificate', certificateSchema);
