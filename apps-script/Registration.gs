function registerParticipant_(data) {
  var input = validateRegistration_(data);
  var config = getConfig_();
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = participantSheet_();
    var rows = sheet.getDataRange().getValues();

    var idempotency = findIdempotency_(input.clientRequestId);
    var requestHash = hashText_(JSON.stringify({ nama: input.nama, email: input.email, whatsapp: input.whatsapp }));
    if (idempotency) {
      if (idempotency.requestHash !== requestHash) throw appError_('INVALID_REQUEST', 422);
      if (idempotency.status === 'REGISTERED') return {
        status: 'ALREADY_PROCESSED', ticketCode: idempotency.ticketCode,
        nama: idempotency.nama, registeredAt: idempotency.registeredAt,
        eventName: 'Nusantara Web & Design Summit 2026'
      };
      if (idempotency.status === 'IN_PROGRESS') {
        var recovered = findParticipantByRequestId_(input.clientRequestId);
        if (recovered) return { status: 'ALREADY_PROCESSED', ticketCode: recovered.ticketCode, nama: recovered.nama, registeredAt: recovered.registeredAt, eventName: 'Nusantara Web & Design Summit 2026' };
        input.ticketCode = idempotency.ticketCode;
      }
    }

    if (Math.max(0, rows.length - 1) >= config.maxParticipants) throw appError_('QUOTA_EXCEEDED', 410);

    for (var i = 1; i < rows.length; i++) {
      var email = String(rows[i][2]).toLowerCase();
      var whatsapp = String(rows[i][3]);
      if (email === input.email || whatsapp === input.whatsapp) throw appError_('ALREADY_REGISTERED', 409);
    }

    var ticketCode = input.ticketCode;
    if (!/^NWDS-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(ticketCode)) throw appError_('INVALID_REQUEST', 400);
    if (ticketExists_(rows, ticketCode)) throw appError_('TICKET_COLLISION', 409);

    var registeredAt = nowIso_();
    idempotencySheet_().appendRow([input.clientRequestId, requestHash, 'IN_PROGRESS', ticketCode, registeredAt, input.nama]);
    var row = [ticketCode, safeSheetText_(input.nama), safeSheetText_(input.email), input.whatsapp,
      registeredAt, 'NOT_CHECKED_IN', '', input.clientRequestId];
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]);

    var saved = sheet.getRange(sheet.getLastRow(), 1, 1, row.length).getDisplayValues()[0];
    if (saved[0] !== ticketCode || saved[3] !== input.whatsapp) throw appError_('INTERNAL_ERROR', 500);
    idempotencySheet_().appendRow([input.clientRequestId, requestHash, 'REGISTERED', ticketCode, registeredAt, input.nama]);
    return { status: 'REGISTERED', ticketCode: ticketCode, nama: input.nama, registeredAt: registeredAt, eventName: 'Nusantara Web & Design Summit 2026' };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function validateRegistration_(data) {
  if (!data || typeof data !== 'object') throw appError_('INVALID_REQUEST', 400);
  var nama = normalizeText_(data.nama);
  var email = normalizeText_(data.email).toLowerCase();
  var whatsapp = normalizeWhatsapp_(data.whatsapp);
  if (nama.length < 3 || nama.length > 70 || startsFormula_(nama)) throw appError_('INVALID_REQUEST', 400);
  if (!/^[^\s@]{1,64}(@)[^\s@]{1,255}\.[^\s@]{2,}$/.test(email) || email.length > 100 || startsFormula_(email)) throw appError_('INVALID_REQUEST', 400);
  if (!whatsapp || whatsapp.length < 10 || whatsapp.length > 15) throw appError_('INVALID_REQUEST', 400);
  if (data.privacyConsent !== true || !isUuidV4_(String(data.clientRequestId))) throw appError_('INVALID_REQUEST', 400);
  if (typeof data.ticketCode !== 'string') throw appError_('INVALID_REQUEST', 400);
  return { nama: nama, email: email, whatsapp: whatsapp, clientRequestId: String(data.clientRequestId), ticketCode: data.ticketCode };
}

function normalizeText_(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeWhatsapp_(value) {
  var raw = normalizeText_(value);
  if (!/^(0|62)\d{8,13}$/.test(raw)) return '';
  return raw.indexOf('0') === 0 ? '62' + raw.slice(1) : raw;
}

function startsFormula_(value) { return /^[=+\-@|]/.test(value); }
function safeSheetText_(value) { return startsFormula_(value) ? "'" + value : value; }
function ticketExists_(rows, code) { return rows.slice(1).some(function(row) { return String(row[0]) === code; }); }
function hashText_(value) { return bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8)); }
function findIdempotency_(clientRequestId) {
  var rows = idempotencySheet_().getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) if (String(rows[i][0]) === clientRequestId) return {
    requestHash: String(rows[i][1]), status: String(rows[i][2]), ticketCode: String(rows[i][3]), registeredAt: String(rows[i][4]), nama: String(rows[i][5] || '')
  };
  return null;
}

function findParticipantByRequestId_(clientRequestId) {
  var rows = participantSheet_().getDataRange().getDisplayValues();
  for (var i = 1; i < rows.length; i++) if (rows[i][7] === clientRequestId) return {
    ticketCode: rows[i][0], nama: rows[i][1], registeredAt: rows[i][4]
  };
  return null;
}
