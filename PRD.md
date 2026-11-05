# Product Requirements Document (PRD)

**Proyek:** Event Registration & Barcode Check-in System  
**Versi:** 2.0  
**Tanggal:** 4 November 2026  
**Status:** Spesifikasi Arsitektur & Rekayasa Produk Final  
**Target Event:** Single-event (< 200 peserta)  
**Hosting Publik:** Vercel (`https://ticketing-nine-nu.vercel.app/`)  
**Target Infrastruktur:** Serverless Cloud (Rp0 / Free Tier)

---

## 1. Product Overview

### 1.1 Latar Belakang & Permasalahan
Pada fase pratinjau sebelumnya, aplikasi diuji secara lokal dan bergantung pada laptop pengembang yang harus menyala serta koneksi terowongan lokal agar sistem dapat diakses oleh panitia atau peserta. Kondisi ini memiliki kelemahan mendasar:
- Tidak ada ketersediaan layanan mandiri (zero independent availability).
- Rentan kegagalan koneksi lokal, pemadaman listrik, atau laptop memasuki mode suspensi.
- Risiko keamanan tinggi jika laptop pengembang terhubung langsung ke jaringan publik tanpa lapisan proksi API yang terisolasi.

### 1.2 Tujuan Pengembangan
Membangun sistem registrasi dan check-in mandiri berbasis cloud murni yang dapat diakses 24/7 tanpa ketergantungan perangkat keras lokal pengembang, menggunakan tumpukan teknologi modern berbiaya Rp0 (Free-tier Vercel + Google Apps Script + Google Sheets), serta menyediakan alur check-in barcode real-time yang aman dan mencegah penggunaan tiket ganda.

### 1.3 Target Pengguna
- **Calon Peserta:** Pengunjung umum/komunitas yang mendaftar secara mandiri melalui website.
- **Admin / Petugas Lapangan:** Panitia terverifikasi yang memantau kuota, melihat data pendaftar, dan memindai barcode tiket di pintu masuk lokasi acara.

### 1.4 Ruang Lingkup Sistem
- Landing page publik informatif dengan desain Soft Claymorphism editorial.
- Formulir pendaftaran mandiri langsung tanpa autentikasi bagi peserta.
- Pembuatan kode tiket kriptografis unik dan barcode Code 128 instan setelah pendaftaran berhasil.
- Penyimpanan data peserta dan log aktivitas ke Google Sheets melalui backend Google Apps Script.
- Gerbang API perantara berbasis Vercel Serverless Functions (`/api/*`) untuk validasi, perlindungan rahasia server-to-server, dan otorisasi sesi.
- Dashboard admin terlindungi dengan Google OAuth 2.0 (hanya email terdaftar dalam allowlist).
- Fitur check-in ganda: pemindaian kamera barcode Code 128 dan input kode manual dengan penguncian konkurensi (atomic lock).

### 1.5 Batasan Sistem & Karakteristik Skala
- **Skala Peserta:** Dirancang khusus untuk kegiatan tunggal (single-event) dengan volume kurang dari 200 peserta.
- **Tanpa Pembayaran:** Tiket gratis atau pembayaran diselesaikan di luar platform; sistem tidak memproses transaksi finansial atau payment gateway.
- **Tanpa Akun Peserta:** Peserta tidak memiliki kredensial login atau profil pengguna permanen.
- **Batas Layanan Gratis (Free-Tier Constraints):**
  * Vercel Serverless Functions: Batas eksekusi 10 detik (Hobby Plan) dan kuota harian.
  * Google Apps Script: Batas runtime 6 menit per eksekusi dan kuota panggilan URL Fetch / Sheets API harian.
  * Google Sheets: Bukan database transaksional tingkat tinggi (RDBMS); penulisan konkuren dikelola via `LockService` dengan antrean singkat yang memadai untuk < 200 transaksi.
  * Uptime: Bergantung pada ketersediaan Vercel dan Google Cloud Platform tanpa SLA komersial 100%.

---

## 2. User Roles & Hak Akses

