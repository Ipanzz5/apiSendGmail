# 📚 Panduan Integrasi API Pengiriman Email (Multi-Language SDK Guide)

Dokumentasi ini memberikan contoh kode siap pakai (*Copy-Paste Snippets*) untuk mengintegrasikan **SMTP Temp Mail API Gateway** ke dalam berbagai jenis project (Node.js, PHP, Python, Laravel, Go, dan cURL).

---

## 📌 Spesifikasi Input API (`POST /api/v1/email/send`)

Setiap request pengiriman email **WAJIB** menyertakan JSON body dengan format:

```json
{
  "to": "email_tujuan@example.com",
  "subject": "Subjek Email Notifikasi",
  "text": "Pesan teks polos (opsional jika html diisi)",
  "html": "<h3>Pesan HTML</h3><p>Isi email format HTML...</p>",
  "provider": "auto",
  "senderName": "Nama Aplikasi Anda"
}
```

> [!NOTE]
> - `to` (String): Email penerima yang valid. **[WAJIB]**
> - `subject` (String): Subjek/judul email. **[WAJIB]**
> - `text` ATAU `html` (String): Isi pesan email. **[MINIMAL SALAH SATU WAJIB]**
> - `provider` (String, Opsional): `"auto"` (Default), `"brevo"`, `"guerrillamail"`, `"ethereal"`.

---

## 🚀 Contoh Kode Integrasi Siap Pakai

### 1. Node.js (Axios)
```javascript
const axios = require('axios');

async function sendEmailNotification(toEmail, subjectText, messageHtml) {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/email/send', {
      to: toEmail,
      subject: subjectText,
      html: messageHtml,
      senderName: 'Sistem Toko Online'
    }, {
      headers: {
        'Content-Type': 'application/json'
        // 'x-api-key': 'YOUR_API_KEY' // Un-comment jika API_KEY diaktifkan
      }
    });

    console.log('Email Terkirim:', response.data);
    return response.data;
  } catch (error) {
    console.error('Gagal Mengirim Email:', error.response ? error.response.data : error.message);
  }
}

// Penggunaan:
sendEmailNotification('penerima@gmail.com', 'Verifikasi Akun Baru', '<h3>Kode OTP: 987654</h3>');
```

---

### 2. Node.js (Fetch API)
```javascript
async function sendEmail(to, subject, textContent) {
  const response = await fetch('http://localhost:3000/api/v1/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: to,
      subject: subject,
      text: textContent
    })
  });

  const data = await response.json();
  console.log(data);
}
```

---

### 3. PHP Native (cURL)
```php
<?php

function sendEmail($to, $subject, $htmlContent) {
    $url = 'http://localhost:3000/api/v1/email/send';
    
    $payload = array(
        'to' => $to,
        'subject' => $subject,
        'html' => $htmlContent,
        'senderName' => 'Aplikasi PHP Saya'
    );
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json'
    ));
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return array(
        'code' => $httpCode,
        'data' => json_decode($response, true)
    );
}

// Penggunaan:
$result = sendEmail('penerima@gmail.com', 'Tagihan Pembayaran', '<h1>Invoice #1024</h1><p>Total: Rp 150.000</p>');
print_r($result);
```

---

### 4. Laravel (Http Facade)
```php
namespace App\Services;

use Illuminate\Support\Facades\Http;

class EmailService
{
    public static function send($to, $subject, $html)
    {
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post('http://localhost:3000/api/v1/email/send', [
            'to' => $to,
            'subject' => $subject,
            'html' => $html,
            'senderName' => config('app.name')
        ]);

        return $response->json();
    }
}
```

---

### 5. Python (Requests)
```python
import requests

def send_email(to_email, subject_text, text_content):
    url = "http://localhost:3000/api/v1/email/send"
    payload = {
        "to": to_email,
        "subject": subject_text,
        "text": text_content,
        "senderName": "Sistem Bot Python"
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Penggunaan:
res = send_email("penerima@gmail.com", "Notifikasi Server Down", "Peringatan: CPU server mencapai 95%")
print(res)
```

---

### 6. Go (net/http)
```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type EmailPayload struct {
	To         string `json:"to"`
	Subject    string `json:"subject"`
	HTML       string `json:"html"`
	SenderName string `json:"senderName"`
}

func sendEmail(to, subject, html string) {
	url := "http://localhost:3000/api/v1/email/send"
	payload := EmailPayload{
		To:         to,
		Subject:    subject,
		HTML:       html,
		SenderName: "Go Service",
	}

	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	fmt.Println("Status Code:", resp.StatusCode)
}
```

---

### 7. cURL / Terminal
```bash
curl -X POST http://localhost:3000/api/v1/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "penerima@gmail.com",
    "subject": "Notifikasi via cURL",
    "text": "Pesan dikirim dari terminal cURL",
    "provider": "auto"
  }'
```

---

## ❌ Format Error Validation (`400 Bad Request`)

Jika input `to`, `subject`, atau `text/html` ada yang kosong, API akan membalas dengan status HTTP **`400 Bad Request`**:

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
