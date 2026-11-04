# Design System & UI/UX Specification

**Proyek:** Event Registration & Ticketing Website  
**Versi:** 1.0 — Soft Claymorphism / Hybrid Clay  
**Tanggal:** 4 November 2026  
**Sasaran pertama:** Frontend statis HTML + Tailwind CSS + Iconify untuk GitHub Pages  
**Acuan visual:** screenshot ClayUI yang disetujui pengguna (referensi gaya, bukan menyalin teks/komponen/brand secara identik)

## 1. Konsep Desain
**Soft Claymorphism meets editorial clarity.** Antarmuka memakai nuansa lavender sangat muda, permukaan matte, sudut membulat, bayangan lembut, dan sedikit elevasi. Kualitas harus berasal dari hierarki, copy konkret, alignment, tipografi, dan interaksi — bukan penambahan ornamen acak.

Prinsip:
1. **Visual:** elemen clay hanya pada komponen yang pantas mendapat perhatian.
2. **Whitespace:** jarak antar-section luas dan konsisten, bukan ruang kosong tanpa tujuan.
3. **Typography:** modern, editorial, bersih; heading tegas, body mudah dibaca.
4. **Motion:** tenang dan fungsional, cepat, menghormati reduced motion.
5. **Responsive:** desain mobile-first untuk calon peserta; dashboard tetap usable di tablet.
6. **Kejujuran konten:** semua angka acara/kuota/agenda yang belum final ditandai sebagai contoh.

## 2. Warna dan Design Tokens
Satu warna primer dan dua sekunder; warna netral tidak dihitung sebagai warna brand.

| Token | Nilai | Penggunaan |
|---|---|---|
| `brand-primary` | `#8B5CF6` | CTA, ikon penting, focus accent, highlights |
| `brand-secondary-lilac` | `#F0DFF5` | Surface dekoratif lembut, lapisan cards |
| `brand-secondary-mint` | `#DDF1EB` | Info baik, aksen kategori, pelengkap visual |
| `canvas` | `#F5F2FB` | Latar belakang utama yang tenang |
| `surface` | `#FCFBFE` | Kartu, form dan popover |
| `text-primary` | `#302B38` | Heading dan teks utama |
| `text-muted` | `#66616F` | Body sekunder |
| `border` | `#E8E2EF` | Divider, input border |
| `white` | `#FFFFFF` | Teks CTA saat kontras cukup |
| `danger` | `#B4233A` | Error — warna semantik, bukan identitas |

**Catatan aksesibilitas:** warna primary `#8B5CF6` + putih perlu diuji kontras untuk teks normal. Jika gagal WCAG AA, gunakan warna ungu lebih gelap untuk tombol bertulisan putih (misalnya `#6D36D8` setelah diuji), atau teks yang lebih gelap. Warna pastel tidak dipakai sebagai warna teks pada background putih. Status harus disertai teks/ikon, tidak hanya warna.

Contoh token CSS untuk implementasi selanjutnya (bukan kode aplikasi yang sudah dibuat):
```css
@import "tailwindcss";
@theme {
  --color-brand-primary: #8B5CF6;
  --color-brand-lilac: #F0DFF5;
  --color-brand-mint: #DDF1EB;
  --color-canvas: #F5F2FB;
  --color-surface: #FCFBFE;
  --color-ink: #302B38;
  --color-muted: #66616F;
  --color-line: #E8E2EF;
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
}
```

## 3. Typography
- **Font utama:** Plus Jakarta Sans (Google Fonts atau di-host lokal dengan lisensi yang sesuai), fallback system UI.
- **Headline:** 700–800, tracking sedikit negatif, line-height 1.05–1.15.
- **Body:** 400–500, line-height 1.55–1.7.
- **Buttons/labels:** 600–700, hindari ALL CAPS berkepanjangan.
- **H1 responsif:** mobile `clamp(2.4rem, 7vw, 4.8rem)` sebagai titik awal, desktop maksimum sekitar 72–80 px sesuai lebar konten.
- **H2:** 32–48 px desktop; 28–36 px mobile.
- **Body:** 16–18 px; info pembantu minimum 14 px bila relevan.
- **Copy:** bahasa Indonesia alami dan spesifik, tanpa klaim semu, testimonial palsu, metrik fiktif yang tidak diberi label.

