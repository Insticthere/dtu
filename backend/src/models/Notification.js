const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['expiry_alert', 'status_update', 'system'],
    required: true,
  },
  title: String,
  message: {
    type: String,
    required: true,
  },
  relatedInstrumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instrument'
  },
  relatedCertificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  },
  relatedApplicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  daysUntilExpiry: Number,
  read: {
    type: Boolean,
    default: false,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
