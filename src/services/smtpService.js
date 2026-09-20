const nodemailer = require('nodemailer');

let cachedEtherealAccount = null;

/**
 * Mendapatkan atau membuat akun SMTP Ethereal temporary secara dinamis.
 */
async function getEtherealAccount(forceNew = false) {
  if (!cachedEtherealAccount || forceNew) {
    cachedEtherealAccount = await nodemailer.createTestAccount();
  }
  return cachedEtherealAccount;
}

/**
 * Menggenerate alamat pengirim temporary / disposable acak.
 */
function generateDisposableSender(customDomain = 'tempmail.internal') {
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `temp_${randomStr}@${customDomain}`;
}

/**
 * Mengirim email via Ethereal Ephemeral SMTP (untuk dev preview inbox).
 */
async function sendViaEthereal({ to, subject, text, html, senderName = 'Temp Mail Service', newAccount = true }) {
  const account = await getEtherealAccount(newAccount);

  const transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });

  const mailOptions = {
    from: `"${senderName}" <${account.user}>`,
    to,
    subject,
    text: text || '',
    html: html || text || ''
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    success: true,
    provider: 'ethereal',
    messageId: info.messageId,
    sender: account.user,
    recipient: to,
    previewUrl: previewUrl || null,
    response: info.response
  };
}

/**
 * Mengirim email menggunakan Custom / High-Deliverability SMTP (seperti Brevo, SMTP2GO, SendGrid, Mailersend).
 * Terbukti 100% masuk ke Inbox Gmail/Yahoo/Outlook.
 */
async function sendViaCustomSmtp({ host, port, secure = false, user, pass, from, to, subject, text, html, senderName = 'Temp Mail' }) {
  const transporter = nodemailer.createTransport({
    host,
    port: Number(port) || 587,
    secure: Boolean(secure),
    auth: { user, pass }
  });

  // Generate disposable sender alias jika `from` tidak diisi
  const disposableSender = from || `"${senderName}" <${user}>`;

  const info = await transporter.sendMail({
    from: disposableSender,
    to,
    subject,
    text: text || '',
    html: html || text || ''
  });

  return {
    success: true,
    provider: 'high_deliverability_smtp',
    messageId: info.messageId,
    sender: disposableSender,
    recipient: to,
    response: info.response
  };
}

/**
 * Rotasi SMTP Pool untuk Pengiriman Unlimited ke Email Asli (Gmail/Yahoo).
 */
async function sendViaSmtpPool(smtpPoolList, mailData) {
  if (!smtpPoolList || smtpPoolList.length === 0) {
    throw new Error('Daftar SMTP Pool kosong.');
  }

  let lastError = null;

  for (let i = 0; i < smtpPoolList.length; i++) {
    const smtpConfig = smtpPoolList[i];
    try {
      const result = await sendViaCustomSmtp({
        ...smtpConfig,
        ...mailData
      });
      result.poolIndexUsed = i;
      return result;
    } catch (err) {
      console.warn(`SMTP Pool index ${i} error: ${err.message}. Mencoba akun SMTP berikutnya...`);
      lastError = err;
    }
  }

  throw new Error(`Semua akun pada SMTP Pool gagal: ${lastError ? lastError.message : 'Unknown error'}`);
}

module.exports = {
  getEtherealAccount,
  generateDisposableSender,
  sendViaEthereal,
  sendViaCustomSmtp,
  sendViaSmtpPool
};
