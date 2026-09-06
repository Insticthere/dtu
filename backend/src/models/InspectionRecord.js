const mongoose = require('mongoose');

const inspectionRecordSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
  },
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Observations dynamically match the category's inspectionSchema
  observations: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  result: {
    type: String,
    enum: ['Pass', 'Fail'],
    required: true,
  },
  photos: [{
    type: String,
  }],
  remarks: String,
  environmentalConditions: {
    temperatureC: Number,
    relativeHumidityPct: Number,
    barometricPressureHPa: Number,
  },
  workingStandardsUsed: [{
    standardName: String,
    certificateRef: String,
    validUntil: Date
  }],
  conductedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('InspectionRecord', inspectionRecordSchema);
