const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Mengirim email menggunakan Brevo REST API (100% Inbox Deliverability)
 * @param {Object} options
 * @param {string} options.to - Email penerima
 * @param {string} options.subject - Subjek email
 * @param {string} [options.text] - Isi email teks polos
 * @param {string} [options.html] - Isi email format HTML
 * @param {string} [options.senderEmail] - Email pengirim (default: BREVO_SENDER_EMAIL atau penerima)
 * @param {string} [options.senderName] - Nama pengirim
 * @param {string} [options.apiKey] - Brevo API Key
 */
async function sendViaBrevoApi({ to, subject, text, html, senderEmail, senderName = 'Temp Mail System', apiKey }) {
  const activeApiKey = apiKey || process.env.BREVO_API_KEY;

  if (!activeApiKey) {
    throw new Error('BREVO_API_KEY tidak ditemukan pada .env atau parameter request');
  }

  const fromEmail = senderEmail || process.env.BREVO_SENDER_EMAIL || 'no-reply@tempmail.com';

  const payload = {
    sender: {
      name: senderName,
      email: fromEmail
    },
    to: [
      {
        email: to
      }
    ],
    subject,
    htmlContent: html || text || '<p></p>'
  };

  if (text) {
    payload.textContent = text;
  }

  try {
    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        'api-key': activeApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return {
      success: true,
      provider: 'brevo_api',
      messageId: response.data.messageId,
      sender: `${senderName} <${fromEmail}>`,
      recipient: to,
      result: response.data
    };
  } catch (error) {
    const errorMsg = error.response && error.response.data ? JSON.stringify(error.response.data) : error.message;
    throw new Error(`Gagal mengirim via Brevo API: ${errorMsg}`);
  }
}

module.exports = {
  sendViaBrevoApi
};
