const express = require('express');
const router = express.Router();
const validateEmailRequest = require('../middlewares/validateEmailRequest');
const apiKeyAuth = require('../middlewares/apiKeyAuth');
const {
  handleSendEmail,
  handleCreateTempAccount,
  handleGetInbox,
  handleHealthCheck
} = require('../controllers/emailController');

// Route Pengiriman Email (dengan Proteksi API Key & Validasi Input Ketat)
router.post('/send', apiKeyAuth, validateEmailRequest, handleSendEmail);

// Route Pembuatan Akun / Session Temp Mail Baru
router.post('/temp-account', apiKeyAuth, handleCreateTempAccount);
router.get('/temp-account', apiKeyAuth, handleCreateTempAccount);

// Route Cek Inbox (Temp Mail)
router.get('/inbox', apiKeyAuth, handleGetInbox);

// Route Health Check
router.get('/health', handleHealthCheck);

module.exports = router;
