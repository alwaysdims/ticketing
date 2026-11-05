# Audit Backend & Persiapan Vercel API

Status: PREPARATION ONLY
Tanggal: 5 November 2026
Database produksi: tidak disentuh
Deployment publik: tidak dilakukan

## 1. Batas audit

Source Google Apps Script `Ticketing_Backend` tidak tersedia di repository lokal. Tidak ada file `.gs`, source Apps Script, atau kredensial untuk membuka project tersebut. Karena itu, audit implementasi Apps Script tidak dapat dinyatakan selesai dan tidak ada klaim keamanan untuk source tersebut.

Laporan pengujian berurutan yang tersedia membuktikan alur berikut saja:

- `REGISTERED`
- `ALREADY_PROCESSED`
- `ALREADY_REGISTERED`
- `SUCCESS` untuk check-in pertama
- `ALREADY_USED` untuk check-in kedua
- statistik peserta

Hasil tersebut belum membuktikan keamanan terhadap replay, race condition, request HTTP nyata, spoofing admin, atau kegagalan Sheets.

## 2. Temuan prioritas

### P0: Source Apps Script belum tersedia

Audit kode, perbaikan langsung, dan pengujian HTTP ke `Ticketing_Database_TEST` tidak dapat dilakukan tanpa source Apps Script dan URL Web App TEST. Jangan menempelkan secret atau URL privat ke repository.

### P0: Bug WhatsApp kehilangan nol awal

Nilai WhatsApp harus diperlakukan sebagai string pada seluruh jalur:

1. Normalisasi API: `08...` menjadi `628...`.
2. Apps Script: validasi sebagai string.
3. Sheets: tulis dengan `setNumberFormat('@')` pada kolom WhatsApp sebelum `setValues`, atau gunakan apostrof internal dengan hati-hati dan jangan mengembalikan apostrof ke API.
4. Jangan memakai `parseInt`, operasi matematika, atau `getValues()` lalu menulis kembali tanpa mempertahankan format teks.
5. Verifikasi read-back dari TEST database: nilai yang tersimpan harus persis `6281234567890` atau format kanonis yang disepakati, bukan angka yang kehilangan digit.

### P0: Replay protection Apps Script belum terbukti

Timestamp dan HMAC saja hanya membatasi jendela replay. Apps Script tetap membutuhkan nonce/request ID yang disimpan atomik dengan TTL, atau idempotency record yang tidak dapat diklaim dua kali. `CacheService` bukan database durable dan dapat evict lebih awal. Jangan menjadikannya satu-satunya replay store.

### P0: LockService harus mencakup seluruh check-in transaction

Lock harus melindungi baca status tiket, keputusan, mutasi `Participants`, dan append `Checkin_Log`. Logika di luar lock dapat menghasilkan status dan log yang tidak konsisten.

### P1: HMAC canonicalization harus identik

Vercel dan Apps Script harus menggunakan canonical body, timestamp, nonce/request ID, dan encoding yang sama. Signature harus dihitung atas body bisnis yang disortir, bukan atas signature itu sendiri. Apps Script wajib menolak timestamp future, timestamp kedaluwarsa, signature malformed, nonce yang sudah pernah dipakai, dan action yang tidak dikenal.

### P1: Formula injection

Sebelum menulis string peserta ke Sheets, awali nilai yang dimulai dengan `=`, `+`, `-`, atau `@` dengan apostrof atau tolak nilainya. Proteksi wajib ada di Apps Script, bukan hanya di Vercel. Saat membaca kembali, jangan mengeksekusi atau merender HTML dari nilai Sheets.

### P1: Logging

Log runtime hanya boleh memakai action, status, request ID terpotong/hash, dan error class. Jangan mencatat email, WhatsApp, token Google, HMAC secret, cookie, atau seluruh request body.

### P1: Satu sumber identitas admin

`admin_email` untuk check-in harus dikirim dari session claim Vercel yang sudah diverifikasi. Apps Script hanya menerima request dari Vercel yang signature-nya valid. Apps Script tidak boleh mempercayai email dari browser.

### P2: Rate limit stateless

`Map` in-memory di Vercel hanya best-effort per instance. Ia bukan rate limiter global. Sebelum produksi, gunakan Vercel WAF/Firewall atau store terdistribusi seperti Vercel KV/Upstash, sesuai batas biaya dan kebijakan proyek.

## 3. Rancangan alur request

```text
Browser
  -> same-origin HTTPS /api/*
  -> Vercel Function: validate, rate-limit, session/CSRF check
  -> HTTPS POST Apps Script TEST: signed body
  -> Apps Script: verify HMAC, timestamp, nonce, LockService
  -> Google Sheets TEST
```