| Kebutuhan & Kapabilitas | Peserta (Participant) | Admin / Panitia |
|---|---|---|
| Autentikasi Pengguna | Tidak perlu (Publik) | Wajib (Google OAuth 2.0 Allowlist) |
| Melihat Informasi Acara & Jadwal | Ya | Ya |
| Mengisi Formulir Registrasi | Ya | Ya (sebagai publik) |
| Menerima & Mengunduh Tiket Digital | Ya | Ya |
| Mengakses Dashboard Admin | Ditolak (401/403) | Ya |
| Melihat Statistik & Ringkasan Kehadiran | Tidak | Ya |
| Mencari & Memfilter Data Peserta | Tidak | Ya |
| Memindai Barcode Check-in (Kamera) | Tidak | Ya |
| Input Manual Kode Tiket Check-in | Tidak | Ya |
| Melakukan Logout Sesi Admin | Tidak berlaku | Ya |

*Catatan Keamanan:* Tidak ada registrasi admin publik atau alur pendaftaran mandiri untuk akun pengelola. Akun admin semata-mata dikendalikan melalui konfigurasi variabel lingkungan server (`ADMIN_ALLOWLIST`).

---

## 3. Landing Page Requirements

Struktur landing page mempertahankan urutan hierarkis berikut secara ketat tanpa penambahan seksi promosi sekunder di bagian bawah:

1. **Navbar:** Logo identitas acara, tautan navigasi anchor (`#about`, `#schedule`, `#tickets`, `#faq`), dan penanda status acara.
2. **Hero + CTA:** Headline editorial, sub-judul ringkas, tanggal & lokasi kegiatan, satu tombol aksi utama (CTA Primer: `Daftar Sekarang` yang menggulir halus ke formulir `#tickets`), satu aksi sekunder (`Lihat Jadwal` ke `#schedule`), serta kartu visual tiket bergaya clay.
3. **About:** Deskripsi komprehensif latar belakang kegiatan, tujuan, target audiens, dan nilai manfaat partisipasi.
4. **Schedule:** Susunan jadwal kronologis vertikal dari sesi pagi hingga penutupan, mencakup waktu, judul agenda, ruang, dan pemateri.
5. **Quota & Tickets (Dua Kolom Desktop, Satu Kolom Mobile):**
   - **Kolom Kiri (Informasi Kuota):** Statistik kuota riil/tersisa, progres bar kapasitas, rincian fasilitas tiket, dan ketentuan pendaftaran.
   - **Kolom Kanan (Formulir Pendaftaran):** Formulir input pendaftaran langsung beserta kotak centang persetujuan privasi.
6. **FAQ:** Komponen akordion aksesibel (WCAG AA) yang memuat tanya-jawab umum teknis kegiatan.
7. **Footer:** Rangkuman identitas acara, tautan cepat, kanal narahubung resmi panitia, dan hak cipta.

---

## 4. Registration Requirements & Validasi

### 4.1 Formulir Minimal Peserta
- **Nama Lengkap (`nama`):** Teks alfabetis, minimal 3 karakter, maksimal 70 karakter.
- **Alamat Email (`email`):** Format valid RFC 5322, dinormalisasi menjadi huruf kecil (*lowercase*), maksimal 100 karakter.
- **Nomor WhatsApp (`whatsapp`):** Format numerik Indonesia standar (`08...` atau `628...`), dinormalisasi ke format `628...`, panjang 10–15 digit.
- **Persetujuan Privasi (`privacyConsent`):** Wajib dicentang (boolean `true`).

### 4.2 Alur Validasi & Pencegahan Duplikasi
1. **Validasi Client-side:** Pemeriksaan langsung saat pengetikan dan submit form untuk mencegah payload kosong, format salah, atau karakter ilegal.
2. **Validasi API Gateway (Vercel Functions):** Sanitasi teks, pembersihan spasi, pemeriksaan panjang karakter, dan validasi format regex.
3. **Pemeriksaan Kuota di Backend:** Google Apps Script membaca baris terisi pada lembar `Participants`. Jika jumlah pendaftar aktif telah mencapai batas kuota (misal: 200), registrasi ditolak dengan kode `QUOTA_EXCEEDED`.
4. **Pencegahan Pendaftaran Duplikat:**
   - Email dan nomor WhatsApp yang telah terdaftar tidak dapat mendaftar ulang.
   - Pemeriksaan dilakukan di Google Apps Script sebelum baris baru ditambahkan.
   - Jika ditemukan kecocokan email/nomor aktif, API mengembalikan respons penolakan ramah tanpa memaparkan data pendaftar yang sudah ada.
