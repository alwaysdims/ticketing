# Design System & UI/UX Specification

**Proyek:** Event Registration & Barcode Check-in System  
**Versi:** 2.0  
**Tanggal:** 4 November 2026  
**Status:** Panduan Desain Antarmuka & Interaksi Produksi  
**Target Hosting:** Vercel (`https://ticketing-nine-nu.vercel.app/`)  
**Fondasi Visual:** Soft Claymorphism with Editorial Clarity (Hybrid Clay Dashboard)

---

## 1. Design Direction: Soft Claymorphism with Editorial Clarity

Arah desain mengombinasikan estetika modern **Soft Claymorphism** dengan disiplin **Editorial Clarity** berstandar kurasi web internasional (setara Awwwards). 

### 1.1 Karakteristik Utama
- **Permukaan Matte & Elevasi Lembut:** Kartu dan elemen aksi menggunakan warna dasar lavender sangat muda (`#FCFBFE` di atas kanvas `#F5F2FB`), dengan sudut membulat yang nyaman (`rounded-2xl` hingga `rounded-3xl`), bayangan ganda yang difus (*dual drop-shadow*), dan highlight border transparan (1px solid `rgba(232, 226, 239, 0.8)`).
- **Disiplin Anti-Slop (Anti AI-Decorations):**
  * DILARANG menambahkan elemen dekoratif acak tanpa tujuan semantik (tidak ada *blobs* gradien mengambang, bentuk geometris tak bermakna, atau efek kaca berlebihan).
  * Menghindari bayangan hitam pekat atau kotor; seluruh bayangan memadukan rona ungu lavender berbobot alfa rendah (`rgba(139, 92, 246, 0.06)` dan `rgba(0, 0, 0, 0.04)`).
  * Struktur grid tegas dan whitespace proporsional; keindahan antarmuka muncul dari keselarasan tipografi dan tata letak, bukan dekorasi latar yang bising.

---

## 2. Color Palette & Design Tokens

Sistem warna menerapkan hierarki ketat: satu warna primer fungsional, dua warna aksen sekunder, dan rentang warna netral bersuhu sejuk (*cool-toned neutrals*).

### 2.1 Tabel Token Warna

| Kategori Token | Nama Token | Nilai Heksadesimal | Penerapan UI | Kontras Rasio (WCAG) |
|---|---|---|---|---|
| **Primary** | `brand-primary` | `#8B5CF6` | Aksen grafis, ikon penting, outline fokus, progress fill | 4.23:1 (Aksen/Border) |
| **Primary Accessible** | `brand-primary-dark` | `#6D36D8` | Tombol CTA primer, tautan aktif, heading interaktif | **6.63:1** (Lolos AA Text) |
| **Secondary Lilac** | `brand-lilac` | `#F0DFF5` | Lapisan badge, kontainer ikon, highlight seksi aktif | Background dekoratif |
| **Secondary Mint** | `brand-mint` | `#DDF1EB` | Aksen kategori, penanda status check-in sukses | Background status |
| **Canvas** | `canvas` | `#F5F2FB` | Latar belakang halaman utama (body) | Basis kontras |
| **Surface** | `surface` | `#FCFBFE` | Kartu konten, kontainer form, modal popover | 1.05:1 vs Canvas |
| **Ink / Text** | `ink` | `#302B38` | Teks utama, judul, label kolom tabel | **12.42:1** (Lolos AAA) |
| **Muted Text** | `muted` | `#66616F` | Teks pendukung, deskripsi jadwal, placeholder form | **5.32:1** (Lolos AA) |
| **Border / Line** | `line` | `#E8E2EF` | Garis pemisah, border field input, outline kartu | Pembatas visual |
| **Success Semantics** | `success` | `#1A7F4B` | Teks status terkonfirmasi & check-in sukses | 5.8:1 pada Surface |
| **Warning Semantics** | `warning` | `#B45309` | Peringatan tiket sudah terpakai (`ALREADY_USED`) | 4.7:1 pada Surface |
| **Danger Semantics** | `danger` | `#B4233A` | Indikator kesalahan input, kode tiket invalid | 6.1:1 pada Surface |