Style Awwwards diinterpretasikan sebagai kualitas tipografi, grid, layout dan microinteraction, **bukan** keharusan memakai animasi berlebihan atau meniru situs tertentu.

## 4. Layout, Grid & Spacing
- Mobile-first. Maksimum lebar konten utama 1200–1280 px.
- Container desktop memiliki gutter 32–48 px; tablet 24–32 px; mobile 16–20 px.
- Grid desktop 12 kolom; section ticket 5 kolom informasi + 7 kolom form (boleh 6/6 sesuai hasil tes).
- Spacing scale utama mengikuti sistem 4/8/12/16/24/32/48/64/96 px.
- Jarak antarseksi landing: mobile 64–88 px; desktop 96–144 px, sesuai densitas konten.
- Radius: input 14–18 px, button 16–22 px, card 24–32 px, hero graphic 32–40 px.
- Shadow clay lembut multilayer; jangan gunakan shadow gelap pekat atau inner-shadow tebal pada teks/form.
- Background tetap polos `#F5F2FB`; keindahan datang dari composition, kontras kartu dan whitespace. Gradient aura opsional sangat subtil pada hero, **bukan** motif besar yang membuat latar ramai.

## 5. Komponen Global
### Navbar
- Logo kiri; link tengah (About, Schedule, Tickets, FAQ); CTA/link kanan opsional pada desktop.
- Mobile: logo kiri + hamburger kanan; menu overlay yang dapat ditutup, dapat diakses keyboard.
- Link aktif diberi perubahan warna/underline yang jelas; offset anchor memperhitungkan navbar sticky.

### Buttons
- Primer: ungu dengan subtle gradient/elevation, teks kontras, radius 18–22 px.
- Sekunder: surface terang, border 1 px dan soft shadow.
- State lengkap: default, hover, active, focus-visible, disabled, loading (saat sudah ada backend).
- Minimum target sentuh 44 × 44 px jika memungkinkan.
- Animasi 150–240 ms (transform ±2 px maksimal, soft shadow adjustment), berhenti pada reduced motion.

### Cards
- Landing: clay surfaces pada hero dan highlight penting, bukan seluruh paragraf.
- Admin: clay untuk summary/statistics; tabel, filter dan form lebih flat agar padat informasi.

### Forms
- Label selalu terlihat; placeholder tidak menggantikan label.
- Input focus ring jelas; teks error dekat field dan tidak berdasarkan warna saja.
- Form tiket tahap demo selalu menunjukkan `Demo — data tidak tersimpan` dan tidak menyatakan berhasil mendaftar.

### Iconify
- Gunakan `iconify-icon` (misalnya `solar:calendar-linear`, `solar:ticket-linear`, `solar:users-group-rounded-linear`, `solar:map-point-linear`) dengan satu keluarga ikon dominan demi konsistensi; cek nama ikon tersedia saat implementasi.
- Ukuran umum 18–24 px, dekoratif sampai 32 px; pastikan `aria-hidden` pada ikon dekoratif dan label teks untuk kontrol.
- Ikon web component dapat dimuat sesuai permintaan dari Iconify API: perhatikan fallback saat jaringan gagal dan cegah layout shift dengan dimensi eksplisit.

## 6. Landing Page — Detail Section
### 6.1 Navbar
Tinggi sekitar 72–84 px desktop; mobile 64–72 px. Latar senada canvas, border/blur sangat halus bila sticky. Tidak ada navigasi yang berlebihan.