5. **Strategi Idempotency & Penanganan Kegagalan Jaringan:**
   - Klien mengirim header atau field `client_request_id` (UUIDv4) saat melakukan submit.
   - Jika permintaan pertama terputus di tengah jalan dan pengguna menekan tombol coba lagi, backend memeriksa apakah `client_request_id` sudah sukses diproses dalam jendela waktu 5 menit terakhir. Jika sudah, sistem mengembalikan tiket yang sama tanpa menambah baris baru.
   - Jika koneksi gagal total atau server mengembalikan galat 500, status sukses TIDAK BOLEH dimunculkan pada antarmuka; formulir tetap menampilkan pesan kesalahan yang dapat ditindaklanjuti.

---

## 5. Ticket Generation & Barcode Architecture

### 5.1 Algoritma Kode Tiket Unik
- Kode tiket dibuat oleh backend dengan generator acak aman secara kriptografis (`crypto.getRandomValues` pada node runtime atau utilitas acak berkekuatan tinggi di backend).
- Format kode: `NWDS-[A-Z0-9]{4}-[A-Z0-9]{4}` (Contoh: `NWDS-7K9P-M2X4`).
- Karakter yang membingungkan visual (seperti `0`, `O`, `1`, `I`) dikecualikan dari set generator acak untuk mencegah kesalahan pembacaan manual.
- Entropi: Memiliki ruang kombinasi lebih dari 1 miliar kemungkinan, mencegah serangan tebakan atau enumerasi kode.

### 5.2 Standar Barcode
- Menggunakan standar barcode 1D **Code 128**.
- Nilai yang dikodekan ke dalam barcode persis sama dengan string kode tiket (`ticket_code`).
- Barcode dirender di browser menggunakan pustaka ringan berbasis SVG/Canvas (seperti `JsBarcode`) dengan kontras hitam-putih murni (100% K pada latar putih bersih) tanpa gradien atau bayangan clay agar terbaca sempurna oleh semua lensa kamera dan scanner optik.

### 5.3 Penyajian Tiket Digital
- Menampilkan nama acara, nama lengkap peserta, kode tiket teks, grafik barcode Code 128, tanggal & waktu registrasi, serta petunjuk check-in.
- Tombol aksi: `Simpan Tiket` (mengunduh area kartu tiket sebagai file gambar PNG beresolusi tinggi menggunakan utility rendering canvas lokal).
- **Prosedur Tiket Hilang:** Karena MVP tidak menyertakan email transaksional otomatis, peserta diinstruksikan menyimpan tiket segera setelah pendaftaran. Jika hilang, peserta dapat menghubungi panitia di lokasi dengan menunjukkan bukti identitas (KTP/WhatsApp terdaftar) untuk divalidasi oleh admin melalui pencarian nama di dashboard.

---

## 6. Admin Authentication & Sesi

### 6.1 Alur Google Sign-In (OAuth 2.0)
1. Admin menekan tombol `Masuk dengan Google` pada portal admin.
2. Google Identity Services memunculkan prompt persetujuan akun Google.
3. Google mengembalikan `id_token` (JWT terenkripsi) ke antarmuka klien.
4. Klien mengirimkan ID Token ke endpoint `/api/admin/auth/google` melalui metode `POST`.
5. Vercel Serverless Function memverifikasi signature ID Token secara kriptografis menggunakan public keys resmi Google (`googleapis` / token verify certs).
6. Server memverifikasi klaim token:
   - `iss` (harus `accounts.google.com` atau `https://accounts.google.com`).
   - `aud` (harus cocok dengan `GOOGLE_CLIENT_ID` server).
   - `exp` (waktu berlaku belum kedaluwarsa).
   - `email_verified` (harus bernilai `true`).
   - `email` (harus ada di dalam variabel lingkungan `ADMIN_ALLOWLIST`).