### 2.2 Deklarasi Tailwind CSS v4 `@theme`
```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #8B5CF6;
  --color-brand-primary-dark: #6D36D8;
  --color-brand-lilac: #F0DFF5;
  --color-brand-mint: #DDF1EB;
  --color-canvas: #F5F2FB;
  --color-surface: #FCFBFE;
  --color-ink: #302B38;
  --color-muted: #66616F;
  --color-line: #E8E2EF;
  --color-danger: #B4233A;
  --color-success: #1A7F4B;
  --color-warning: #B45309;
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --radius-sm: 14px;
  --radius-md: 18px;
  --radius-lg: 24px;
  --radius-xl: 32px;
}
```

---

## 3. Typography Hierarchy

Menggunakan jenis huruf **Plus Jakarta Sans** berlisensi open source yang disajikan secara lokal melalui berkas modern `woff2` tanpa ketergantungan runtime ke CDN Google Fonts.

### 3.1 Skala Tipografi Responsif
- **Hero Display H1:**
  * Desktop: `clamp(2.75rem, 5vw, 4.25rem)` (44px – 68px), font-weight 800, line-height 1.08, letter-spacing -0.03em.
  * Mobile (375px): `2.25rem` (36px), font-weight 800, line-height 1.15.
- **Section Heading H2:**
  * Desktop: `2.25rem` (36px), font-weight 700, line-height 1.2, letter-spacing -0.02em.
  * Mobile: `1.75rem` (28px), font-weight 700, line-height 1.25.
- **Card / Subsection Heading H3:**
  * Desktop & Mobile: `1.25rem` – `1.5rem` (20px – 24px), font-weight 700, line-height 1.3.
- **Body Regular:** `1rem` (16px), font-weight 400, line-height 1.6, max-width paragraf 65–70 karakter (`max-w-prose`) untuk kenyamanan membaca.
- **Body Small / Captions:** `0.875rem` (14px), font-weight 500, line-height 1.5.
- **Form Label & Nav Items:** `0.9375rem` (15px), font-weight 600, letter-spacing -0.01em.
- **Barcode Numeric / Ticket Code:** `1.125rem` (18px), font-mono / font-bold tracking-widest, kapital murni.

---

## 4. Layout, Grid, & Spacing Scale

### 4.1 Grid & Kontainer Sistem
- **Lebar Maksimal Kontainer:** `1200px` (`max-w-6xl`) dengan padding horizontal:
  * Mobile (320–480px): `px-5` (20px).
  * Tablet (768px): `px-8` (32px).
  * Desktop (1024px+): `px-8` (32px).
- **Sistem Grid Desktop:** 12 kolom simetris dengan selang celah (*gap*) 24px – 32px.
- **Section Spacing Vertikal:**
  * Mobile: `py-16` (64px).
  * Tablet: `py-24` (96px).
  * Desktop: `py-32` (128px).

### 4.2 Radius & Clay Shadow Utilities
```css
/* Multi-layer Soft Clay Shadow */
.clay-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-line);
  box-shadow:
    0 2px 8px rgba(139, 92, 246, 0.05),
    0 8px 24px rgba(139, 92, 246, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -2px 4px rgba(139, 92, 246, 0.03);
}

.clay-card-elevated {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-line);
  box-shadow:
    0 6px 18px rgba(139, 92, 246, 0.08),
    0 16px 36px rgba(139, 92, 246, 0.06),
    0 2px 4px rgba(0, 0, 0, 0.04),
    inset 0 2px 0 rgba(255, 255, 255, 0.95),
    inset 0 -2px 6px rgba(139, 92, 246, 0.05);
}
```

---

## 5. Landing Page Design Specifications

Mempertahankan urutan hierarki 7 seksi tanpa penyimpangan:

