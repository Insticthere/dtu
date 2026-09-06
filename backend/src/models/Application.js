const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    unique: true,
    required: true,
  },
  instrumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instrument',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  applicationType: {
    type: String,
    enum: ['initial_verification', 're_verification'],
    default: 'initial_verification'
  },
  status: {
    type: String,
    enum: ['Submitted', 'Scheduled', 'Inspected', 'Certified', 'Rejected'],
    default: 'Submitted',
  },
  assignedOfficerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedAt: Date,
  scheduledDate: Date,
  inspectionVenue: {
    type: String,
    enum: ['on_site', 'gatc_centre'],
    default: 'on_site'
  },
  applicantRemarks: String,
  officerRemarks: String,
  inspectionRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InspectionRecord'
  },
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String
  }]
}, {
  timestamps: true,
});

module.exports = mongoose.model('Application', applicationSchema);
