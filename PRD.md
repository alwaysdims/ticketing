# Product Requirements Document (PRD)

**Proyek:** Event Registration & Ticketing Website  
**Versi:** 1.0 — rancangan awal  
**Tanggal:** 4 November 2026  
**Status:** Siap sebagai acuan pengerjaan frontend; rincian operasional menunggu konfirmasi panitia  
**Jenis proyek:** Single-event (asumsi sementara; harus dikonfirmasi)  

## 1. Ringkasan Produk
Website acara dengan landing page yang informatif dan mudah digunakan untuk calon peserta, serta dashboard admin untuk pengelolaan kegiatan. Desain visual mengacu pada Soft Claymorphism yang profesional, menggunakan latar lavender sangat muda, tipografi kuat, ruang putih yang lega, dan elemen clay secara selektif.

Pengembangan dilakukan dalam dua tahap **yang tidak boleh dicampur secara fungsional**:

1. **Tahap A — Frontend demo statis:** HTML, Tailwind CSS, Iconify, dan JavaScript ringan; diterbitkan melalui GitHub Pages untuk memperoleh persetujuan panitia. Belum ada Laravel, MySQL, login sungguhan, pemesanan tiket, atau penyimpanan peserta.
2. **Tahap B — Aplikasi produksi:** Laravel 13, Blade, Tailwind CSS, MySQL, session authentication, middleware dan authorization, serta penyimpanan data, tiket, dan check-in yang benar-benar berjalan. Tidak di-host pada GitHub Pages.

## 2. Latar Belakang dan Permasalahan
Panitia membutuhkan media terpusat untuk menjelaskan kegiatan, menerima pendaftaran, menampilkan kuota, dan pada akhirnya memantau peserta. Spreadsheet dan komunikasi manual rentan menimbulkan data ganda, informasi yang tidak sinkron, serta kesulitan validasi peserta di lokasi.

## 3. Sasaran dan Indikator Keberhasilan
- Calon peserta memahami nama, waktu, lokasi, manfaat, dan alur pendaftaran tanpa perlu bertanya ke panitia.
- CTA utama terlihat pada hero; form pendaftaran mudah ditemukan pada section kuota dan tiket.
- Landing page nyaman dibaca dan digunakan di layar ponsel.
- Panitia dapat mengevaluasi tampilan dan user journey melalui tautan demo statis.
- Pada tahap produksi: hanya pendaftaran terverifikasi yang mengurangi sisa kuota; admin dapat melihat, mencari, memfilter, dan mengekspor data peserta.

**Kriteria penerimaan Tahap A:** seluruh section terimplementasi; navigasi anchor bekerja; layout mobile/tablet/desktop rapi; FAQ dapat dibuka; form tervalidasi secara lokal tetapi tidak mengirim atau menyimpan data; seluruh data/tiket/dashboard diberi label demonstrasi; tidak ada klaim sukses pemesanan yang palsu.

## 4. Pengguna dan Hak Akses
| Persona | Kebutuhan | Tahap A | Tahap B |
|---|---|---|---|
| Pengunjung/peserta | Mengetahui detail acara dan mengisi formulir | UI + validasi lokal | Registrasi nyata, status dan tiket |
| Panitia | Melihat daftar peserta dan melakukan check-in | Dashboard mock | Dashboard terbatas berdasarkan izin |
| Admin | Mengatur acara, kuota, akses panitia dan laporan | Dashboard mock | Akses sesuai kebijakan aplikasi |

Peserta **tidak diwajibkan membuat akun** untuk pendaftaran standar. Pembuatan akun admin/panitia **tidak terbuka untuk publik**.

