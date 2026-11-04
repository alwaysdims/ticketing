# Nusantara Web & Design Summit 2026 - Frontend Preview

Frontend statis untuk presentasi desain dan pengujian alur antarmuka sebelum backend dikembangkan. Seluruh interaksi antarmuka bekerja secara lokal tanpa ketergantungan API backend.

## Menjalankan Lokal

1. `npm install`
2. `npm run dev` menjalankan pengawasan source dan menyajikan server lokal di `http://127.0.0.1:4173/`.
3. `npm run build` menghasilkan output produksi ke `dist/` sekaligus menyinkronkan aset runtime ke root untuk deployment langsung.
4. `npm run preview` menyajikan hasil build statis di `http://127.0.0.1:4173/` (halaman utama) dan `http://127.0.0.1:4173/admin/` (dashboard admin).

## Publikasi ke GitHub Pages

Proyek ini siap dipublikasikan ke GitHub Pages melalui dua metode:

### Metode 1: Deploy dari Branch Main (Root)
1. Inisialisasi git dan push seluruh file proyek ke repository GitHub Anda pada branch `main`.
2. Buka repository di GitHub: **Settings** -> **Pages**.
3. Pada **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. Klik **Save**. Halaman utama `index.html` dan `admin/index.html` akan langsung aktif dengan seluruh stylesheet, font, dan ikon lokal.

### Metode 2: Deploy Otomatis via GitHub Actions
File workflow `.github/workflows/pages.yml` sudah tersedia.
1. Di GitHub: **Settings** -> **Pages** -> **Source**: `GitHub Actions`.
2. Setiap kali ada commit ke branch `main`, GitHub Actions akan otomatis menjalankan build dan menerbitkan folder `dist/`.

## Struktur Proyek

- `index.html`: Halaman utama landing page publik (Navbar, Hero, Tentang, Jadwal, Kuota & Tiket, FAQ, Footer).
- `admin/index.html`: Dashboard admin percontohan (Overview, Peserta, Tiket, Check-in, Pengaturan).
- `css/style.css`: Stylesheet terkompilasi Tailwind CSS v4 untuk runtime root.
- `fonts/`: Berkas font woff2 lokal Plus Jakarta Sans.
- `js/`: Skrip interaksi antarmuka dan bundle ikon SVG offline.
- `data/demo-data.js`: Data percontohan jadwal, peserta, dan statistik.
- `src/`: Berkas sumber pengembangan (Tailwind input CSS, JS mentah, dataset).
- `dist/`: Berkas hasil kompilasi bersih untuk deployment statis.
- `scripts/`: Skrip otomasi kompilasi Tailwind, ekstraksi ikon SVG offline, dan server preview.
