const Notification = require('../models/Notification');

const createNotification = async ({ userId, type, title, message, relatedInstrumentId, relatedCertificateId, relatedApplicationId, daysUntilExpiry }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedInstrumentId,
      relatedCertificateId,
      relatedApplicationId,
      daysUntilExpiry,
      sentAt: new Date(),
    });

    // SMS / Email Integration Stub (can be swapped with Twilio / SendGrid / Gov SMS gateway)
    console.log(`[Notification Dispatch - ${type.toUpperCase()}] User: ${userId} | Message: ${message}`);

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};

const sendExpiryAlertStub = async (user, instrument, certificate, days) => {
  console.log(`[STUB EMAIL/SMS DISPATCH] Expiry Alert (${days} days) sent to ${user.email} for instrument ${instrument.make} ${instrument.model} (Cert #${certificate.certificateNumber})`);
};

module.exports = {
  createNotification,
  sendExpiryAlertStub,
};
