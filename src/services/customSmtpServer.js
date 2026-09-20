const { SMTPServer } = require('smtp-server');
const providerCascadeService = require('./providerCascadeService');

let smtpServerInstance = null;

/**
 * Inisialisasi Custom SMTP Server yang berjalan di Pterodactyl / Wispbyte
 */
function startCustomSmtpServer() {
  const SMTP_PORT = process.env.CUSTOM_SMTP_PORT || 2525;
  const SMTP_HOST = '0.0.0.0';

  const AUTH_USER = process.env.CUSTOM_SMTP_USER || 'admin';
  const AUTH_PASS = process.env.CUSTOM_SMTP_PASS || 'password123';

  smtpServerInstance = new SMTPServer({
    secure: false,
    disabledCommands: ['STARTTLS'],
    authOptional: true, // Izinkan kirim dengan atau tanpa auth

    onAuth(auth, session, callback) {
      if (!auth.username || !auth.password) {
        return callback(null, { user: 'anonymous' });
      }
      if (auth.username === AUTH_USER && auth.password === AUTH_PASS) {
        return callback(null, { user: auth.username });
      }
      return callback(new Error('Invalid username or password'));
    },

    onData(stream, session, callback) {
      let emailRawData = '';

      stream.on('data', (chunk) => {
        emailRawData += chunk.toString();
      });

      stream.on('end', async () => {
        try {
          const from = session.envelope.mailFrom.address;
          const toList = session.envelope.rcptTo.map(r => r.address);

          console.log(`[Custom SMTP Pterodactyl] Incoming mail from: ${from} to: ${toList.join(', ')}`);

          // Relay otomatis email via Multi-Provider Cascade Service (Brevo API -> Guerrilla -> Ethereal)
          for (const recipient of toList) {
            await providerCascadeService.sendWithCascade({
              to: recipient,
              subject: `[Relayed via Custom Pterodactyl SMTP] Mail from ${from}`,
              text: emailRawData,
              senderName: `Relay (${from})`
            });
          }

          callback(null, '250 Message accepted for delivery');
        } catch (err) {
          console.error('[Custom SMTP Pterodactyl] Relay Error:', err.message);
          callback(new Error(`Relay failed: ${err.message}`));
        }
      });
    }
  });

  smtpServerInstance.listen(SMTP_PORT, SMTP_HOST, () => {
    console.log(`====================================================`);
    console.log(`📧 Custom SMTP Server Running on Pterodactyl / Wispbyte`);
    console.log(`📍 Host: ${SMTP_HOST}:${SMTP_PORT}`);
    console.log(`🔐 Auth User: ${AUTH_USER}`);
    console.log(`====================================================`);
  });

  smtpServerInstance.on('error', (err) => {
    console.error('Custom SMTP Server Error:', err.message);
  });
}

module.exports = {
  startCustomSmtpServer
};
