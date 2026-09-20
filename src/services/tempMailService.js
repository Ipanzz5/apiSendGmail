const axios = require('axios');

const GUERRILLA_BASE_URL = 'https://api.guerrillamail.com/ajax.php';

/**
 * Membuat session temp mail baru dari Guerrilla Mail API
 */
async function getGuerrillaSession() {
  try {
    const response = await axios.get(`${GUERRILLA_BASE_URL}?f=get_email_address`);
    return {
      emailAddress: response.data.email_addr,
      sidToken: response.data.sid_token,
      alias: response.data.alias,
      timestamp: response.data.email_timestamp
    };
  } catch (error) {
    throw new Error(`Gagal membuat session Guerrilla Mail: ${error.message}`);
  }
}

/**
 * Mengirim email menggunakan Guerrilla Mail API
 * @param {Object} options
 * @param {string} options.to - Email penerima
 * @param {string} options.subject - Subjek email
 * @param {string} options.body - Isi email
 * @param {string} [options.sidToken] - Session ID token Guerrilla Mail (opsional)
 */
async function sendViaGuerrillaMail({ to, subject, body, sidToken }) {
  try {
    let sessionSid = sidToken;
    let senderAddress = '';

    if (!sessionSid) {
      const session = await getGuerrillaSession();
      sessionSid = session.sidToken;
      senderAddress = session.emailAddress;
    }

    const response = await axios.post(
      `${GUERRILLA_BASE_URL}?f=send_email`,
      new URLSearchParams({
        sid_token: sessionSid,
        to,
        subject,
        body
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data && response.data.error) {
      throw new Error(`Guerrilla Mail API error: ${response.data.error}`);
    }

    return {
      success: true,
      provider: 'guerrillamail',
      sender: senderAddress || 'temporary@guerrillamail.com',
      recipient: to,
      sidToken: sessionSid,
      result: response.data
    };
  } catch (error) {
    throw new Error(`Gagal mengirim email via Guerrilla Mail: ${error.message}`);
  }
}

/**
 * Mengambil daftar pesan inbox temp mail dari Guerrilla Mail
 */
async function getGuerrillaInbox(sidToken) {
  try {
    const response = await axios.get(`${GUERRILLA_BASE_URL}?f=get_email_list&sid_token=${sidToken}&offset=0`);
    return {
      emailAddress: response.data.email_addr,
      count: response.data.count,
      list: response.data.list || []
    };
  } catch (error) {
    throw new Error(`Gagal mengambil inbox Guerrilla Mail: ${error.message}`);
  }
}

module.exports = {
  getGuerrillaSession,
  sendViaGuerrillaMail,
  getGuerrillaInbox
};
