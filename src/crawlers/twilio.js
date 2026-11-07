/* eslint-disable @typescript-eslint/no-require-imports */
const { USE_MOCKS } = require('../mocks');
const { sendWhatsApp } = require('../mocks/twilio.mock');

async function notifyWhatsApp(clientId, pdfPath, score) {
  if (!USE_MOCKS) return null;
  return sendWhatsApp(clientId, pdfPath, score);
}

module.exports = { notifyWhatsApp };