7. Jika email tidak terdaftar dalam allowlist, API merespons dengan kode `403 Forbidden` (`UNAUTHORIZED_ADMIN_EMAIL`).
8. Jika lolos, server menerbitkan token sesi terenkripsi (HMAC-SHA256 signed stateless JWT atau session cookie) yang disimpan pada cookie:
   - `HttpOnly`: Mencegah pencurian token melalui serangan XSS di browser.
   - `Secure`: Cookie hanya dikirimkan melalui jalur HTTPS terenkripsi.
   - `SameSite=Lax` / `Strict`: Mencegah pengiriman cookie lintas situs pada serangan CSRF.
   - Durasi kedaluwarsa sesi: 8 jam (sesuai jam operasional kegiatan lapangan).

### 6.2 Otorisasi Server-Side
- Seluruh endpoint di bawah `/api/admin/*` wajib melewati middleware validasi sesi server.
- Proteksi CSRF diterapkan pada seluruh operasi mutasi data (`POST`, `PUT`, `DELETE`) melalui validasi header kustom same-origin (`X-Requested-With: XMLHttpRequest` atau token anti-CSRF per sesi).
- Pengamanan halaman admin tidak sekadar menyembunyikan elemen visual via JavaScript; API menolak keras pengiriman data peserta jika sesi tidak sah.

---

## 7. Admin Dashboard Requirements

Dashboard dirancang padat informasi, efisien, dan responsif untuk penggunaan ponsel oleh panitia lapangan. Menu navigasi dipangkas menjadi tepat **tiga menu utama**:

### 7.1 Menu 1: Overview
- **Kartu Metrik Utama:**
  1. *Total Pendaftar:* Jumlah seluruh baris peserta aktif di lembar spreadsheet.
  2. *Sudah Check-in:* Akumulasi peserta dengan status `CHECKED_IN`.
  3. *Belum Check-in:* Akumulasi peserta dengan status `NOT_CHECKED_IN`.
  4. *Persentase Kehadiran:* Rasio persentase terhitung `(Sudah Check-in / Total Pendaftar) * 100%`.
- **Panel Pendaftar Terbaru:** Menampilkan 5 peserta terakhir yang mendaftar beserta stempel waktu.
- Sumber data: Diambil langsung dari hasil agregasi Google Sheets melalui endpoint `/api/admin/stats`.

### 7.2 Menu 2: Participants
- **Tabel Data Peserta:**
  - Kolom: Nama Lengkap, Alamat Email, Nomor WhatsApp, Kode Tiket, Waktu Registrasi, Status Kehadiran (`CHECKED_IN` / `NOT_CHECKED_IN`), dan Waktu Check-in.
- **Pencarian Live (Search):** Menyaring baris secara instan berdasarkan kecocokan nama peserta, email, nomor WhatsApp, atau kode tiket.
- **Filter Status Kehadiran:** Dropdown pemilihan `Semua Status`, `Sudah Check-in`, dan `Belum Check-in`.
- Tidak ada kolom pembayaran, status reservasi pending, pembatalan, atau edit data pada versi MVP.

### 7.3 Menu 3: Check-in Scanner & Manual
Menyediakan antarmuka terpadu untuk validasi pintu masuk acara:
- **Metode A — Pemindai Kamera Barcode (Code 128):**
  * Akses kamera belakang perangkat ponsel menggunakan pustaka ringan (seperti `html5-qrcode`).
  * Deteksi otomatis garis barcode Code 128 dari kertas cetak atau layar ponsel peserta.
  * Umpan balik visual: Kotak pembidik (viewfinder) aktif dengan indikator pemindaian.
- **Metode B — Input Manual Kode Tiket:**
  * Bidang input teks besar untuk mengetikkan kode tiket jika barcode fisik peserta rusak/buram.
  * Tombol aksi `Proses Check-in`.
- **Status Respons Interaktif Lapangan:**
  1. *Sukses (`CHECKIN_SUCCESS`):* Latar/kartu hijau, suara bip konfirmasi pendek (opsional), menampilkan nama lengkap peserta, nomor WhatsApp, kode tiket, dan stempel waktu check-in.
  2. *Tiket Sudah Digunakan (`ALREADY_USED`):* Peringatan kuning/oranye tegas, menampilkan nama pemilik dan waktu pertama kali tiket diproses untuk mencegah kecurangan tiket duplikat.
  3. *Tiket Tidak Ditemukan (`INVALID_TICKET`):* Peringatan merah jelas bahwa kode tiket tidak terdaftar dalam basis data.
  4. *Gangguan Jaringan / Sistem (`NETWORK_ERROR`):* Pesan kesalahan koneksi dengan opsi tombol coba lagi instan.