### 5.1 Navbar
- Ketinggian: 72px (mobile) / 80px (desktop), posisi `sticky top-0`, latar `bg-canvas/90 backdrop-blur-sm`, transisi border bawah saat scroll (`.scrolled`).
- Elemen: Logo teks/ikon `solar:ticket-bold`, daftar tautan desktop (`Tentang`, `Jadwal`, `Tiket`, `FAQ`), dan tombol hamburger mobile (target sentuh 44x44px).
- Aksesibilitas: Tombol hamburger mengontrol atribut `aria-expanded` dan drawer navigasi mengunci fokus tab saat terbuka.

### 5.2 Hero Section + CTA
- **Layout Dua Kolom Desktop:** 
  * Kiri (60%): Eyebrow acara bertuliskan rincian konferensi, H1 editorial yang menarik, deskripsi ringkas 2 baris, metadata tanggal & tempat (Sabuga ITB), serta sepasang tombol: CTA Primer `Daftar Sekarang` (`#tickets`) dan CTA Sekunder `Lihat Jadwal` (`#schedule`).
  * Kanan (40%): Kartu visual tiket clay mengambang yang menampilkan rincian pass acara, perforasi visual tiket, dan chip tanggal.
- **Layout Mobile:** Satu kolom vertikal; teks heading dan tombol CTA tampil terlebih dahulu, diikuti ilustrasi kartu tiket di bawahnya.

### 5.3 About Section
- Komposisi asimetris yang memuat 3 pilar utama kegiatan: Arsitektur Frontend, Desain Sistem Berkelanjutan, dan Aksesibilitas Web Inklusif.
- Menggunakan kartu bergaris pembatas halus dengan ikon kontainer lilac (`bg-brand-lilac`).

### 5.4 Schedule Section
- Garis waktu kronologis vertikal yang menyajikan 7 agenda kegiatan lengkap.
- Tiap entri memuat label waktu (font semibold warna primer gelap), judul sesi, nama pembicara, dan lokasi ruangan (Auditorium / Lab Komputer).
- State aktif baris jadwal memiliki indikator visual titik ungu yang terhubung dengan garis vertikal kontras.

### 5.5 Quota & Tickets Section
- **Struktur Dua Kolom Desktop:**
  * **Kolom Kiri (Panel Informasi Kuota ~45%):** Indikator kapasitas (300 kursi total, 247 terisi, 53 kursi tersisa), progres bar kuota interaktif, fasilitas pass (workshop kit, lunch box, e-certificate resmi), serta kebijakan registrasi.
  * **Kolom Kanan (Formulir Registrasi ~55%):** Kartu clay elevasi berisi formulir pendaftaran langsung (lihat spesifikasi Bab 6).
- **Struktur Mobile:** Kolom kiri informasi kuota dirender di atas, diikuti kartu formulir di bawahnya.

### 5.6 FAQ Section
- Akordion satu kolom tunggal terpusat (`max-w-3xl`) dengan 7 tanya-jawab praktis.
- Mekanisme akordion: Pembukaan satu panel secara otomatis menutup panel lainnya (*single-open accordion*), rotasi ikon panah 180 derajat saat terbuka, dan dukungan tombol navigasi keyboard (Enter / Space).

### 5.7 Footer
- Latar gelap (`bg-ink` atau ungu sangat gelap), teks netral terang, memuat ringkasan entitas kegiatan, hak cipta 2026, dan kanal kontak panitia (email & WhatsApp resmi).

---

## 6. Registration Form Design

### 6.1 Bidang Isian Form
- **Nama Lengkap:** `<input type="text" name="nama" id="form-nama">` dengan label floating/eksplisit di atas input.
- **Alamat Email:** `<input type="email" name="email" id="form-email">` dengan validasi format email.
- **Nomor WhatsApp:** `<input type="tel" name="whatsapp" id="form-whatsapp">` dengan teks petunjuk format `08...`.
- **Persetujuan Privasi:** `<input type="checkbox" name="privacyConsent" id="form-privacy">` dengan teks pernyataan bahwa data semata-mata digunakan untuk kepentingan validasi tiket.