### 6.2 Hero + CTA
- Desktop dua area: copy besar kiri dan komposisi tiket/event illustration kanan; mobile copy dulu lalu ilustrasi.
- Micro eyebrow kecil untuk kategori acara (bila ada), H1 nama/tema acara, deskripsi 1–2 kalimat, info tanggal & lokasi, CTA primer `Daftar Sekarang` ke `#tickets`.
- CTA sekunder opsional `Lihat Jadwal` ke `#schedule`.
- Visual kanan: satu hero card clay kualitas tinggi dan sedikit floating chips **yang memiliki makna**, tidak meniru kartu Premium Plan dari referensi SaaS.
- Tanpa badge testimonial, angka peserta, atau ratings palsu.

### 6.3 About
- Judul informatif, paragraf ringkas, 2–3 manfaat konkret bila informasi tersedia.
- Komposisi asimetris rapi; gunakan visual penyelenggara/acara yang berlisensi jika diberikan.
- Tidak menambahkan ilustrasi dekoratif generik tanpa relevansi.

### 6.4 Schedule
- Agenda timeline vertikal yang mudah diikuti pada mobile; desktop bisa berupa timeline/rows dua kolom.
- Setiap sesi: waktu, judul, deskripsi maksimal 1–2 baris, lokasi/pemateri hanya bila ada data resmi.
- Gunakan hierarchy waktu yang kuat; tidak menambahkan jadwal rekaan tanpa label contoh.

### 6.5 Quota & Tickets
**Desktop:** panel informasi kiri (~40–45%), panel form kanan (~55–60%).
- **Kiri:** heading kuota, total/tersedia (jika data nyata), badge jenis tiket/biaya, deadline, catatan aturan. Pada demo angka harus dummy dan diberi label; progres bar juga contoh.
- **Kanan:** card putih/clay ringan dengan form nama, email, WhatsApp dan field tambahan hanya jika diperlukan; checkbox persetujuan jika ada kebijakan yang dapat dirujuk.
- Demo submit disabled atau memunculkan dialog jelas `Ini hanya pratinjau. Data tidak disimpan.`; **tidak** ada simulasi tiket valid yang bisa disalahgunakan.
- **Mobile:** kiri di atas, form di bawah; setiap input selebar panel, tombol penuh.

### 6.6 FAQ
Accordion 1 kolom, maksimal 6–8 pertanyaan relevan. Ada visual expand/collapse, mendukung keyboard dan ARIA. Pertanyaan dasar: siapa bisa ikut, lokasi, biaya, kuota, cara mendaftar, konfirmasi, perubahan data, kontak.

### 6.7 Footer
3–4 kelompok: identitas/ringkasan event, navigasi, kontak panitia, media sosial; di bagian bawah penyelenggara/copyright. Kontak dan tautan yang belum diberikan ditandai placeholder, tidak ditautkan ke akun fiktif.

## 7. Dashboard Admin — Hybrid Clay
- **Layout desktop:** sidebar kiri 232–264 px, content area dengan topbar; mobile sidebar menjadi drawer.
- **Sidebar:** Overview, Participants, Tickets, Check-in, Settings; item aktif jelas.
- **Overview:** maksimal empat KPI clay, panel distribusi status yang minimalis, tabel registrasi terbaru dan quick actions seperlunya.
- **Participants:** toolbar search, status filter, table dengan header jelas dan row height nyaman; mobile gunakan horizontal scroll terkontrol atau card-list.
- **Tickets:** manajemen tiket/status pada tahap produksi; tahap demo menampilkan contoh dengan label.
- **Check-in:** tampilan konseptual pada demo, nantinya akses kamera harus meminta izin dan validasi dilakukan server.
- **Settings:** hanya UI konsep di demo; form produksi tunduk pada role admin.
- **Color semantics:** status sukses gunakan teks + simbol, pending dengan label eksplisit, error dengan pesan; status tidak berdasarkan pastel saja.
- **Tidak memakai clay berlebihan** untuk tabel panjang, alert, input padat atau latar menu.

