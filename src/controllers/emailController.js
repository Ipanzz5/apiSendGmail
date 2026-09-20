const smtpService = require('../services/smtpService');
const tempMailService = require('../services/tempMailService');
const brevoService = require('../services/brevoService');
const providerCascadeService = require('../services/providerCascadeService');

/**
 * Endpoint Handler: Pengiriman Email Multi-Provider dengan Fallback
 */
async function handleSendEmail(req, res) {
  try {
    const { to, subject, text, html, provider, senderName, senderEmail, sidToken, smtpConfig, brevoApiKey } = req.body;

    // Validasi input
    if (!to || !subject) {
      return res.status(400).json({
        status: 'error',
        message: 'Field "to" (email penerima) dan "subject" wajib diisi.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        status: 'error',
        message: 'Format email penerima ("to") tidak valid.'
      });
    }

    const selectedProvider = (provider || process.env.DEFAULT_PROVIDER || 'auto').toLowerCase();
    let result;

    if (selectedProvider === 'auto') {
      // Menjalankan rantai fallback otomatis (Brevo API -> Custom SMTP -> GuerrillaMail -> Ethereal)
      result = await providerCascadeService.sendWithCascade({
        to,
        subject,
        text,
        html,
        senderName,
        senderEmail,
        sidToken,
        smtpConfig,
        brevoApiKey
      });
    } else if (selectedProvider === 'brevo' || selectedProvider === 'brevo_api') {
      result = await brevoService.sendViaBrevoApi({
        to,
        subject,
        text,
        html,
        senderEmail,
        senderName,
        apiKey: brevoApiKey
      });
    } else if (selectedProvider === 'ethereal') {
      result = await smtpService.sendViaEthereal({
        to,
        subject,
        text,
        html,
        senderName,
        newAccount: true
      });
    } else if (selectedProvider === 'guerrillamail' || selectedProvider === 'guerrilla') {
      result = await tempMailService.sendViaGuerrillaMail({
        to,
        subject,
        body: text || html || '',
        sidToken
      });
    } else if (selectedProvider === 'custom_smtp' || selectedProvider === 'smtp') {
      const host = (smtpConfig && smtpConfig.host) || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
      const user = (smtpConfig && smtpConfig.user) || process.env.SMTP_USER;
      const pass = (smtpConfig && smtpConfig.pass) || process.env.SMTP_PASS;
      const port = (smtpConfig && smtpConfig.port) || process.env.SMTP_PORT || 587;

      if (!user || !pass) {
        return res.status(400).json({
          status: 'error',
          message: 'Kredensial Brevo / Custom SMTP (user, pass) tidak ditemukan pada request body maupun .env'
        });
      }

      result = await smtpService.sendViaCustomSmtp({
        host,
        port,
        user,
        pass,
        from: (smtpConfig && smtpConfig.from) || process.env.SMTP_FROM,
        to,
        subject,
        text,
        html,
        senderName
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: `Provider "${selectedProvider}" tidak dikenal. Pilihan yang tersedia: "auto", "brevo", "guerrillamail", "ethereal", "custom_smtp"`
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Email berhasil dikirim via Multi-Provider Service',
      data: result
    });
  } catch (error) {
    console.error('Error sending email:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengirim email',
      error: error.message
    });
  }
}

/**
 * Endpoint Handler: Buat Akun / Session Temp Mail Baru
 */
async function handleCreateTempAccount(req, res) {
  try {
    const { provider = 'ethereal' } = req.query;

    if (provider === 'guerrillamail' || provider === 'guerrilla') {
      const session = await tempMailService.getGuerrillaSession();
      return res.status(200).json({
        status: 'success',
        provider: 'guerrillamail',
        data: session
      });
    }

    const account = await smtpService.getEtherealAccount(true);
    return res.status(200).json({
      status: 'success',
      provider: 'ethereal',
      data: {
        email: account.user,
        password: account.pass,
        smtpHost: account.smtp.host,
        smtpPort: account.smtp.port,
        pop3Host: account.pop3.host,
        imapHost: account.imap.host
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal membuat akun temp mail',
      error: error.message
    });
  }
}

/**
 * Endpoint Handler: Ambil Inbox (Khusus Guerrilla Mail via sidToken)
 */
async function handleGetInbox(req, res) {
  try {
    const { sidToken } = req.query;
    if (!sidToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Query parameter "sidToken" wajib diisi untuk mengambil inbox.'
      });
    }

    const inbox = await tempMailService.getGuerrillaInbox(sidToken);
    return res.status(200).json({
      status: 'success',
      data: inbox
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil inbox',
      error: error.message
    });
  }
}

/**
 * Endpoint Handler: Health Check
 */
function handleHealthCheck(req, res) {
  return res.status(200).json({
    status: 'ok',
    service: 'SMTP Multi-Provider Temp Mail API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    hasBrevoApiKey: Boolean(process.env.BREVO_API_KEY),
    supportedProviders: ['auto', 'brevo', 'guerrillamail', 'ethereal', 'custom_smtp']
  });
}

module.exports = {
  handleSendEmail,
  handleCreateTempAccount,
  handleGetInbox,
  handleHealthCheck
};
