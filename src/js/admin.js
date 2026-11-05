// admin.js: Dashboard interactions (vanilla JS, no frameworks)

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initSidebar();
  initParticipants();
  initCheckinMock();
});

// --- Sidebar Navigation ---

function initNav() {
  const navItems = document.querySelectorAll('[data-nav]');
  const views = document.querySelectorAll('[data-view]');
  const topbarTitle = document.getElementById('topbar-title');

  const viewTitles = {
    overview: 'Overview',
    participants: 'Peserta',
    tickets: 'Tiket',
    checkin: 'Check-in',
    settings: 'Pengaturan',
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.nav;

      navItems.forEach(n => { n.classList.remove('active'); n.removeAttribute('aria-current'); });
      item.classList.add('active');
      item.setAttribute('aria-current', 'page');

      views.forEach(v => {
        if (v.dataset.view === target) {
          v.classList.remove('hidden');
        } else {
          v.classList.add('hidden');
        }
      });

      if (topbarTitle) topbarTitle.textContent = viewTitles[target] || target;

      // Mobile: close drawer after nav
      closeSidebar();
    });
  });
}

function initSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (!toggle || !sidebar) return;
  const setInert = () => { sidebar.inert = window.innerWidth < 1024 && sidebar.classList.contains('-translate-x-full'); };
  setInert();
  window.addEventListener('resize', setInert);

  toggle.addEventListener('click', () => {
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
    setInert();
  });

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
    if (e.key !== 'Tab' || sidebar.classList.contains('-translate-x-full') || window.innerWidth >= 1024) return;
    const focusables = [...sidebar.querySelectorAll('a[href], button')];
    if (e.shiftKey && document.activeElement === focusables[0]) { e.preventDefault(); focusables.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === focusables.at(-1)) { e.preventDefault(); focusables[0].focus(); }
  });
}

function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar) return;
  sidebar.inert = false;
  sidebar.classList.remove('-translate-x-full');
  if (toggle) toggle.setAttribute('aria-expanded', 'true');
  if (overlay) overlay.classList.remove('hidden');
  sidebar.querySelector('[data-nav].active')?.focus();
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar) return;
  if (window.innerWidth >= 1024) return;
  const wasOpen = !sidebar.classList.contains('-translate-x-full');
  sidebar.classList.add('-translate-x-full');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
  if (overlay) overlay.classList.add('hidden');
  if (wasOpen) toggle?.focus();
  sidebar.inert = true;
}

// --- Participants Search & Filter ---

function initParticipants() {
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const tbody = document.getElementById('participants-tbody');
  const noResults = document.getElementById('no-results');
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll('tr'));

  function filter() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const status = statusFilter?.value || '';
    let visibleCount = 0;

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const matchText = !q || text.includes(q);

      const badge = row.querySelector('.badge');
      const badgeText = badge ? badge.textContent.trim().toLowerCase() : '';
      let rowStatus = '';
      if (badgeText.includes('sudah')) rowStatus = 'checked-in';
      else if (badgeText.includes('belum')) rowStatus = 'not-checked-in';

      const matchStatus = !status || rowStatus === status;
      const visible = matchText && matchStatus;

      row.style.display = visible ? '' : 'none';
      if (visible) visibleCount++;
    });

    if (noResults) {
      noResults.classList.toggle('hidden', visibleCount > 0);
    }
  }

  if (searchInput) searchInput.addEventListener('input', filter);
  if (statusFilter) statusFilter.addEventListener('change', filter);
}

// --- Check-in Mock Interactive States ---

function initCheckinMock() {
  const displayBox = document.getElementById('checkin-state-display');
  const stateIcon = document.getElementById('state-icon');
  const stateTitle = document.getElementById('state-title');
  const stateDesc = document.getElementById('state-desc');
  const stateBtns = document.querySelectorAll('[data-state-btn]');
  const manualInput = document.getElementById('manual-code');
  const btnManualCheckin = document.getElementById('btn-mock-checkin');

  if (!displayBox || !stateIcon || !stateTitle || !stateDesc) return;

  const states = {
    success: {
      title: 'Check-in Berhasil',
      desc: 'Ahmad Fauzi · NWDS-7K9P-M2X4 · Check-in pada 24 Okt 08:15 WIB',
      icon: 'solar:check-circle-bold',
      iconClass: 'text-success',
      boxClass: 'bg-brand-mint/30 border-brand-mint'
    },
    duplicate: {
      title: 'Tiket Sudah Digunakan (ALREADY_USED)',
      desc: 'Tiket NWDS-7K9P-M2X4 telah check-in sebelumnya pada 08:15 WIB oleh Meja Registrasi 1.',
      icon: 'solar:danger-triangle-bold',
      iconClass: 'text-warning',
      boxClass: 'bg-warning/15 border-warning/40'
    },
    invalid: {
      title: 'Kode Tiket Tidak Valid (INVALID_CODE)',
      desc: 'Kode tidak terdaftar dalam database peserta resmi NWDS 2026. Periksa kembali pengetikan.',
      icon: 'solar:close-circle-bold',
      iconClass: 'text-danger',
      boxClass: 'bg-danger/10 border-danger/30'
    },
    permission: {
      title: 'Izin Akses Kamera Dibutuhkan',
      desc: 'Browser membutuhkan izin kamera untuk memindai barcode. Klik "Allow" pada dialog peramban.',
      icon: 'solar:camera-minimalistic-bold',
      iconClass: 'text-brand-primary-dark',
      boxClass: 'bg-brand-lilac/40 border-brand-lilac'
    },
    network: {
      title: 'Koneksi Terputus / Gangguan Layanan',
      desc: 'Gagal menghubungi server registrasi. Periksa koneksi internet perangkat lalu coba lagi.',
      icon: 'solar:cloud-cross-bold',
      iconClass: 'text-muted',
      boxClass: 'bg-canvas border-line'
    }
  };

  function applyState(key) {
    const s = states[key];
    if (!s) return;

    displayBox.className = `p-4 rounded-2xl flex items-start gap-3 border ${s.boxClass}`;
    stateIcon.setAttribute('icon', s.icon);
    stateIcon.className = `${s.iconClass} flex-shrink-0 mt-0.5`;
    stateTitle.textContent = s.title;
    stateDesc.textContent = s.desc;
  }

  stateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const stateKey = btn.getAttribute('data-state-btn');
      applyState(stateKey);
    });
  });

  if (btnManualCheckin && manualInput) {
    btnManualCheckin.addEventListener('click', () => {
      const code = manualInput.value.trim().toUpperCase();
      if (!code) {
        applyState('invalid');
        stateTitle.textContent = 'Masukkan Kode Tiket Terlebih Dahulu';
        stateDesc.textContent = 'Field kode tiket tidak boleh kosong.';
        return;
      }
      if (code === 'NWDS-7K9P-M2X4' || code.includes('7K9P')) {
        applyState('duplicate');
      } else if (code.startsWith('NWDS-') && code.length >= 10) {
        applyState('success');
        stateTitle.textContent = 'Check-in Berhasil (Simulasi)';
        stateDesc.textContent = `Kode: ${code} berhasil diverifikasi untuk kehadiran.`;
      } else {
        applyState('invalid');
      }
    });
  }
}


