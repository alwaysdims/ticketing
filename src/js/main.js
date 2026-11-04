// main.js: Landing page interactions (vanilla ES module, no exports)
// Runs all setup on DOMContentLoaded.

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initFaqAccordion();
  initFormValidation();
  initNavActiveState();
  initStickyNavbar();
});

// ─── 1. Mobile Navigation Toggle ────────────────────────────────────────────

function initMobileNav() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  const focusableSelector = 'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])';

  function open() {
    menu.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Tutup menu navigasi');
    // Focus first link inside menu
    const first = menu.querySelector(focusableSelector);
    if (first) first.focus();
  }

  function close(restoreFocus = true) {
    menu.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Buka menu navigasi');
    if (restoreFocus) btn.focus();
  }

  function isOpen() {
    return !menu.classList.contains('hidden');
  }

  btn.addEventListener('click', () => {
    isOpen() ? close() : open();
  });

  // Close when clicking a nav link inside menu
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a[href]')) close(false);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });

  window.matchMedia('(min-width: 768px)').addEventListener('change', event => {
    if (event.matches && isOpen()) close(false);
  });

  // Focus trap inside open menu
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !isOpen()) return;
    const focusable = [...menu.querySelectorAll(focusableSelector)];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

// ─── 2. FAQ Accordion ───────────────────────────────────────────────────────

function initFaqAccordion() {
  const triggers = document.querySelectorAll('[data-faq-trigger]');
  if (!triggers.length) return;

  const reducedMotion = prefersReducedMotion.matches;
  triggers.forEach((trigger, index) => {
    const content = trigger.nextElementSibling;
    content.id = `faq-answer-${index + 1}`;
    trigger.setAttribute('aria-controls', content.id);
  });

  function closeAll(except) {
    triggers.forEach((t) => {
      if (t === except) return;
      const content = t.nextElementSibling;
      if (!content || !content.hasAttribute('data-faq-content')) return;
      t.setAttribute('aria-expanded', 'false');
      content.hidden = true;
      content.style.maxHeight = null;
    });
  }

  function toggle(trigger) {
    const content = trigger.nextElementSibling;
    if (!content || !content.hasAttribute('data-faq-content')) return;

    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

    // Close others first (single-open accordion)
    closeAll(trigger);

    if (isExpanded) {
      trigger.setAttribute('aria-expanded', 'false');
      content.hidden = true;
      content.style.maxHeight = null;
    } else {
      trigger.setAttribute('aria-expanded', 'true');
      content.hidden = false;
      content.style.maxHeight = reducedMotion ? 'none' : `${content.scrollHeight}px`;
    }
  }

  triggers.forEach((trigger) => {
    // Set initial ARIA state
    trigger.setAttribute('aria-expanded', 'false');
    const content = trigger.nextElementSibling;
    if (content && content.hasAttribute('data-faq-content')) {
      content.hidden = true;
      content.style.maxHeight = null;
      if (!reducedMotion) {
        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 0.3s ease';
      }
    }

    trigger.addEventListener('click', () => toggle(trigger));

    // Keyboard: Enter/Space
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(trigger);
      }
    });
  });
}

// ─── 4. Demo Form Validation ────────────────────────────────────────────────

function initFormValidation() {
  const form = document.getElementById('demo-form');
  if (!form) return;

  const validators = {
    nama: (v) => {
      if (!v.trim()) return 'Nama wajib diisi';
      if (v.trim().length < 3) return 'Nama minimal 3 karakter';
      return '';
    },
    email: (v) => {
      if (!v.trim()) return 'Email wajib diisi';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Format email tidak valid';
      return '';
    },
    whatsapp: (v) => {
      if (!v.trim()) return 'Nomor WhatsApp wajib diisi';
      if (!/^\d+$/.test(v.trim())) return 'Nomor WhatsApp harus berupa angka';
      if (v.trim().length < 10) return 'Nomor WhatsApp minimal 10 digit';
      return '';
    },
  };

  function showError(name, msg) {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input) return;
    const errorEl = input.parentElement.querySelector('.field-error');
    if (!errorEl) return;
    if (msg) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
      input.setAttribute('aria-invalid', 'true');
    } else {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
      input.removeAttribute('aria-invalid');
    }
    input.classList.toggle('input-error', Boolean(msg));
    input.setAttribute('aria-describedby', errorEl.id);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    for (const [name, validate] of Object.entries(validators)) {
      const input = form.querySelector(`[name="${name}"]`);
      const msg = validate(input ? input.value : '');
      showError(name, msg);
      if (msg) valid = false;
    }

    if (!valid) {
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    // Show preview modal: no data stored
    const modal = document.getElementById('demo-modal');
    if (!modal) return;
    openModal(modal);
  });
}

// ─── Modal helpers ──────────────────────────────────────────────────────────

let modalTrigger;
function openModal(modal) {
  modalTrigger = document.activeElement;
  modal.classList.remove('hidden');
  const closeBtn = modal.querySelector('#modal-close');
  if (closeBtn) closeBtn.focus();

  // Close handlers (stored on element for cleanup)
  function onKey(e) {
    if (e.key === 'Escape') closeModal(modal);
    if (e.key === 'Tab') {
      const focusables = [...modal.querySelectorAll('button, a[href], input, select')];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function onBackdrop(e) {
    if (e.target === modal) closeModal(modal);
  }

  modal._cleanup = () => {
    document.removeEventListener('keydown', onKey);
    modal.removeEventListener('click', onBackdrop);
  };

  document.addEventListener('keydown', onKey);
  modal.addEventListener('click', onBackdrop);

  modal.querySelector('#modal-close').onclick = () => closeModal(modal);
  document.getElementById('modal-backdrop').onclick = () => closeModal(modal);
}

function closeModal(modal) {
  modal.classList.add('hidden');
  modalTrigger?.focus();
  if (modal._cleanup) {
    modal._cleanup();
    modal._cleanup = null;
  }
}

// ─── 5. Navbar Active State (IntersectionObserver) ──────────────────────────

function initNavActiveState() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      });
    },
    { rootMargin: '-20% 0px -60% 0px' }
  );

  sections.forEach((s) => observer.observe(s));
}

// ─── 6. Sticky Navbar (.scrolled class) ─────────────────────────────────────

function initStickyNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function update() {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }

  window.addEventListener('scroll', update, { passive: true });
  update(); // initial check
}


