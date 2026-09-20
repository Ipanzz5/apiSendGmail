require('dotenv').config();
const express = require('express');
const cors = require('cors');
const emailRoutes = require('./routes/emailRoutes');
const { startCustomSmtpServer } = require('./services/customSmtpServer');

const app = express();

// Set JSON Response Formatting (Formatted / Pretty Print JSON dengan 2 spasi Indentasi)
app.set('json spaces', 2);

// Pterodactyl / Wisp menggunakan SERVER_PORT atau PORT
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome / Index Route
app.get('/', (req, res) => {
  res.json({
    name: 'SMTP Temp Mail API & Custom SMTP Server Service',
    version: '1.0.0',
    description: 'API & Custom Embedded SMTP Server running on Pterodactyl / Wispbyte',
    endpoints: {
      sendEmail: 'POST /api/v1/email/send',
      createTempAccount: 'POST /api/v1/email/temp-account',
      getInbox: 'GET /api/v1/email/inbox?sidToken=...',
      healthCheck: 'GET /api/v1/email/health'
    },
    customSmtpServer: {
      enabled: process.env.ENABLE_CUSTOM_SMTP === 'true',
      port: process.env.CUSTOM_SMTP_PORT || 2525
    }
  });
});

// API Routes
app.use('/api/v1/email', emailRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: err.message
  });
});

// Start Express API Server
app.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🚀 API Server Running on Pterodactyl / Wispbyte`);
  console.log(`📍 Listening on: http://${HOST}:${PORT}`);
  console.log(`✉️  Endpoint Send: http://${HOST}:${PORT}/api/v1/email/send`);
  console.log(`====================================================`);

  // Jalankan Custom Embedded SMTP Server jika ENABLE_CUSTOM_SMTP=true (default: true)
  if (process.env.ENABLE_CUSTOM_SMTP !== 'false') {
    startCustomSmtpServer();
  }
});