## 5. Ruang Lingkup Tahap A — Frontend Demo
### 5.1 Landing Page: urutan section wajib
1. **Navbar:** logo/identitas acara; tautan About, Schedule, Tickets, FAQ; menu mobile; tombol nav diarahkan ke anchor tiket jika diperlukan.
2. **Hero + CTA:** nama acara, tagline singkat, tanggal dan lokasi, satu CTA primer `Daftar Sekarang` menuju `#tickets`, satu aksi sekunder opsional menuju jadwal; visual clay/floating event ticket yang relevan. Tidak ada CTA section terpisah di bawah.
3. **About:** ringkasan kegiatan, tujuan/manfaat dan audiens acara. Prioritaskan copy spesifik dan singkat.
4. **Schedule:** timeline agenda berurutan, dengan waktu, judul sesi, dan deskripsi ringkas; seluruh konten placeholder harus jelas bertanda `Contoh` jika belum disahkan.
5. **Quota & Tickets:** desktop dua kolom — **kiri** informasi kuota, ketersediaan, ketentuan, informasi harga/gratis (jika telah dikonfirmasi); **kanan** formulir tiket dengan label field, indikator wajib, persetujuan privasi. Mobile menjadi satu kolom: informasi kuota di atas, form di bawah. Data demo tidak dihitung sebagai stok nyata.
6. **FAQ:** accordion berisi pertanyaan umum tentang jadwal, lokasi, biaya, konfirmasi, perubahan data, kontak, dan kehadiran; jawaban yang belum dikonfirmasi tidak dibuat-buat.
7. **Footer:** ringkasan event, tautan navigasi cepat, kontak panitia, media sosial resmi jika tersedia, informasi penyelenggara, tahun, dan tautan kebijakan privasi jika diperlukan.

### 5.2 Form Tiket pada Demo
- Field rancangan awal: nama lengkap, email, nomor WhatsApp; kolom tambahan ditetapkan setelah panitia menyetujui kebutuhan data.
- Gunakan label, tipe input, keterangan opsional, dan validasi client-side (misalnya format email dan field wajib).
- **Tidak ada pengiriman data ke pihak ketiga, database, localStorage, Google Forms, email atau API** dalam demo ini kecuali disetujui kemudian.
- Tombol submit bersifat `Demo / Belum Aktif`, atau jika dipakai untuk simulasi, menampilkan pesan **“Pratinjau formulir — pendaftaran belum dibuka dan data tidak disimpan.”** Jangan membuat ID tiket atau bukti pembayaran palsu.
- CTA hero men-scroll ke formulir, bukan langsung melakukan transaksi.

### 5.3 Dashboard Admin Demo
- Route demo statis dapat berupa `admin.html` atau `admin/index.html`; **bukan dashboard terlindungi** dan tidak memuat data pribadi nyata.
- Sidebar/topbar: Overview, Participants, Tickets, Check-in, Settings; fitur di luar cakupan cukup berupa visual non-fungsional yang diberi label demo.
- Overview: empat metrik mock (total pendaftar, terkonfirmasi, menunggu, check-in), ringkasan status, dan aktivitas dummy.
- Participants: tabel responsif dengan data fiktif, kolom nama, kode pendaftaran, status, waktu; pencarian/filter boleh dibuat di browser pada data dummy.
- Tickets dan Check-in: tampilan konsep saja, tidak mengklaim validasi QR sungguhan.
- Hanya kartu metrik dan tombol tertentu yang menggunakan efek clay; tabel tetap datar/rapi.

### 5.4 Interaksi dan Responsivitas Demo
- Navbar sticky opsional, anchor scrolling halus dengan menghormati `prefers-reduced-motion`.
- Accordion FAQ dapat digunakan keyboard.
- Menu mobile dapat dibuka/tutup, fokus dan target sentuh layak.
- Hover/focus pada CTA, field, link, kartu; tidak ada animasi yang mengganggu.
- Breakpoint: mobile 320–767 px, tablet 768–1023 px, desktop >=1024 px, uji juga layar lebar.

## 6. Ruang Lingkup Tahap B — Produksi (Rencana, Bukan Implementasi Tahap A)
### 6.1 Fungsi Peserta
- Form tersambung Laravel, validasi server-side dan anti-spam.
- Konfirmasi pendaftaran dan pengaturan kuota atomik di server untuk mencegah overselling.
- Tiket/status hanya diterbitkan sesuai kebijakan konfirmasi/ pembayaran yang disetujui.
- Jika QR digunakan: kode acak yang diverifikasi server dan tidak memaparkan data pribadi.

### 6.2 Fungsi Admin
- Login berbasis session Laravel, middleware `auth`, pembatasan peran dan Policies.
- Pencarian, filter, pagination, ekspor data sesuai izin.
- Pengaturan event/kuota, audit tindakan penting, dan pembatasan akses check-in.
- Proses pembayaran belum dipilih; integrasi payment gateway tidak otomatis termasuk MVP.