### 6.2 Status Interaksi & Umpan Balik Input
- **Default State:** Latar putih bersih, border 1px `var(--color-line)`, radius 14px, padding `0.75rem 1rem`.
- **Focus-Visible State:** Border berubah ke `var(--color-brand-primary-dark)`, muncul outer glow 2px `rgba(109, 54, 216, 0.2)`.
- **Error State:** Border 1.5px `var(--color-danger)`, teks pesan kesalahan merah di bawah field terhubung via `aria-describedby`, atribut `aria-invalid="true"`.
- **Loading / Submitting State:** Tombol submit menampilkan animasi spinner halus, teks berubah menjadi `Memproses Registrasi...`, seluruh field berstatus `disabled` untuk mencegah multi-klik.
- **Failure State (Network / Backend Error):** Alert box berwarna merah muda di atas tombol pendaftaran dengan tombol aksi `Coba Lagi`.

---

## 7. Digital Ticket Design & Barcode Specification

Setelah API mengembalikan respons registrasi sukses (status 201), antarmuka menampilkan modal/kartu tiket digital:

```
┌────────────────────────────────────────────────────────┐
│  NUSANTARA WEB & DESIGN SUMMIT 2026                    │
│  Sabtu, 24 Oktober 2026 • Sabuga ITB Bandung          │
├────────────────────────────────────────────────────────┤
│  NAMA PESERTA                                          │
│  Ahmad Fauzi                                           │
│                                                        │
│  KODE TIKET                                            │
│  NWDS-7K9P-M2X4                                        │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │   || | |||| || ||| |||| | || |||| || ||| ||||    │  │  <-- Barcode Code 128
│  │                   NWDS-7K9P-M2X4                 │  │      (Kontras Tinggi)
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Tunjukkan barcode ini kepada petugas saat check-in.   │
├────────────────────────────────────────────────────────┤
│  [ Simpan sebagai Gambar ]      [ Tutup Pratinjau ]    │
└────────────────────────────────────────────────────────┘
```

### 7.1 Spesifikasi Teknis Barcode
- Format: **Code 128** standar ISO/IEC 15417.
- Rasio garis: Lebar modul sempit minimal 2px pada canvas untuk menjaga resolusi saat dirender pada layar ponsel kecerahan rendah.
- Latar Belakang: Wajib putih solid `#FFFFFF` tanpa tekstur atau bayangan clay di belakang garis barcode.
- Warna Barcode: Hitam absolut `#000000` (100% K).
- Margin Aman (*Quiet Zone*): Minimal 10x lebar modul sempit di sisi kiri dan kanan barcode.

### 7.2 Fitur Ekspor / Simpan Tiket
- Tombol `Simpan Tiket` merender elemen kartu tiket ke elemen HTML5 Canvas off-screen dan memicu unduhan otomatis file gambar format `PNG` (`tiket-nwds-7k9p-m2x4.png`) yang langsung tersimpan di galeri ponsel peserta.

---

## 8. Admin Dashboard: Hybrid Clay Specification

Dashboard admin mengadopsi konsep **Hybrid Clay**: elemen navigasi, tabel data, dan formulir input dibuat datar (*flat clean*) demi efisiensi visual dan densitas informasi kerja lapangan, sedangkan kartu ringkasan metrik memanfaatkan elevasi *soft clay*.

### 8.1 Struktur Navigasi (Tepat 3 Menu)
Menu **Tickets** dan **Settings** resmi dihapus. Sidebar/drawer admin hanya menyajikan:
1. **Overview:** Ikon `solar:chart-2-linear`, ringkasan statistik dan aktivitas pendaftaran.
2. **Participants:** Ikon `solar:users-group-rounded-linear`, tabel lengkap peserta dengan pencarian dan filter.
3. **Check-in:** Ikon `solar:scanner-linear`, antarmuka kamera scanner barcode dan input kode tiket manual.