### 7.4 Penataan Menu yang Dihilangkan
Menu **Tickets** (manajemen inventaris) dan **Settings** (pengaturan konfigurasi acara) resmi **dihapus** dari spesifikasi sistem v2.0 karena kuota dan aturan pendaftaran dikonfigurasikan langsung melalui environment variable dan lembar spreadsheet panitia.

---

## 8. Google Sheets Architecture

Google Sheets berfungsi sebagai basis data utama. Buku kerja spreadsheet diatur dengan hak akses tertutup (privat), hanya dapat diakses oleh akun Google Service / script owner, dan dilarang dipublikasikan ke web secara publik.

### 8.1 Lembar Kerja 1: `Participants`
Menyimpan entitas data pendaftar acara.

| Kolom | Tipe Data | Keterangan / Aturan Validasi |
|---|---|---|
| `ticket_code` | String (Indexed Key) | Format `NWDS-XXXX-XXXX`, unik, tidak boleh kosong |
| `full_name` | String | Nama lengkap pendaftar, 3–70 karakter |
| `email` | String | Alamat email terverifikasi formatnya, lowercase |
| `whatsapp` | String | Format numerik `628...` |
| `registered_at` | ISO 8601 String | Waktu pendaftaran zona lokal (WIB / UTC+7) |
| `checkin_status` | Enum String | Nilai terbatas: `NOT_CHECKED_IN` atau `CHECKED_IN` |
| `checked_in_at` | ISO 8601 String / Empty | Tanggal dan jam check-in saat status menjadi `CHECKED_IN` |
| `client_request_id` | String (UUID) | ID idempotency untuk mencegah duplikasi penulisan jaringan |

### 8.2 Lembar Kerja 2: `Checkin_Log`
Mencatat jejak audit (audit trail) setiap upaya check-in yang dilakukan petugas.

| Kolom | Tipe Data | Keterangan / Aturan Validasi |
|---|---|---|
| `log_id` | String | UUID unik untuk setiap peristiwa check-in |
| `ticket_code` | String | Kode tiket yang dipindai/diketik |
| `checked_at` | ISO 8601 String | Waktu eksekusi pencatatan |
| `admin_email` | String | Akun Google admin yang mengeksekusi operasi |
| `method` | Enum String | `SCAN` atau `MANUAL` |
| `result` | Enum String | `SUCCESS`, `ALREADY_USED`, `INVALID`, atau `LOCKED_COLLISION` |
| `ip_address_hash` | String | Hash pendek IP petugas untuk audit keamanan dasar |

### 8.3 Manajemen Konkurensi & Integritas Data (LockService)
Untuk mencegah *race condition* saat dua admin memindai barcode yang sama dalam selang milidetik, Google Apps Script wajib menggunakan `LockService.getScriptLock()`:
```javascript
const lock = LockService.getScriptLock();
try {
  // Tunggu antrean eksekusi maksimal 10 detik
  lock.waitLock(10000);
  
  // Baca status tiket terkini dari baris spreadsheet
  // Jika status sudah CHECKED_IN -> batalkan, catat log ALREADY_USED
  // Jika masih NOT_CHECKED_IN -> mutasi baris ke CHECKED_IN, catat log SUCCESS
} finally {
  lock.releaseLock();
}
```

---

## 9. API Architecture (Vercel Functions & Apps Script)

### 9.1 Pola Komunikasi Dua Lapisan
Arsitektur API dipisahkan menjadi dua batas keamanan:
1. **Frontend-Facing Gateway (Vercel Functions - `/api/*`):**
   - Bertindak sebagai Reverse Proxy same-origin.
   - Menyerap lalu lintas pengguna, melakukan validasi payload cepat, rate limiting IP, verifikasi cookie sesi admin, dan menyembunyikan kredensial rahasia.
2. **Internal Core Engine (Google Apps Script Web App Endpoint):**
   - Tidak diekspos langsung ke browser publik.
   - Dipanggil semata-mata oleh Vercel Functions melalui protokol HTTP `POST` dengan mengikutsertakan signature autentikasi bersama (`X-Backend-Secret` preshared key atau HMAC token).

