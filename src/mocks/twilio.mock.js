async function sendWhatsApp(clientId, pdfPath, score) {
  console.log('[MOCK WHATSAPP] Client:', clientId);
  console.log('[MOCK WHATSAPP] Score:', score);
  console.log('[MOCK WHATSAPP] Report:', pdfPath);
  return { status: 'mock_sent', sid: 'MOCK_SID_' + Date.now() };
}

module.exports = { sendWhatsApp };
