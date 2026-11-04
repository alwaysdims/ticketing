// Data percontohan untuk pratinjau antarmuka acara.

export const DEMO_SCHEDULE = [
  {
    waktu: '08:30',
    judul: 'Registrasi & Morning Coffee Networking',
    deskripsi: 'Pengambilan kit peserta, name tag, dan sesi ramah tamah di lobi utama.',
    lokasi: 'Foyer Gedung Sabuga',
  },
  {
    waktu: '09:15',
    judul: 'Keynote: Tren Arsitektur Frontend & Performa Web 2026',
    deskripsi: 'Pemaparan strategi optimasi Core Web Vitals, modular bundle, dan standar web modern oleh Rian Pratama (Engineering Director).',
    lokasi: 'Auditorium Utama',
  },
  {
    waktu: '10:15',
    judul: 'Panel Diskusi: Mengelola Design System Skala Besar',
    deskripsi: 'Pembahasan sinkronisasi token desain, aksesibilitas komponen, dan tata kelola pustaka UI bersama Maya Lestari dan tim perancang.',
    lokasi: 'Stage Utama',
  },
  {
    waktu: '11:45',
    judul: 'Istirahat, Makan Siang & Community Showcase',
    deskripsi: 'Makan siang bersama serta pameran proyek kreatif dan open source buatan komunitas digital lokal.',
    lokasi: 'Plaza & Exhibition Hall',
  },
  {
    waktu: '13:00',
    judul: 'Workshop Praktik: Tailwind v4 & Aksesibilitas WCAG',
    deskripsi: 'Sesi praktik langsung membangun antarmuka web yang cepat, responsif, dan ramah pembaca layar (screen reader).',
    lokasi: 'Lab Komputer A & B',
  },
  {
    waktu: '15:15',
    judul: 'Tanya Jawab Praktisi & Sesi Berbagi Pengalaman',
    deskripsi: 'Diskusi terbuka mengenai tantangan rekayasa teknologi dan studi kasus penerapan sistem di dunia kerja.',
    lokasi: 'Auditorium Utama',
  },
  {
    waktu: '16:30',
    judul: 'Penutupan Acara, Doorprize & Foto Bersama',
    deskripsi: 'Rangkuman kegiatan, pembagian kenang-kenangan komunitas, dan dokumentasi bersama seluruh peserta.',
    lokasi: 'Main Stage',
  },
];

export const DEMO_PARTICIPANTS = [
  { nama: 'Ahmad Fauzi', email: 'ahmad.fauzi@mail.com', kode: 'NWDS-0821', status: 'confirmed', waktu: '2026-10-24 08:15' },
  { nama: 'Siti Nurhaliza', email: 'siti.n@techcorp.id', kode: 'NWDS-0822', status: 'confirmed', waktu: '2026-10-24 08:22' },
  { nama: 'Budi Santoso', email: 'budi.santoso@startup.co.id', kode: 'NWDS-0823', status: 'pending', waktu: '2026-10-24 08:35' },
  { nama: 'Rina Wulandari', email: 'rina.w@designlab.id', kode: 'NWDS-0824', status: 'confirmed', waktu: '2026-10-24 08:42' },
  { nama: 'Dimas Prasetyo', email: 'dimas.p@digital.io', kode: 'NWDS-0825', status: 'checked-in', waktu: '2026-10-24 08:50' },
  { nama: 'Dewi Anggraini', email: 'dewi.ang@agency.net', kode: 'NWDS-0826', status: 'pending', waktu: '2026-10-24 09:05' },
  { nama: 'Fajar Nugraha', email: 'fajar.nugraha@dev.id', kode: 'NWDS-0827', status: 'confirmed', waktu: '2026-10-24 09:12' },
  { nama: 'Anisa Rahmawati', email: 'anisa.r@creative.org', kode: 'NWDS-0828', status: 'checked-in', waktu: '2026-10-24 09:18' },
];

export const DEMO_FAQ = [
  {
    pertanyaan: 'Siapa saja yang dapat mengikuti konferensi ini?',
    jawaban: 'Acara ini terbuka untuk mahasiswa, software engineer, desainer UI/UX, product manager, dan penggiat industri digital yang tertarik dengan pengembangan web modern.',
  },
  {
    pertanyaan: 'Di mana lokasi kegiatan dilaksanakan?',
    jawaban: 'Bertempat di Sasana Budaya Ganesha (Sabuga ITB), Jl. Tamansari No. 73, Kota Bandung. Akses parkir tersedia dan dekat dengan transportasi umum.',
  },
  {
    pertanyaan: 'Berapa biaya tiket dan apa saja fasilitas yang didapatkan?',
    jawaban: 'Tiket reguler Rp175.000 mencakup seluruh sesi seminar, akses workshop praktik, snack pagi, lunch box, merchandise kit, dan sertifikat digital resmi.',
  },
  {
    pertanyaan: 'Bagaimana alur pendaftaran peserta?',
    jawaban: 'Isi formulir pendaftaran di halaman utama dengan identitas aktif. Pada versi demo ini, formulir berfungsi sebagai simulasi antarmuka pendaftaran.',
  },
  {
    pertanyaan: 'Apakah peserta akan mendapatkan sertifikat?',
    jawaban: 'Ya, seluruh peserta yang hadir dan melakukan check-in di lokasi akan menerima e-certificate resmi dengan nomor seri terverifikasi.',
  },
  {
    pertanyaan: 'Apakah kuota peserta dibatasi?',
    jawaban: 'Kuota dibatasi sebanyak 300 peserta tatap muka demi kenyamanan ruang workshop dan efektivitas interaksi saat sesi praktik.',
  },
  {
    pertanyaan: 'Bagaimana cara menghubungi panitia acara?',
    jawaban: 'Panitia dapat dihubungi melalui email kontak@nusantaraweb.id atau nomor WhatsApp di +62 812-3456-7890 pada hari kerja pukul 09.00 sampai 17.00 WIB.',
  },
];

// Angka simulasi: bukan data produksi
export const DEMO_STATS = {
  totalPendaftar: 247,
  terkonfirmasi: 183,
  menunggu: 52,
  checkedIn: 12,
};