```
[ Browser / Klien ] 
         │  (HTTPS Same-Origin /api/*)
         ▼
[ Vercel Serverless Function ] ── (Validasi Payload, Rate Limit, Auth Sesi)
         │  (HTTPS Private Payload + Shared Secret Token)
         ▼
[ Google Apps Script Web App ] ── (LockService Atomik, Kuota, Eksekusi Logika)
         │  (SpreadsheetApp API)
         ▼
[ Google Sheets Database ]
```

### 9.2 Spesifikasi Kontrak API

#### 1. Registrasi Peserta
- **Endpoint:** `POST /api/register`
- **Akses:** Publik (Rate-limited: 5 request / 10 menit per IP)
- **Request Payload:**
```json
{
  "nama": "Ahmad Fauzi",
  "email": "ahmad.fauzi@example.com",
  "whatsapp": "081234567890",
  "privacyConsent": true,
  "clientRequestId": "550e8400-e29b-41d4-a716-446655440000"
}
```
- **Response Sukses (201 Created):**
```json
{
  "success": true,
  "data": {
    "ticketCode": "NWDS-7K9P-M2X4",
    "nama": "Ahmad Fauzi",
    "registeredAt": "2026-11-04T16:00:00+07:00",
    "eventName": "Nusantara Web & Design Summit 2026"
  }
}
```
- **Error Responses:**
  * `400 Bad Request`: Payload tidak lengkap, nama < 3 karakter, format email tidak valid.
  * `409 Conflict`: Email atau nomor WhatsApp sudah terdaftar sebelumnya.
  * `410 Gone`: Kuota peserta penuh (telah mencapai 200).
  * `429 Too Many Requests`: Melebihi ambang batas request pendaftaran.

#### 2. Autentikasi Google Admin
- **Endpoint:** `POST /api/admin/auth/google`
- **Akses:** Publik
- **Request Payload:** `{"credential": "<GOOGLE_ID_TOKEN_JWT>"}`
- **Response Sukses (200 OK):**
  * Set-Cookie: `admin_session=<SIGNED_JWT>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`
  * Body: `{"success": true, "admin": {"email": "panitia@gmail.com", "name": "Budi Santoso"}}`
- **Error Responses:**
  * `401 Unauthorized`: Token Google tidak valid / kedaluwarsa.
  * `403 Forbidden`: Email terverifikasi tidak ada di dalam `ADMIN_ALLOWLIST`.

#### 3. Status Sesi Admin
- **Endpoint:** `GET /api/admin/me`
- **Akses:** Khusus Admin (Wajib cookie sesi valid)
- **Response Sukses (200 OK):**
```json
{
  "authenticated": true,
  "admin": { "email": "panitia@gmail.com", "name": "Budi Santoso" }
}
```

#### 4. Statistik Dashboard
- **Endpoint:** `GET /api/admin/stats`
- **Akses:** Khusus Admin
- **Response Sukses (200 OK):**
```json
{
  "totalRegistered": 182,
  "checkedIn": 114,
  "notCheckedIn": 68,
  "attendancePercentage": 62.6,
  "quotaCapacity": 200
}
```

#### 5. Daftar Peserta
- **Endpoint:** `GET /api/admin/participants?q=fauzi&status=all`
- **Akses:** Khusus Admin
- **Response Sukses (200 OK):**
```json
{
  "participants": [
    {
      "ticketCode": "NWDS-7K9P-M2X4",
      "nama": "Ahmad Fauzi",
      "email": "ahmad.fauzi@example.com",
      "whatsapp": "6281234567890",
      "registeredAt": "2026-11-04T16:00:00+07:00",
      "status": "CHECKED_IN",
      "checkedInAt": "2026-11-04T08:15:20+07:00"
    }
  ]
}
```