### 6.3 Persyaratan Nonfungsional dan Keamanan
- HTTPS, cookie aman, CSRF, escaping output Blade, validation dan authorization server-side.
- Rate limiting pada login/registrasi dan perlindungan lapisan edge seperti Cloudflare bila diaktifkan; tidak ada klaim kebal DDoS.
- MySQL dengan akun least-privilege, backup dan pengujian restore, logging tanpa data sensitif.
- Kebijakan retensi/penghapusan data peserta serta informasi persetujuan privasi disetujui panitia.
- Tidak memasukkan kredensial ke repository, tidak menggunakan data peserta produksi dalam demo atau prompt AI.
- Akses admin dibuat melalui undangan/provisioning internal, bukan registrasi publik.

## 7. Kebutuhan Konten dari Panitia
- [ ] Nama resmi kegiatan dan penyelenggara
- [ ] Logo dan identitas acara yang boleh dipublikasikan
- [ ] Tanggal, jam, lokasi, apakah daring/luring
- [ ] Deskripsi singkat, manfaat, target peserta
- [ ] Rundown/jadwal resmi
- [ ] Kuota total dan aturan penutupan pendaftaran
- [ ] Gratis/berbayar; harga/kategori tiket bila ada
- [ ] Data pendaftaran apa yang benar-benar diperlukan
- [ ] FAQ dan aturan acara yang disahkan
- [ ] Kontak panitia, media sosial, kebijakan privasi
- [ ] Persetujuan model single-event vs multi-event (saat ini diasumsikan single-event)

## 8. Di Luar Cakupan Tahap A
Laravel, MySQL, API, autentikasi nyata, payment gateway, pengiriman email/WhatsApp, upload bukti pembayaran, penyimpanan data peserta, validasi QR sungguhan, analitik trafik produksi, sistem multi-event dan admin role provisioning. Semuanya **bukan** fitur dari GitHub Pages preview.

## 9. Struktur Frontend Preview yang Direncanakan
```text
event-frontend-preview/
├── index.html                 # Landing page
├── admin.html                 # Mock dashboard (opsional setelah landing)
├── src/
│   ├── input.css              # Tailwind + design tokens
│   └── main.js                # Mobile nav, FAQ, interaksi demo
├── public/
│   ├── images/
│   └── favicon.svg
├── dist/                      # Output publish statis
├── package.json
├── PRD.md
└── design.md
```

GitHub **repository** menyimpan source; GitHub **Pages** memublikasikan `index.html` dan aset hasil build. Gunakan Tailwind CLI/official build menghasilkan CSS statis, bukan Play CDN untuk produksi demo. Jika memakai GitHub Actions, publish hasil build `dist/`; pastikan path relatif berjalan pada URL `username.github.io/repository/`.

## 10. Milestone dan Acceptance Gates
| Milestone | Deliverable | Syarat lanjut |
|---|---|---|
| M0 — Persetujuan dokumen | PRD.md + design.md | Panitia menyepakati informasi faktual dan desain |
| M1 — Static landing | Navbar, Hero, About, Schedule, Quota/Ticket, FAQ, Footer | Semua section dan responsive lulus uji |
| M2 — Static admin mock | Layout admin, statistik dan tabel dummy | Tidak ada data real/fitur aman palsu |
| M3 — GitHub Pages preview | URL demo live | Link, aset, mobile, form demo diuji |
| M4 — Implementasi Laravel | Blade + database + autentikasi | Ditentukan setelah demo disetujui |

## 11. Risiko dan Keputusan Terbuka
- Harga, kuota, lokasi, tanggal dan contact person belum diberikan: tampilkan placeholder yang eksplisit, **jangan mengarang**.
- Model single-event belum dikonfirmasi: bila berubah menjadi multi-event, PRD dan navigasi harus direvisi.
- Form demo mudah disalahartikan sebagai pendaftaran resmi: beri penanda permanen `Preview / Belum menerima pendaftaran`.
- GitHub Pages tidak menjalankan PHP: produksi Laravel butuh hosting PHP terpisah dari Pages.
- Font, ikon yang dimuat dari layanan pihak ketiga dapat menambah ketergantungan jaringan; siapkan fallback dan evaluasi izin/lisensi aset.

## 12. Referensi Teknis
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- Tailwind CLI: https://tailwindcss.com/docs/installation/tailwind-cli
- Iconify Web Component: https://iconify.design/docs/iconify-icon/
- Laravel: https://laravel.com/docs/13.x
