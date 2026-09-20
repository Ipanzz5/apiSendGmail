/**
 * Middleware untuk menegakkan aturan Strict Input Validation pada pengiriman email:
 * 1. "to" (email tujuan) -> WAJIB & Format Email Harus Valid
 * 2. "subject" (subjek email) -> WAJIB
 * 3. "text" ATAU "html" (isi email) -> WAJIB minimal salah satu
 */
function validateEmailRequest(req, res, next) {
  const { to, subject, text, html } = req.body;
  const errors = [];

  // 1. Validasi Email Tujuan ("to")
  if (!to || typeof to !== 'string' || to.trim() === '') {
    errors.push({
      field: 'to',
      message: 'Field "to" (email tujuan) wajib diisi.'
    });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      errors.push({
        field: 'to',
        message: 'Format email "to" tidak valid.'
      });
    }
  }

  // 2. Validasi Subjek Email ("subject")
  if (!subject || typeof subject !== 'string' || subject.trim() === '') {
    errors.push({
      field: 'subject',
      message: 'Field "subject" (subjek email) wajib diisi.'
    });
  }

  // 3. Validasi Isi Pesan Email ("text" atau "html")
  const hasText = text && typeof text === 'string' && text.trim() !== '';
  const hasHtml = html && typeof html === 'string' && html.trim() !== '';

  if (!hasText && !hasHtml) {
    errors.push({
      field: 'body',
      message: 'Isi pesan email wajib diisi. Masukkan field "text" (teks polos) atau "html" (format HTML).'
    });
  }

  // Jika ada kesalahan validasi, kembalikan response 400 Bad Request
  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      code: 400,
      message: 'Validasi input gagal. Mohon periksa kelengkapan data request Anda.',
      errors
    });
  }

  next();
}

module.exports = validateEmailRequest;
