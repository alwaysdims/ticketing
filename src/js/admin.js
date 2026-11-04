// admin.js: Dashboard interactions (vanilla JS, no frameworks)
// All views rendered from static HTML. No imports, no module.

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initSidebar();
  initParticipants();
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

// --- Mobile Sidebar Drawer ---

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
    const q = (searchInput?.value || '').toLowerCase();
    const status = statusFilter?.value || '';
    let visibleCount = 0;

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const matchText = !q || text.includes(q);

      const badge = row.querySelector('.badge');
      const badgeText = badge ? badge.textContent.trim().toLowerCase() : '';
      let rowStatus = '';
      if (badgeText.includes('terkonfirmasi')) rowStatus = 'confirmed';
      else if (badgeText.includes('menunggu')) rowStatus = 'pending';
      else if (badgeText.includes('check-in')) rowStatus = 'checked-in';

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