#### 6. Eksekusi Check-in
- **Endpoint:** `POST /api/admin/checkin`
- **Akses:** Khusus Admin
- **Request Payload:**
```json
{
  "ticketCode": "NWDS-7K9P-M2X4",
  "method": "SCAN"
}
```
- **Response Sukses (200 OK):**
```json
{
  "success": true,
  "result": "SUCCESS",
  "participant": {
    "nama": "Ahmad Fauzi",
    "ticketCode": "NWDS-7K9P-M2X4",
    "checkedInAt": "2026-11-04T08:15:20+07:00"
  }
}
```
- **Response Sudah Check-in (409 Conflict):**
```json
{
  "success": false,
  "result": "ALREADY_USED",
  "message": "Tiket sudah digunakan sebelumnya",
  "participant": {
    "nama": "Ahmad Fauzi",
    "ticketCode": "NWDS-7K9P-M2X4",
    "firstCheckedInAt": "2026-11-04T08:15:20+07:00"
  }
}
```
- **Response Tiket Salah (404 Not Found):**
```json
{
  "success": false,
  "result": "INVALID",
  "message": "Kode tiket tidak ditemukan dalam sistem"
}
```

#### 7. Logout Admin
- **Endpoint:** `POST /api/admin/logout`
- **Akses:** Khusus Admin
- **Response:** Clears cookie `admin_session`, respons status 200 OK.

---

## 10. Security Requirements

| Aspek Keamanan | Mekanisme Pertahanan Spesifik |
|---|---|
| **DDoS & Penyalahgunaan Trafik** | Edge rate-limiting bawaan Vercel, restriksi IP di Vercel Functions, serta pembatasan ukuran payload maksimal 16 KB. |
| **Spam Pendaftaran** | Honeypot field tak terlihat pada form pendaftaran, rate limit berbasis IP (maks 5 submisi/10 menit), normalisasi string, dan validasi UUID client request. |
| **Brute Force & Enumerasi Tiket** | Entropi acak 64-bit pada kode tiket (`NWDS-XXXX-XXXX`), tanpa format sekuensial (bukan 001, 002), rate-limiting ketat pada endpoint check-in. |
| **Unauthorized Admin Access** | Verifikasi kriptografis token OAuth Google di server, whitelist email eksplisit di environment variables, cookie sesi `HttpOnly; Secure; SameSite=Lax`. |
| **Cross-Site Scripting (XSS)** | Sanitasi seluruh teks input sebelum ditulis ke spreadsheet dan escaping penuh seluruh karakter dinamis saat dirender ke DOM. |
| **Cross-Site Request Forgery (CSRF)** | Atribut cookie `SameSite=Lax`, validasi header khusus `X-Requested-With` pada seluruh mutasi API admin. |
| **Replay & Check-in Ganda** | Penguncian konkurensi atomik `LockService` di Google Apps Script dan stempel unik `client_request_id`. |
| **Kebocoran Rahasia (Secrets)** | Kunci rahasia backend (`BACKEND_SECRET_KEY`, `GOOGLE_CLIENT_SECRET`) HANYA disimpan di Vercel Environment Variables dan Apps Script Script Properties; 0% rahasia terpapar di bundle frontend. |
| **Privasi Data Peserta** | Data nomor telepon dan email peserta hanya dikirim ke klien jika admin terautentikasi resmi. Halaman publik tidak memiliki akses pembacaan daftar peserta. |
| **Backup & Recovery** | Prosedur ekspor manual / snapshot berkala Google Sheets ke format `.xlsx`/`.csv` setiap jam 12:00 dan 18:00 WIB selama hari H kegiatan. |

---

## 11. Non-Functional Requirements

- **Availability & Independensi Perangkat:** Sistem berjalan mandiri 24/7 di atas infrastruktur serverless Vercel dan Google Workspace tanpa membutuhkan laptop atau server lokal.
- **Responsivitas Mobile-First:** Tampilan form pendaftaran dan panel scanner admin dioptimalkan penuh untuk kenyamanan layar smartphone (320px – 430px viewport width).
- **Performa & Web Vitals:** First Contentful Paint (FCP) < 1.2 detik dan Largest Contentful Paint (LCP) < 2.0 detik melalui bundling aset lokal, font WOFF2 preloaded, dan ikon SVG preload luring.
- **Efisiensi Memori Scanner:** Pemindaian kamera menutup stream media secara otomatis saat beralih tab atau saat modal ditutup untuk mencegah *battery drain* pada perangkat petugas lapangan.
- **Observabilitas & Logging:** Vercel Runtime Logs memantau kesalahan fungsi HTTP; lembar kerja `Checkin_Log` mendokumentasikan setiap aksi pemindaian secara permanen.