Browser tidak boleh memanggil URL Apps Script langsung. `APPS_SCRIPT_URL` hanya berada di Vercel Environment Variables.

Body internal minimum:

```json
{
  "action": "checkin",
  "requestId": "uuid-v4",
  "timestamp": "unix-milliseconds",
  "nonce": "random-value",
  "ticketCode": "NWDS-7K9P-M2X4",
  "method": "SCAN",
  "adminEmail": "derived-from-session",
  "ipHash": "short-sha256",
  "signature": "hmac-sha256"
}
```

Kontrak final Phase 3 menggantikan catatan lama: gunakan envelope `timestamp`, `nonce`, `payloadText`, dan `signature` dengan Unix seconds. Field `_timestamp` dan `_signature` tidak digunakan.

## 4. Endpoint preparation

| Method | Endpoint | Guard | Upstream action |
|---|---|---|---|
| POST | `/api/register` | payload, honeypot, IP limit | `register` |
| POST | `/api/admin/auth/google` | Google token, allowlist, IP limit | tidak memanggil Sheets |
| GET | `/api/admin/me` | signed session cookie | tidak memanggil Sheets |
| GET | `/api/admin/stats` | signed session cookie | `getStats` |
| GET | `/api/admin/participants` | signed session cookie, bounded query | `getParticipants` |
| POST | `/api/admin/checkin` | session, CSRF, payload, IP limit | `checkin` |
| POST | `/api/admin/logout` | session, CSRF | tidak memanggil Sheets |

Semua error API memakai:

```json
{
  "success": false,
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Pesan aman untuk pengguna"
  }
}
```

## 5. Environment Variables Vercel

Set hanya pada Vercel, bukan `.env` yang di-commit:

- `APPS_SCRIPT_URL`: URL Web App TEST selama pengujian.
- `BACKEND_SECRET_KEY`: secret HMAC yang sama dengan Script Properties TEST.
- `GOOGLE_CLIENT_ID`: OAuth Client ID.
- `ADMIN_ALLOWLIST`: email admin dipisah koma.
- `SESSION_SECRET`: random secret untuk cookie session.
- `QUOTA_CAPACITY`: `200` atau nilai yang disepakati.
- `EVENT_NAME`: nama event.

Nilai production dan TEST wajib dipisahkan. Jangan menguji endpoint yang menunjuk `Ticketing_Database_2026` sebelum persetujuan eksplisit.

## 6. Perbaikan Apps Script yang wajib diterapkan setelah source tersedia

1. Tambahkan validasi body JSON, `action`, tipe field, panjang field, dan allowlist enum.
2. Verifikasi HMAC-SHA256 dengan canonicalization yang identik dengan Vercel.
3. Tolak timestamp expired/future dan nonce/request ID yang sudah dipakai.
4. Simpan replay/idempotency record secara durable. `CacheService` hanya boleh menjadi optimasi, bukan bukti tunggal.
5. Normalisasi WhatsApp ke string kanonis dan format kolom Sheets sebagai plain text.
6. Gunakan generator ticket dari `Utilities.getUuid()` atau random source yang cukup, lalu potong/encode dengan collision check di bawah `LockService`.
7. Lindungi check-in dengan `LockService.getScriptLock()` dari pembacaan status sampai penulisan participant dan log selesai.
8. Tulis `Checkin_Log` untuk `SUCCESS`, `ALREADY_USED`, `INVALID`, `LOCKED_COLLISION`, dan kegagalan validasi yang memang perlu diaudit, tanpa PII berlebihan.
9. Lindungi seluruh write dari formula injection.
10. Kembalikan status kontrak yang stabil dan jangan membocorkan row number, spreadsheet ID, secret, atau stack trace.
11. Tambahkan read-back assertion pada TEST database setelah setiap write penting.
12. Uji dua request check-in simultan sungguhan, bukan hanya dua pemanggilan berurutan.

## 7. Bukti pengujian yang dilakukan pada repository ini

- `node api/_lib/tests.js`: 28 PASS, 0 FAIL.
- Cakupan: HMAC valid/tampered/expired/future/missing, session token, cookie parsing, validasi WhatsApp, email, nama, formula injection, consent, UUID, honeypot, ticket code, dan method.
- `npm run build`: wajib dijalankan ulang setelah perubahan API; hasil dicatat di laporan akhir.

Yang BELUM dilakukan dan tidak boleh disebut PASS:

- request HTTP nyata ke Apps Script TEST;
- Google ID token nyata;
- unauthorized admin terhadap Google;
- replay store Apps Script;
- concurrency check-in dua request;
- failure/read-back Google Sheets;
- deployment atau Vercel production smoke test.
