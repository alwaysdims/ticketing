function runLocalContractTests_() {
  // Run manually in TEST Apps Script editor only after Script Properties point to TEST.
  // These tests do not write participants or check-in rows.
  var config = getConfig_();
  if (!config.backendSecret || !config.spreadsheetId) throw new Error('Configure TEST Script Properties first');
  var nonce = Utilities.getUuid();
  var timestamp = Math.floor(Date.now() / 1000);
  var payloadText = JSON.stringify({ action: 'getStats', data: {} });
  var message = timestamp + '.' + nonce + '.' + payloadText;
  var signature = bytesToHex_(Utilities.computeHmacSha256Signature(message, config.backendSecret));
  if (!isUuidV4_(nonce)) throw new Error('UUID v4 generation failed');
  if (!/^[0-9a-f]{64}$/.test(signature)) throw new Error('HMAC hex output invalid');
  if (!constantTimeEqual_(signature, signature)) throw new Error('Constant-time comparison failed');
  console.log(JSON.stringify({ test: 'local_contract', status: 'PASS' }));
}

function testWhatsAppText_(sample) {
  var normalized = normalizeWhatsapp_(sample);
  if (normalized !== '6281234567890') throw new Error('WhatsApp normalization failed');
  console.log(JSON.stringify({ test: 'whatsapp_text', normalized: normalized, status: 'PASS' }));
}

function testFormulaGuard_() {
  ['=SUM(A1)', '+cmd', '-cmd', '@cmd'].forEach(function(value) {
    if (safeSheetText_(value).indexOf("'") !== 0) throw new Error('Formula guard failed');
  });
  console.log(JSON.stringify({ test: 'formula_guard', status: 'PASS' }));
}

function testCollisionGuard_(candidate) {
  var rows = participantSheet_().getDataRange().getValues();
  if (!ticketExists_(rows, candidate)) throw new Error('Candidate was not found in TEST data');
  console.log(JSON.stringify({ test: 'collision_guard', status: 'PASS' }));
}
