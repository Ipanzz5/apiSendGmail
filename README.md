# ✉️ apiSendGmail - Multi-Provider Email Gateway & Temp Mail API

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-brightgreen?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Framework-Express.js-blue?logo=express)](https://expressjs.com/)
[![Vercel Compatible](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)](https://vercel.com/)
[![Pterodactyl Compatible](https://img.shields.io/badge/Deployment-Pterodactyl-blue?logo=pterodactyl)](https://pterodactyl.io/)
[![License](https://img.shields.io/badge/License-ISC-green)](LICENSE)

**apiSendGmail** adalah layanan API Gateway Pengiriman Email serbaguna berbasis Node.js & Express.js. Aplikasi ini mengintegrasikan **Multi-Provider Auto-Cascade Engine** (Brevo API, Custom SMTP Relay, Guerrilla Mail, Ethereal Ephemeral SMTP) serta **Custom Embedded SMTP Server** yang siap di-deploy ke **Vercel Serverless**, **Pterodactyl Panel / Wispbyte**, maupun VPS Standalone.

---

## 🚀 Fitur-Fitur Unggulan

- 🎯 **100% Inbox Deliverability**: Dukungan Brevo v3 REST API Key yang dijamin terkirim langsung ke Inbox Gmail, Yahoo, dan Outlook tanpa diblokir spam filter.
- ⚡ **Multi-Provider Auto-Cascade Engine**: Otomatisasi rantai pengiriman email *(Brevo API ➔ Custom SMTP ➔ Guerrilla Mail ➔ Ethereal SMTP)*. Jika provider utama gagal atau rate limited, sistem otomatis memindahkan pengiriman ke provider cadangan secara seamless.
- ♾️ **Bebas Limit (Unlimited Rate Limit)**: Dilengkapi generator akun Ethereal SMTP dinamis otomatis per-request yang menjamin pengiriman email 100% tidak pernah gagal.
- 🌐 **Vercel Serverless Ready**: Siap di-deploy ke Vercel hanya dalam 1 klik dengan berkas `vercel.json` bawaan.
- 🎮 **Pterodactyl & Wispbyte Compatible**: Mendukung dynamic port `SERVER_PORT` dan host binding `0.0.0.0`.
- 🔐 **Strict Input Validation & Security**: Menegakkan validasi input ketat (`to`, `subject`, `text`/`html`) serta proteksi opsional `X-API-KEY`.
- 📑 **Pretty Print JSON Response**: Seluruh response JSON berformat rapi dengan 2 spasi indentasi untuk kemudahan debugging.
- 📧 **Custom Embedded SMTP Server**: Server SMTP TCP mandiri di port 2525 untuk integrasi langsung dari aplikasi lain.

---

## 🛠️ Arsitektur & Cara Kerja Sistem

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      PEMANGGILAN REQUEST / CLIENT                      │
 ├───────────────────────────────┬────────────────────────────────────────┤
 │ 1. REST API HTTP              │ POST /api/v1/email/send                │
 │ 2. Custom TCP SMTP Server     │ Host:Port 2525 (Node.js SMTPServer)    │
 └───────────────────────────────┴────────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                 STRICT INPUT VALIDATION & SECURITY MIDDLEWARE          │
 ├────────────────────────────────────────────────────────────────────────┤
 │ • Memeriksa kelengkapan: to (valid email), subject, dan text / html.    │
 │ • Menolak request invalid dengan status 400 Bad Request.               │
 └────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                    MULTI-PROVIDER AUTO-CASCADE ENGINE                  │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 1. Attempt 1 ──► Brevo REST API Key (Priority 1: 100% Direct Inbox)     │
 │                      │ (Jika gagal / key kosong)                       │
 │                      ▼                                                 │
 │ 2. Attempt 2 ──► Custom SMTP Relay (Gmail / Custom VPS SMTP)            │
 │                      │ (Jika gagal / config kosong)                    │
 │                      ▼                                                 │
 │ 3. Attempt 3 ──► Guerrilla Mail API (Publik Temp Mail tanpa Login)     │
 │                      │ (Jika rate limit / captcha)                     │
 │                      ▼                                                 │
 │ 4. Attempt 4 ──► Ethereal Ephemeral SMTP (Dynamic Account Generator)   │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Cara Setup Custom SMTP Email di Vercel (Simple & Normal)

Vercel menggunakan arsitektur **Serverless Functions** (event-driven HTTP). Untuk menjalankan pengiriman Custom SMTP Email di Vercel secara normal, mudah, dan stabil:

### **Metode A: Via Vercel Environment Variables (Sangat Direkomendasikan)**
Masukkan kredensial Custom SMTP Anda di Dashboard Vercel (`Settings` ➔ `Environment Variables`):

```env
DEFAULT_PROVIDER=auto

# Kredensial Custom SMTP (Gmail SMTP / Brevo / SMTP2GO / Custom Server)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email_anda@gmail.com
SMTP_PASS=app_password_gmail_anda
SMTP_FROM="Sistem Notifikasi <email_anda@gmail.com>"
```

### **Metode B: Via Request Body Dynamic SMTP (Per Request)**
Anda juga dapat mengirimkan kredensial Custom SMTP secara langsung pada JSON request body saat menembak endpoint Vercel:

```bash
curl -X POST https://nama-app-anda.vercel.app/api/v1/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "penerima@example.com",
    "subject": "Email via Custom SMTP Vercel",
    "text": "Mengirim menggunakan Custom SMTP dinamis",
    "provider": "custom_smtp",
    "smtpConfig": {
      "host": "smtp-relay.brevo.com",
      "port": 587,
      "user": "email_brevo@domain.com",
      "pass": "key_smtp_brevo",
      "from": "Admin <no-reply@domain.com>"
    }
  }'
```
*Vercel Serverless Function akan membuka koneksi TLS singkat ke SMTP Server tersebut, mengirimkan pesan, dan mengembalikan response JSON instan.*

---

## 📁 Struktur Directory Project

```
apiSendGmail/
├── .env                     # File konfigurasi lokal (Diabaikan dari git)
├── .env.example             # Template variabel environment
├── .gitignore               # Daftar pengabaian berkas rahasia git
├── vercel.json              # Konfigurasi Vercel Serverless deployment
├── package.json             # Dependensi project & script npm
├── README.md                # Dokumentasi utama project
├── SDK_GUIDE.md             # Panduan integrasi multi-bahasa (Node, PHP, Py, dll)
└── src/
    ├── server.js            # Entry point Express API & Custom SMTP Server
    ├── controllers/
    │   └── emailController.js # Penanganan request API & JSON formatting
    ├── middlewares/
    │   ├── validateEmailRequest.js # Middleware penegak validasi to, subject, text/html
    │   └── apiKeyAuth.js           # Middleware opsional proteksi X-API-KEY
    ├── routes/
    │   └── emailRoutes.js   # Pendaftaran route REST API (/api/v1/email/*)
    └── services/
        ├── brevoService.js           # Integrasi Brevo REST API v3
        ├── customSmtpServer.js       # Embedded TCP SMTP Server (Port 2525)
        ├── providerCascadeService.js # Modul rantai fallback multi-provider
        ├── smtpService.js            # Integrasi Nodemailer & Ethereal SMTP
        └── tempMailService.js        # Integrasi Guerrilla Mail API
```

---

## ⚙️ Variabel Environment (`.env`)

```env
# Port lokal (Otomatis membaca PORT di Vercel & SERVER_PORT di Pterodactyl)
PORT=3000
DEFAULT_PROVIDER=auto

# (OPSIONAL) Proteksi API Key jika ingin mengamankan endpoint
# API_KEY=kunci_rahasia_api_anda

# 1. Brevo REST API Key (Sangat Direkomendasikan untuk 100% Inbox Gmail)
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BREVO_SENDER_EMAIL=panzmodz@gmail.com
BREVO_SENDER_NAME="Temp Mail System"

# 2. Custom SMTP Relay Config (Opsional)
# SMTP_HOST=smtp-relay.brevo.com
# SMTP_PORT=587
# SMTP_USER=email_registrasi@domain.com
# SMTP_PASS=master_key_smtp
# SMTP_FROM="System <no-reply@domain.com>"

# 3. Custom Embedded TCP SMTP Server (Khusus VPS / Pterodactyl / Wispbyte)
ENABLE_CUSTOM_SMTP=true
CUSTOM_SMTP_PORT=2525
CUSTOM_SMTP_USER=admin
CUSTOM_SMTP_PASS=password123
```

---

## 📑 Spesifikasi REST API Endpoint

### 1. Send Email (`POST /api/v1/email/send`)

#### Request Body (JSON):
```json
{
  "to": "penerima@example.com",
  "subject": "Verifikasi Akun Pengguna",
  "text": "Kode OTP Anda adalah: 123456",
  "html": "<h3>Verifikasi Akun</h3><p>Kode OTP Anda: <b>123456</b></p>",
  "provider": "auto",
  "senderName": "Sistem Notifikasi"
}
```

#### Response Success (`200 OK`):
```json
{
  "status": "success",
  "message": "Email berhasil dikirim via Multi-Provider Service",
  "data": {
    "success": true,
    "provider": "brevo_api",
    "messageId": "<202609200551.39158309361@smtp-relay.mailin.fr>",
    "sender": "Sistem Notifikasi <panzmodz@gmail.com>",
    "recipient": "penerima@example.com",
    "result": {
      "messageId": "<202609200551.39158309361@smtp-relay.mailin.fr>"
    },
    "cascadeHistory": [
      {
        "provider": "brevo_api",
        "status": "success"
      }
    ]
  }
}
```

#### Response Error Validation (`400 Bad Request`):
```json
{
  "status": "error",
  "code": 400,
  "message": "Validasi input gagal. Mohon periksa kelengkapan data request Anda.",
  "errors": [
    {
      "field": "to",
      "message": "Field 'to' (email tujuan) wajib diisi."
    },
    {
      "field": "subject",
      "message": "Field 'subject' (subjek email) wajib diisi."
    },
    {
      "field": "body",
      "message": "Isi pesan email wajib diisi. Masukkan field 'text' (teks polos) atau 'html' (format HTML)."
    }
  ]
}
```

---

### 2. Create Temp Account (`POST /api/v1/email/temp-account`)
Membuat kredensial akun / session temporary mail baru secara otomatis.
- Query Parameter: `provider=ethereal` atau `provider=guerrillamail`

### 3. Get Inbox (`GET /api/v1/email/inbox?sidToken=...`)
Mengambil inbox pesan masuk (khusus provider `guerrillamail`).

### 4. Health Check (`GET /api/v1/email/health`)
Memeriksa status aktif API server.

---

## 📚 Multi-Language Integration SDK & Examples

Lihat dokumentasi lengkap panduan integrasi multi-bahasa di file **[`SDK_GUIDE.md`](file:///c:/Users/muham/Desktop/SMTP%20TEMP%20MAIL/SDK_GUIDE.md)** untuk contoh kode siap pakai:
- **Node.js** (Axios & Fetch)
- **PHP** (Native cURL & Guzzle)
- **Python** (Requests)
- **Laravel** (Http Facade)
- **Go** (`net/http`)
- **cURL / Postman**

---

## 🚀 Panduan Deployment

### A. Deploy ke Vercel (Serverless)
1. Import repositori GitHub ini `Ipanzz5/apiSendGmail` di Dashboard Vercel.
2. Tambahkan Environment Variable `BREVO_API_KEY` & `BREVO_SENDER_EMAIL`.
3. Klik **Deploy**.

### B. Deploy ke Pterodactyl / Wispbyte
1. Upload file project (tanpa `node_modules`).
2. Di tab Startup, pilih `Node.js 18+`, isi command: `node src/server.js`.
3. Atur port alokasi sekunder untuk `CUSTOM_SMTP_PORT=2525`.

---

## 📜 Lisensi

Project ini dirilis di bawah lisensi [ISC License](LICENSE).
