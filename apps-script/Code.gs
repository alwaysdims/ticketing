function doPost(e) {
  var requestId = 'unknown';
  try {
    var envelope = parseEnvelope_(e);
    requestId = envelope.nonce;
    var payload = verifyEnvelope_(envelope);
    var result = dispatchAction_(payload.action, payload.data);
    return jsonResponse_({ ok: true, requestId: requestId, result: result });
  } catch (error) {
    var code = error.code || 'INTERNAL_ERROR';
    console.error(JSON.stringify({ requestId: requestId, code: code }));
    return jsonResponse_({ ok: false, requestId: requestId, error: { code: code, message: publicError_(code) } });
  }
}


function dispatchAction_(action, data) {
  switch (action) {
    case 'register': return registerParticipant_(data);
    case 'checkin': return processCheckin_(data);
    case 'getStats': return getStats_();
    case 'getParticipants': return getParticipants_(data);
    default: throw appError_('INVALID_REQUEST', 400);
  }
}

function appError_(code, httpStatus) {
  var error = new Error(code);
  error.code = code;
  error.httpStatus = httpStatus;
  return error;
}

function publicError_(code) {
  var messages = {
    UNAUTHORIZED: 'Request tidak terotorisasi.',
    EXPIRED_REQUEST: 'Request sudah kedaluwarsa.',
    REPLAY_DETECTED: 'Request sudah pernah diproses.',
    INVALID_REQUEST: 'Format request tidak valid.',
    INTERNAL_ERROR: 'Terjadi kesalahan internal.',
    ALREADY_REGISTERED: 'Data peserta sudah terdaftar.',
    QUOTA_EXCEEDED: 'Kuota peserta sudah penuh.',
    ALREADY_USED: 'Tiket sudah digunakan.',
    INVALID: 'Kode tiket tidak ditemukan.',
    SERVER_BUSY: 'Server sedang sibuk.'
  };
  return messages[code] || 'Request gagal diproses.';
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function getJsonData_(event) {
  var envelope = parseEnvelope_(event);
  return verifyEnvelope_(envelope);
}

function generateTicketCode_() {
  throw appError_('INVALID_REQUEST', 400);
}

function doGet() {
  return jsonResponse_({ ok: true, service: 'Ticketing_Backend', status: 'READY' });
}
