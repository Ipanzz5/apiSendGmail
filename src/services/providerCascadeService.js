const smtpService = require('./smtpService');
const tempMailService = require('./tempMailService');
const brevoService = require('./brevoService');

/**
 * Daftar provider yang didukung
 */
const PROVIDERS = {
  BREVO_API: 'brevo_api',
  GUERRILLA: 'guerrillamail',
  ETHEREAL: 'ethereal',
  CUSTOM_SMTP: 'custom_smtp'
};

/**
 * Eksekusi pengiriman email menggunakan rantai fallback multi-provider (Auto Cascade).
 * Urutan fallback:
 * 1. Brevo REST API Key (100% Inbox Gmail Deliverability jika BREVO_API_KEY terisi)
 * 2. Brevo / Custom SMTP (Jika dikonfigurasi di .env)
 * 3. Guerrilla Mail API (Tanpa login, publik temp mail)
 * 4. Ethereal Ephemeral SMTP (Tanpa login, pembuat akun SMTP dinamis otomatis per-request)
 */
async function sendWithCascade(mailData) {
  const { to, subject, text, html, senderName, sidToken, smtpConfig, brevoApiKey, senderEmail } = mailData;
  const attempts = [];

  // Tahap 1: Brevo REST API Key (Priority Utama jika BREVO_API_KEY terisi)
  const activeBrevoKey = brevoApiKey || process.env.BREVO_API_KEY;
  if (activeBrevoKey) {
    try {
      console.log('🔄 Attempting Provider [1/4]: Brevo REST API (100% Inbox Deliverability)...');
      const res = await brevoService.sendViaBrevoApi({
        to,
        subject,
        text,
        html,
        senderName,
        senderEmail,
        apiKey: activeBrevoKey
      });
      res.cascadeHistory = [...attempts, { provider: 'brevo_api', status: 'success' }];
      return res;
    } catch (err) {
      console.warn('⚠️ Brevo REST API Failed:', err.message);
      attempts.push({ provider: 'brevo_api', status: 'failed', error: err.message });
    }
  }

  // Tahap 2: Custom SMTP / Brevo SMTP
  const envHost = process.env.SMTP_HOST;
  const envUser = process.env.SMTP_USER;
  const envPass = process.env.SMTP_PASS;
  const envPort = process.env.SMTP_PORT || 587;
  const hasEnvSmtp = Boolean(envHost && envUser && envPass);

  const customConfig = (smtpConfig && smtpConfig.host) ? smtpConfig : (hasEnvSmtp ? {
    host: envHost,
    port: envPort,
    user: envUser,
    pass: envPass,
    from: process.env.SMTP_FROM
  } : null);

  if (customConfig) {
    try {
      console.log('🔄 Attempting Provider [2/4]: Custom SMTP / Brevo SMTP...');
      const res = await smtpService.sendViaCustomSmtp({
        ...customConfig,
        to,
        subject,
        text,
        html,
        senderName
      });
      res.cascadeHistory = [...attempts, { provider: 'custom_smtp', status: 'success' }];
      return res;
    } catch (err) {
      console.warn('⚠️ Custom SMTP Failed:', err.message);
      attempts.push({ provider: 'custom_smtp', status: 'failed', error: err.message });
    }
  }

  // Tahap 3: Guerrilla Mail API (Tanpa Login)
  try {
    console.log('🔄 Attempting Provider [3/4]: Guerrilla Mail API (No Login)...');
    const res = await tempMailService.sendViaGuerrillaMail({
      to,
      subject,
      body: text || html || '',
      sidToken
    });
    res.cascadeHistory = [...attempts, { provider: 'guerrillamail', status: 'success' }];
    return res;
  } catch (err) {
    console.warn('⚠️ Guerrilla Mail API Failed:', err.message);
    attempts.push({ provider: 'guerrillamail', status: 'failed', error: err.message });
  }

  // Tahap 4: Ethereal Ephemeral SMTP (Tanpa Login, Generasi Akun Otomatis Per Request)
  try {
    console.log('🔄 Attempting Provider [4/4]: Ethereal Ephemeral SMTP (No Login Dynamic Account)...');
    const res = await smtpService.sendViaEthereal({
      to,
      subject,
      text,
      html,
      senderName,
      newAccount: true
    });
    res.cascadeHistory = [...attempts, { provider: 'ethereal', status: 'success' }];
    return res;
  } catch (err) {
    console.warn('⚠️ Ethereal Ephemeral SMTP Failed:', err.message);
    attempts.push({ provider: 'ethereal', status: 'failed', error: err.message });
  }

  throw new Error(`Semua provider email (Brevo API, Custom SMTP, GuerrillaMail, Ethereal) gagal digunakan. Detail kegagalan: ${JSON.stringify(attempts)}`);
}

module.exports = {
  PROVIDERS,
  sendWithCascade
};
