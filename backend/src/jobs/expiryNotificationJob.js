const cron = require('node-cron');
const Certificate = require('../models/Certificate');
const Application = require('../models/Application');
const Instrument = require('../models/Instrument');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { createNotification, sendExpiryAlertStub } = require('../services/notificationService');

const runExpiryCheck = async () => {
  console.log('[Cron Job] Checking for certificates nearing expiry (60, 30, 7 days)...');
  try {
    const activeCertificates = await Certificate.find({ status: 'Active' })
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'userId' },
          { path: 'instrumentId' }
        ]
      });

    const now = new Date();

    for (const cert of activeCertificates) {
      if (!cert.validUntil || !cert.applicationId) continue;

      const app = cert.applicationId;
      const user = app.userId;
      const instrument = app.instrumentId;

      if (!user || !instrument) continue;

      const validUntil = new Date(cert.validUntil);
      const diffTime = validUntil.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Check if already expired
      if (diffDays <= 0) {
        cert.status = 'Expired';
        await cert.save();
        instrument.status = 'expired';
        await instrument.save();

        await createNotification({
          userId: user._id,
          type: 'expiry_alert',
          title: 'Verification Certificate Expired',
          message: `The verification certificate for ${instrument.make} ${instrument.model} (Cert #${cert.certificateNumber}) expired on ${validUntil.toLocaleDateString('en-IN')}. Please apply for re-verification immediately to avoid penalties.`,
          relatedInstrumentId: instrument._id,
          relatedCertificateId: cert._id,
          daysUntilExpiry: 0
        });
        continue;
      }

      // Targets: 60 days, 30 days, 7 days
      const targetDays = [60, 30, 7];
      for (const target of targetDays) {
        // Trigger if diffDays is within the target window and not already notified for this target window today
        if (diffDays <= target && diffDays > (target === 7 ? 0 : target - 7)) {
          // Check if a notification for this cert and target was already sent within the last 5 days
          const existingNotif = await Notification.findOne({
            userId: user._id,
            relatedCertificateId: cert._id,
            daysUntilExpiry: target,
            createdAt: { $gte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
          });

          if (!existingNotif) {
            const urgency = target === 7 ? 'CRITICAL ALERT' : 'Reminder';
            const message = `[${urgency}] Legal Metrology Certificate for ${instrument.make} ${instrument.model} (S/N: ${instrument.serialNumber}) will expire in ${diffDays} days on ${validUntil.toLocaleDateString('en-IN')}. Please submit a Re-Verification Application.`;

            await createNotification({
              userId: user._id,
              type: 'expiry_alert',
              title: `Certificate Expiry in ${diffDays} Days`,
              message,
              relatedInstrumentId: instrument._id,
              relatedCertificateId: cert._id,
              daysUntilExpiry: target,
            });

            await sendExpiryAlertStub(user, instrument, cert, diffDays);
          }
        }
      }
    }
    console.log('[Cron Job] Certificate expiry check completed successfully.');
  } catch (err) {
    console.error('[Cron Job Error] Failed to run expiry check:', err);
  }
};

const initCronJobs = () => {
  // Run every day at 00:05 AM
  cron.schedule('5 0 * * *', () => {
    runExpiryCheck();
  });

  // Also run once at startup with a small delay
  setTimeout(() => {
    runExpiryCheck();
  }, 3000);
};

module.exports = {
  initCronJobs,
  runExpiryCheck,
};
