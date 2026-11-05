/**
 * Input validation helpers for registration and check-in payloads.
 * All validation is pure (no I/O) so it can be used in both Vercel Functions
 * and in unit tests without side effects.
 */

// Allowed characters for ticket code (excludes 0,O,1,I to prevent visual ambiguity)
const TICKET_CODE_RE = /^NWDS-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

// Accepts 08xxx or 628xxx, normalises to 628xxx
const WA_RAW_RE = /^(0|62)(\d{8,13})$/;

export function validateRegistration(body) {
  const errors = {};

  // Honeypot field — silent reject if present and non-empty
  if (body._hp) return { valid: false, errors: { _hp: 'invalid' }, honeypot: true };

  // nama
  const nama = typeof body.nama === 'string' ? body.nama.trim() : '';
  if (!nama) errors.nama = 'Nama wajib diisi';
  else if (nama.length < 3) errors.nama = 'Nama minimal 3 karakter';
  else if (nama.length > 70) errors.nama = 'Nama maksimal 70 karakter';
  // Block formula injection: GAS will also re-check, but fail fast here too
  else if (/^[=+\-@|]/.test(nama)) errors.nama = 'Format nama tidak valid';

  // email
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) errors.email = 'Email wajib diisi';
  else if (!EMAIL_RE.test(email)) errors.email = 'Format email tidak valid';
  else if (email.length > 100) errors.email = 'Email terlalu panjang';

  // whatsapp — normalise 08xxx → 628xxx
  const waRaw = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '';
  let whatsapp = '';
  if (!waRaw) {
    errors.whatsapp = 'Nomor WhatsApp wajib diisi';
  } else {
    const m = waRaw.match(WA_RAW_RE);
    if (!m) errors.whatsapp = 'Format nomor WhatsApp tidak valid (08xxx atau 628xxx)';
    else {
      whatsapp = '62' + m[2];
      if (whatsapp.length < 10 || whatsapp.length > 15) {
        errors.whatsapp = 'Panjang nomor WhatsApp tidak valid';
      }
    }
  }

  // privacyConsent
  if (body.privacyConsent !== true) errors.privacyConsent = 'Persetujuan privasi wajib dicentang';

  // clientRequestId (UUIDv4)
  const clientRequestId = typeof body.clientRequestId === 'string' ? body.clientRequestId : '';
  if (!UUID_RE.test(clientRequestId)) errors.clientRequestId = 'clientRequestId tidak valid (harus UUID v4)';

  if (Object.keys(errors).length > 0) return { valid: false, errors };

  return {
    valid: true,
    sanitized: { nama, email, whatsapp, privacyConsent: true, clientRequestId },
  };
}

export function validateCheckin(body) {
  const errors = {};

  const ticketCode = typeof body.ticketCode === 'string' ? body.ticketCode.trim().toUpperCase() : '';
  if (!ticketCode) errors.ticketCode = 'Kode tiket wajib diisi';
  else if (!TICKET_CODE_RE.test(ticketCode)) errors.ticketCode = 'Format kode tiket tidak valid';

  const method = typeof body.method === 'string' ? body.method.toUpperCase() : '';
  if (!['SCAN', 'MANUAL'].includes(method)) errors.method = 'Method harus SCAN atau MANUAL';

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, sanitized: { ticketCode, method } };
}