### 8.2 Antarmuka Menu 1: Overview
- **Grid Kartu Statistik (4 Kolom Desktop / 2 Kolom Mobile):**
  * Kartu 1: *Total Pendaftar* (Angka besar, badge kuota terisi).
  * Kartu 2: *Sudah Check-in* (Aksen hijau, badge persentase hadir).
  * Kartu 3: *Belum Check-in* (Aksen oranye/kuning netral).
  * Kartu 4: *Rasio Kehadiran* (Teks persentase besar, misal `62.6%`).
- Kartu dirancang menggunakan utilitas `.clay-card` dengan padding proporsional `p-6` dan radius 20px.

### 8.3 Antarmuka Menu 2: Participants
- **Toolbar Operasional:** Kotak pencarian live teks dengan ikon pencarian `solar:magnifer-linear` dan dropdown filter status (`Semua`, `Sudah Check-in`, `Belum Check-in`).
- **Tabel Responsif:** Baris tabel dengan tinggi baris 56px, pembatas horizontal tipis `border-line/60`, status diwakili oleh komponen badge berbentuk kapsul pill:
  * Status `CHECKED_IN`: Badge latar mint (`bg-brand-mint/60`), teks hijau tua (`text-success`), ikon centang.
  * Status `NOT_CHECKED_IN`: Badge latar netral (`bg-canvas`), teks abu-abu tua (`text-muted`).
- Pada layar mobile (<768px), tabel dapat digulir horizontal secara terkontrol atau dialihkan menjadi tampilan kartu daftar peserta per baris.

### 8.4 Antarmuka Menu 3: Check-in Scanner & Manual
Dioptimalkan untuk operasi satu tangan pada smartphone petugas di pintu masuk:
- **Bagian Atas — Scanner Barcode Kamera:**
  * Tombol saklar `Nyalakan Kamera` / `Matikan Kamera`.
  * Jendela bidik kamera (*viewfinder*) rasio 1:1 atau 4:3 dengan panduan garis bidik sudut melengkung.
  * Umpan balik audio visual instan saat barcode terdeteksi.
- **Bagian Bawah — Input Manual:**
  * Bidang teks besar dengan placeholder `Ketik kode: NWDS-XXXX-XXXX`.
  * Tombol aksi primer `Validasi Check-in`.
- **Kartu Hasil Pemindaian (Scan Result Card):**
  * *Sukses:* Latar hijau lembut, ikon centang besar, menampilkan nama peserta, nomor kontak, kode tiket, dan stempel jam.
  * *Peringatan Tiket Duplikat:* Latar oranye tegas, teks peringatan `TIKET SUDAH DIGUNAKAN`, mencantumkan identitas peserta dan jam pertama kali check-in dilakukan.
  * *Galat Tiket Salah:* Latar merah lembut, teks `KODE TIKET TIDAK VALID`.

---

## 9. Icon System

Menggunakan pustaka **Iconify** dengan keluarga ikon tunggal **Solar Icons** (gaya Linear dan Bold untuk aksen aktif) demi keseragaman ketebalan garis (*stroke width*) dan sudut lengkung:
- Ikon Tiket: `solar:ticket-bold` / `solar:ticket-linear`
- Ikon Kalender / Waktu: `solar:calendar-linear` / `solar:clock-circle-linear`
- Ikon Lokasi: `solar:map-point-linear`
- Ikon Peserta / Grup: `solar:users-group-rounded-linear`
- Ikon Scanner: `solar:scanner-linear`
- Ikon Check-in Sukses: `solar:check-circle-bold`
- Ikon Peringatan: `solar:danger-triangle-linear`
- Standar Ukuran: 20px (tombol & input), 24px (navigasi & kartu fitur), 28px–32px (header modal & ilustrasi).

---

## 10. Motion & Microinteractions

- **Durasi Transisi Standar:** 150ms – 220ms untuk respon hover tombol dan fokus field input.
- **Transisi Akordion:** 250ms – 300ms kemunculan konten akordion.
- **Feedback Pemindaian Scanner:** Transisi instan (< 100ms) pada kartu hasil scan agar alur antrean check-in di pintu masuk tidak tersendat.
- **Reduced Motion Support:** Aturan CSS `@media (prefers-reduced-motion: reduce)` menonaktifkan seluruh animasi transform dan mempercepat durasi transisi menjadi 0.01ms untuk pengguna dengan sensitivitas vestibular.

