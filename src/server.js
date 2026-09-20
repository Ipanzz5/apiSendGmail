require('dotenv').config();
const express = require('express');
const cors = require('cors');
const emailRoutes = require('./routes/emailRoutes');
const { startCustomSmtpServer } = require('./services/customSmtpServer');

const app = express();

// Set JSON Response Formatting (Pretty Print 2 Spaces)
app.set('json spaces', 2);

// Pterodactyl / Wisp / Vercel Port
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome / Index Route
app.get('/', (req, res) => {
  res.json({
    name: 'SMTP Temp Mail API Service',
    version: '1.0.0',
    description: 'REST API Gateway pengiriman email (Vercel & Pterodactyl Compatible)',
    platform: process.env.VERCEL ? 'Vercel Serverless' : 'Node.js Standalone',
    endpoints: {
      sendEmail: 'POST /api/v1/email/send',
      createTempAccount: 'POST /api/v1/email/temp-account',
      getInbox: 'GET /api/v1/email/inbox?sidToken=...',
      healthCheck: 'GET /api/v1/email/health'
    },
    customSmtpServer: {
      enabled: !process.env.VERCEL && process.env.ENABLE_CUSTOM_SMTP !== 'false',
      port: process.env.CUSTOM_SMTP_PORT || 2525,
      note: process.env.VERCEL ? 'TCP Custom SMTP Server disembunyikan di Vercel Serverless. Gunakan REST API Endpoint untuk Vercel.' : 'Aktif'
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

// Jalankan Standalone Server (Hanya jika tidak berjalan sebagai Vercel Serverless Function)
if (!process.env.VERCEL) {
  app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`🚀 API Server Running on http://${HOST}:${PORT}`);
    console.log(`✉️  Endpoint Send: http://${HOST}:${PORT}/api/v1/email/send`);
    console.log(`====================================================`);

    if (process.env.ENABLE_CUSTOM_SMTP !== 'false') {
      startCustomSmtpServer();
    }
  });
}

// Export Express app untuk Vercel Serverless Deployment
module.exports = app;
