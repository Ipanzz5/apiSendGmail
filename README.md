# ✉️ SMTP Temp Mail API Service (JavaScript / Node.js)

Layanan API Endpoint berbasis Node.js & Express.js untuk mengirimkan email secara instan menggunakan **Temp Mail (Disposable Email / Temporary Ephemeral SMTP)** tanpa perlu konfigurasi email pribadi atau API key berbayar.

---

## 🚀 Fitur Utama

- **Strict Input Validation**: Menegakkan pengisian wajib `to` (tujuan), `subject` (subjek), dan `text`/`html` (isi pesan).
- **Multi-Language SDK & Examples**: Dokumentasi integrasi siap pakai untuk Node.js, PHP, Python, Laravel, Go, dan cURL ([`SDK_GUIDE.md`](file:///c:/Users/muham/Desktop/SMTP%20TEMP%20MAIL/SDK_GUIDE.md)).
- **Pengiriman Email via Ephemeral SMTP (Ethereal Email)**: Membuat akun temp SMTP otomatis di runtime, mengirim email, dan memberikan `previewUrl` dashboard web untuk melihat email hasil pengiriman.
- **Pengiriman Email via Brevo API Key**: Guaranteed 100% direct deliverability ke Inbox Gmail & Yahoo.
- **Custom Embedded SMTP Server**: Berjalan di port 2525 (kompatibel dengan Pterodactyl & Wispbyte).

---

## 📁 Struktur Project

```
SMTP TEMP MAIL/
├── package.json
├── .env
├── .env.example
├── README.md
└── src/
    ├── server.js               # Entry point Express Server
    ├── controllers/
    │   └── emailController.js  # Controller penanganan HTTP request
    ├── services/
    │   ├── smtpService.js      # Service Nodemailer & Ethereal SMTP
    │   └── tempMailService.js  # Service Guerrilla Mail API
    └── routes/
        └── emailRoutes.js      # Definisi route API (/api/v1/email/*)
```

---

## 🛠️ Cara Menginstall & Menjalankan

1. **Clone / Buka Folder Project**:
   ```bash
   cd "c:\Users\muham\Desktop\SMTP TEMP MAIL"
   ```

2. **Install Dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Atau untuk mode production:
   ```bash
   npm start
   ```

4. Server akan berjalan di: `http://localhost:3000`

---

## 📑 Dokumentasi API Endpoint

### 1. `POST /api/v1/email/send`
Mengirimkan email menggunakan provider Temp Mail pilihan.

#### **Request Body (JSON):**
```json
{
  "to": "penerima@example.com",
  "subject": "Uji Coba Pengiriman Email Temp Mail",
  "text": "Halo, ini pesan pengujian dari API Temp Mail Service!",
  "html": "<h3>Halo!</h3><p>Ini pesan <b>HTML</b> dari API Temp Mail Service!</p>",
  "provider": "ethereal",
  "senderName": "Sistem Notifikasi Temp Mail"
}
```

- `provider` (opsional): `"auto"` (default: otomatis coba Guerrilla Mail -> Fallback ke Ethereal), `"ethereal"` (unlimited rate limit via dynamic accounts), atau `"guerrillamail"`

#### **Response (200 OK):**
```json
{
  "status": "success",
  "message": "Email berhasil dikirim via Temp Mail Service",
  "data": {
    "success": true,
    "provider": "ethereal",
    "messageId": "<c280540d-1234-5678-abcd-ef1234567890@ethereal.email>",
    "sender": "florence.king12@ethereal.email",
    "recipient": "penerima@example.com",
    "previewUrl": "https://ethereal.email/message/Y1234abcd..."
  }
}
```

---

### 2. `POST /api/v1/email/temp-account`
Membuat akun / session temporary mail baru secara otomatis.

- **Query Param**: `provider` (pilihan: `ethereal` | `guerrillamail`)
- **Contoh URL**: `POST http://localhost:3000/api/v1/email/temp-account?provider=ethereal`

#### **Response (200 OK):**
```json
{
  "status": "success",
  "provider": "ethereal",
  "data": {
    "email": "temp_user_456@ethereal.email",
    "password": "secret_password",
    "smtpHost": "smtp.ethereal.email",
    "smtpPort": 587
  }
}
```

---

### 3. `GET /api/v1/email/inbox`
Mengambil inbox pesan masuk (khusus provider `guerrillamail`).

- **Query Param**: `sidToken`
- **Contoh URL**: `GET http://localhost:3000/api/v1/email/inbox?sidToken=YOUR_SID_TOKEN`

---

### 4. `GET /api/v1/email/health`
Health check endpoint untuk memverifikasi status API server.

---

## 💻 Contoh Pengujian menggunakan cURL

```bash
curl -X POST http://localhost:3000/api/v1/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Tes Email Temp Mail API",
    "text": "Halo dari Temp Mail API!",
    "provider": "ethereal"
  }'
```