---

## 12. Testing Scenarios & Acceptance Criteria

Skenario penerimaan yang wajib diuji pada tahap validasi:

1. **Pendaftaran Normal:** Input valid menghasilkan kode tiket baru, barcode Code 128 tampil, dan baris tersimpan di spreadsheet dengan status `NOT_CHECKED_IN`.
2. **Validasi Formulir:** Input nama 2 huruf, email tanpa `@`, atau nomor WhatsApp non-angka memicu pesan error inline tanpa menghubungi backend.
3. **Pendaftaran Duplikat:** Mendaftar ulang dengan email atau nomor WhatsApp yang sama memunculkan pesan penolakan bahwa data telah terdaftar.
4. **Batas Kuota:** Menguji pendaftaran saat kuota terisi 200 peserta menghasilkan pesan santun bahwa kapasitas ruangan telah penuh.
5. **Autentikasi Admin:** Akun email Google yang terdaftar di `ADMIN_ALLOWLIST` berhasil login; akun email Google umum lainnya ditolak dengan pesan `Akses Ditolak`.
6. **Proteksi Akses Dashboard:** Membuka URL admin tanpa login langsung dialihkan ke layar otentikasi login.
7. **Check-in Barcode Sukses:** Memindai barcode valid menghasilkan status `SUCCESS`, warna hijau, dan mengubah status peserta menjadi `CHECKED_IN`.
8. **Pencegahan Check-in Ganda:** Tiket yang telah berstatus `CHECKED_IN` jika dipindai kembali (oleh admin manapun) menghasilkan status `ALREADY_USED`, warna kuning, dan menampilkan waktu check-in pertama.
9. **Uji Konkurensi Dua Petugas:** Dua permintaan check-in dengan tiket yang sama dikirimkan simultan dalam selang 100ms; tepat satu request menghasilkan `SUCCESS` dan request kedua menghasilkan `ALREADY_USED` berkat `LockService`.
10. **Pemulihan Jaringan:** Mode offline saat submit memunculkan pesan galat jaringan tanpa mencetak tiket palsu.

---

## 13. Development Milestones

Tahapan implementasi sistem:

1. **Milestone 1 — Finalisasi Dokumen & Kontrak:** Menyetujui `PRD.md` dan `design.md` versi 2.0.
2. **Milestone 2 — Persiapan Google Sheets & Script Properties:** Mengonfigurasi tabel `Participants`, `Checkin_Log`, dan Script Properties di Google Apps Script.
3. **Milestone 3 — Backend Apps Script Core:** Mengembangkan skrip pemrosesan pendaftaran, kuota, `LockService`, dan pencatatan log check-in.
4. **Milestone 4 — Vercel Functions API Gateway:** Mengimplementasikan endpoint `/api/register`, `/api/admin/*`, dan verifikasi token Google.
5. **Milestone 5 — Integrasi Pendaftaran & Generator Barcode:** Menghubungkan form pendaftaran landing page ke `/api/register` dan merender tiket digital Code 128.
6. **Milestone 6 — Dashboard Admin & Scanner Barcode:** Memperbarui antarmuka admin menjadi 3 menu (Overview, Participants, Check-in) serta integrasi modul kamera.
7. **Milestone 7 — Audit Keamanan & Uji Beban Terkontrol:** Simulasi pengujian batas kuota, konkurensi check-in ganda, dan review izin privasi.
8. **Milestone 8 — Deployment & Panduan Operasional:** Deployment akhir ke Vercel dan penyusunan SOP lapangan bagi panitia acara.

---

## 14. Open Decisions

1. **[OPEN DECISION] Fallback Pengiriman Tiket Tambahan:** Apakah panitia menginginkan opsi pengiriman tiket otomatis melalui webhook WhatsApp Gateway gratis atau murni tombol `Unduh Tiket PNG` lokal? (Rekomendasi saat ini: Tombol unduh gambar lokal untuk menjamin biaya Rp0).
2. **[OPEN DECISION] Batas Waktu Toleransi Keterlambatan Check-in:** Apakah sistem check-in ditutup secara otomatis pada jam tertentu di lembar Apps Script atau tetap dibuka manual hingga penutupan acara? (Rekomendasi saat ini: Ditutup manual oleh panitia).