---

## 11. Responsive Breakpoint Matrix

| Breakpoint | Target Perangkat | Penyesuaian Tata Letak |
|---|---|---|
| **320px – 375px** | Ponsel Layar Kecil (iPhone SE, dsb.) | Navigasi drawer penuh, form registrasi satu kolom rapat, padding kontainer 16px, tombol CTA lebar penuh (100% width). |
| **390px – 430px** | Ponsel Modern Standar | Ukuran teks display responsif, kartu statistik dashboard admin tersusun 2 kolom rapi, jendela kamera scanner proporsional. |
| **768px – 1023px** | Tablet & iPad | Hero section mulai membagi teks dan ilustrasi tiket, tabel peserta admin memuat seluruh kolom tanpa pemotongan teks. |
| **1024px – 1440px** | Laptop & Desktop Standar | Section Quota & Tickets aktif dalam 2 kolom terpisah (kiri info, kanan form), sidebar dashboard admin terkunci permanen di sisi kiri (lebar 256px). |
| **1440px+** | Layar Monitor Lebar | Kontainer konten dibatasi maksimal 1200px terpusat di tengah layar (*auto margins*), mencegah pemanjangan baris teks yang berlebihan. |

---

## 12. Accessibility (WCAG 2.2 AA) Standards

- **Rasio Kontras Warna:** Teks primer `#302B38` terhadap kanvas `#F5F2FB` mencapai 12.42:1 (Lolos AAA); tombol CTA `#6D36D8` terhadap teks putih mencapai 6.63:1 (Lolos AA).
- **Aksesibilitas Formulir:** Setiap input memiliki tag `<label>` pasangan yang sah; pesan galat dipasangkan menggunakan atribut `aria-describedby` ke elemen pesan teks terkait.
- **Indikator Fokus:** Seluruh elemen interaktif memiliki garis fokus keyboard `focus-visible` setebal 2px dengan jarak offset 2px.
- **Dukungan Pembaca Layar:** Tautan lompat langsung (*skip link*) `Lewati navigasi` -> `#konten` tersedia di baris pertama DOM; tombol menu memiliki atribut pembaca status `aria-expanded` dan label pembuka `aria-label`.
- **Target Sentuh Minimum:** Seluruh tombol navigasi, link menu mobile, trigger FAQ, dan tombol submit memiliki ukuran fisik minimal 44 × 44 piksel.

---

## 13. Design Quality & Audit Checklist

Daftar periksa sebelum antarmuka diserahkan ke tahap implementasi:

- [ ] **Urutan Seksi:** Landing page mematuhi 7 seksi persis (Navbar -> Hero -> About -> Schedule -> Quota & Tickets -> FAQ -> Footer).
- [ ] **Struktur Dua Kolom:** Seksi Quota & Tickets terbukti tampil 2 kolom di desktop (info kiri, form kanan) dan 1 kolom di mobile.
- [ ] **Palet Warna:** Hanya 1 warna primer fungsional (`#8B5CF6` / `#6D36D8`), 2 sekunder (`#F0DFF5`, `#DDF1EB`), dan warna netral berkarakter sejuk.
- [ ] **Bebas Dekorasi AI Slop:** Tidak ada blob mengambang, gradien acak, atau teks jargon mesin.
- [ ] **Desain Tiket Barcode:** Area barcode Code 128 memiliki kontras hitam-putih murni dan bebas dari efek bayangan clay.
- [ ] **Struktur Admin 3 Menu:** Sidebar admin hanya memiliki menu Overview, Participants, dan Check-in (menu Tickets & Settings terhapus).
- [ ] **Responsivitas Scanner:** Jendela bidik kamera dan kartu umpan balik status terbaca jelas di layar smartphone.
- [ ] **Audit Aksesibilitas:** Seluruh rasio kontras teks teruji lolos WCAG AA dan navigasi keyboard beroperasi penuh.

