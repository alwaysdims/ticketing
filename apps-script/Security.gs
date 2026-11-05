function parseEnvelope_(event) {
  if (!event || !event.postData || typeof event.postData.contents !== 'string') {
    throw appError_('INVALID_REQUEST', 400);
  }
  var body;
  try {
    body = JSON.parse(event.postData.contents);
  } catch (error) {
    throw appError_('INVALID_REQUEST', 400);
  }
  if (!body || !Number.isInteger(body.timestamp) || typeof body.nonce !== 'string' ||
      typeof body.payloadText !== 'string' || typeof body.signature !== 'string') {
    throw appError_('INVALID_REQUEST', 400);
  }
  return body;
}

function verifyEnvelope_(envelope) {
  var config = getConfig_();
  var now = Math.floor(Date.now() / 1000);
  var age = now - envelope.timestamp;
  if (age < 0 || age > config.replayWindowSeconds) throw appError_('EXPIRED_REQUEST', 401);
  if (!isUuidV4_(envelope.nonce)) throw appError_('INVALID_REQUEST', 400);
  if (!/^[0-9a-f]{64}$/.test(envelope.signature)) throw appError_('UNAUTHORIZED', 401);

  var message = envelope.timestamp + '.' + envelope.nonce + '.' + envelope.payloadText;
  var expected = bytesToHex_(Utilities.computeHmacSha256Signature(message, config.backendSecret));
  if (!constantTimeEqual_(expected, envelope.signature)) throw appError_('UNAUTHORIZED', 401);

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    claimNonce_(envelope.nonce, now, config);
  } catch (error) {
    if (error.code) throw error;
    throw appError_('INTERNAL_ERROR', 500);
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }

  try {
    var payload = JSON.parse(envelope.payloadText);
    if (!payload || typeof payload.action !== 'string' || !payload.data) throw appError_('INVALID_REQUEST', 400);
    return payload;
  } catch (error) {
    if (error.code) throw error;
    throw appError_('INVALID_REQUEST', 400);
  }
}

function claimNonce_(nonce, now, config) {
  var sheet = replaySheet_();
  var values = sheet.getDataRange().getValues();
  var cutoff = now - config.replayRetentionSeconds;
  var found = false;
  for (var i = values.length - 1; i >= 1; i--) {
    var received = Number(values[i][1]);
    if (received && received < cutoff) sheet.deleteRow(i + 1);
    else if (values[i][0] === nonce) found = true;
  }
  if (found) throw appError_('REPLAY_DETECTED', 409);
  sheet.appendRow([nonce, now, now + config.replayWindowSeconds]);
}


function bytesToHex_(bytes) {
  return bytes.map(function(byte) {
    var value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function constantTimeEqual_(left, right) {
  if (left.length !== right.length) return false;
  var diff = 0;
  for (var i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

function isUuidV4_(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
