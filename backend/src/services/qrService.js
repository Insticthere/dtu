const QRCode = require('qrcode');

const generateQRCodeDataUrl = async (verificationUrl) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      scale: 8,
      color: {
        dark: '#1e3a8a', // Deep Navy
        light: '#ffffff'
      }
    });
    return qrDataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
};

const generateQRCodeBuffer = async (verificationUrl) => {
  try {
    const buffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      scale: 8,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff'
      }
    });
    return buffer;
  } catch (err) {
    console.error('Error generating QR code buffer:', err);
    throw err;
  }
};

module.exports = {
  generateQRCodeDataUrl,
  generateQRCodeBuffer,
};
