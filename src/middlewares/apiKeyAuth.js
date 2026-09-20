/**
 * Middleware Opsional untuk Proteksi API Key.
 * Jika `API_KEY` diisi di file .env, maka request WAJIB menyertakan:
 * Header: `x-api-key: YOUR_API_KEY` ATAU `Authorization: Bearer YOUR_API_KEY`
 */
function apiKeyAuth(req, res, next) {
  const configuredApiKey = process.env.API_KEY;

  // Jika API_KEY tidak dikonfigurasi di .env, lewati autentikasi (bebas diakses)
  if (!configuredApiKey) {
    return next();
  }

  const clientApiKey = req.headers['x-api-key'] || (req.headers['authorization'] ? req.headers['authorization'].replace('Bearer ', '').trim() : null);

  if (!clientApiKey || clientApiKey !== configuredApiKey) {
    return res.status(401).json({
      status: 'error',
      code: 401,
      message: 'Akses ditolak. Header "x-api-key" atau "Authorization: Bearer <API_KEY>" tidak valid atau tidak ditemukan.'
    });
  }

  next();
}

module.exports = apiKeyAuth;