## 8. Motion & Microinteractions
- Hover tombol: transisi 160–220 ms, perubahan elevasi dan mungkin translateY(-1px).
- Reveal on scroll: opsional 250–450 ms dengan opacity/translate kecil; hindari semua elemen muncul berurutan lambat.
- FAQ accordion: respons cepat; tidak membuat perubahan layout yang mengganggu fokus.
- Menghormati `prefers-reduced-motion` untuk semua efek non-esensial.
- Tidak menggunakan parallax berat, custom cursor, autoplay video, atau ambient animation terus-menerus.

## 9. Accessibility & Performance
- Target WCAG 2.2 AA untuk kontras, keyboard navigation, label form dan focus state.
- Gunakan HTML semantik: `header`, `nav`, `main`, `section`, `form`, `footer`; satu H1, urutan heading benar.
- Foto/ilustrasi nyata memiliki alt deskriptif; elemen murni dekoratif disembunyikan dari pembaca layar.
- Layout responsif tanpa horizontal overflow pada 320 px.
- Font loading terkontrol dan fallback, ikon diberi ukuran tetap untuk menghindari layout shift.
- Hindari dependency JS besar. Optimalkan gambar dan gunakan lazy-loading yang tidak mengganggu LCP hero.
- Uji manual keyboard dan mobile; audit Lighthouse digunakan sebagai sinyal, bukan pengganti QA manusia.

## 10. Static Preview Build & Publish
- Tailwind CSS versi stabil melalui **Tailwind CLI** (`tailwindcss` + `@tailwindcss/cli`). `npm run build` menghasilkan stylesheet untuk file HTML.
- JavaScript vanilla untuk menu/FAQ/modal demo; tidak memakai React, tidak memakai Laravel pada Tahap A.
- Iconify melalui web component; evaluasi penggunaan paket lokal agar tidak bergantung pada script CDN bila diperlukan.
- `index.html` harus berada di root output publik, dan semua URL asset menggunakan path yang kompatibel dengan project GitHub Pages, misalnya `./assets/...` bukan selalu `/assets/...`.
- GitHub Pages hanya untuk frontend statis; source private/secret tidak ditaruh di client-side.
- Setelah persetujuan, layout dan token dapat dipindahkan ke Blade components, `resources/css/app.css`, `resources/js/app.js`, lalu di-build melalui Laravel Vite. HTML statis **tidak** otomatis menjadi Blade; perlu migrasi markup yang direncanakan.

## 11. Quality Checklist (Sebelum Presentasi ke Panitia)
- [ ] Urutan section persis: Navbar → Hero/CTA → About → Schedule → Quota & Tickets → FAQ → Footer.
- [ ] Palet soft dan satu primer dua sekunder konsisten.
- [ ] Heading kuat, teks natural, spacing rapi, ilustrasi relevan.
- [ ] Hero punya CTA jelas yang mengarah ke form tiket.
- [ ] Section tiket desktop dua kolom: informasi kiri, form kanan.
- [ ] Landing dan dashboard responsive; nav mobile dapat digunakan.
- [ ] Tidak ada data pribadi asli, testimonial palsu, harga dan jadwal rekaan tanpa label.
- [ ] Form demo tidak mengirim data dan menyatakan belum aktif.
- [ ] Tidak ada console error, broken image, tautan mati, overflow, atau layout shift mencolok.
- [ ] Kontras, tab order, focus, label, dan reduced motion sudah diuji.

## 12. Hal yang Masih Menunggu Persetujuan
Nama event, konten riil, tanggal/lokasi, harga, kuota, formulir final, nama brand, logo, foto, kontak panitia, kebijakan privasi, serta model single vs multi event. Sampai disetujui, gunakan placeholder **jelas bertanda contoh**.

## 13. Referensi Teknis
- Tailwind CSS: https://tailwindcss.com/docs/installation/tailwind-cli
- Iconify: https://iconify.design/docs/iconify-icon/
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
