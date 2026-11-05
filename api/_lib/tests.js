/**
 * Self-contained tests for api/_lib modules.
 * Run with: node api/_lib/tests.js
 * No test framework required — uses Node's built-in assert.
 */

import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

// Set dummy env vars before importing config-dependent modules
process.env.APPS_SCRIPT_URL = 'https://script.google.com/test';
process.env.BACKEND_SECRET_KEY = 'test-secret-key-32bytes-padding!!';
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.SESSION_SECRET = 'test-session-secret-32bytes-padd!';
process.env.ADMIN_ALLOWLIST = 'admin@example.com, panitia@gmail.com';

const { signBackendPayload, verifyBackendSignature, createSessionToken, verifySessionToken, parseCookies, buildSessionCookie } = await import('./auth.js');
const { validateRegistration, validateCheckin } = await import('./validate.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
    failed++;
  }
}

// ─── HMAC Signing ─────────────────────────────────────────────────────────────

console.log('\n[1] HMAC Signing');

test('signBackendPayload adds _timestamp and _signature', () => {
  const result = signBackendPayload({ action: 'test', foo: 'bar' });
  assert.ok(result._timestamp, 'missing _timestamp');
  assert.ok(result._signature, 'missing _signature');
  assert.equal(result.action, 'test');
});

test('verifyBackendSignature accepts valid payload within tolerance', () => {
  const signed = signBackendPayload({ action: 'register', email: 'a@b.com' });
  assert.equal(verifyBackendSignature(signed, 60_000), true);
});

test('verifyBackendSignature rejects tampered payload', () => {
  const signed = signBackendPayload({ action: 'register', email: 'a@b.com' });
  signed.email = 'evil@attacker.com';
  assert.equal(verifyBackendSignature(signed, 60_000), false);
});

test('verifyBackendSignature rejects expired timestamp', () => {
  const signed = signBackendPayload({ action: 'test' });
  signed._timestamp = (Date.now() - 120_000).toString(); // 2 min ago
  assert.equal(verifyBackendSignature(signed, 60_000), false);
});

test('verifyBackendSignature rejects future timestamp (replay guard)', () => {
  const signed = signBackendPayload({ action: 'test' });
  signed._timestamp = (Date.now() + 10_000).toString(); // 10 s in future
  assert.equal(verifyBackendSignature(signed, 60_000), false);
});

test('verifyBackendSignature rejects missing signature', () => {
  const signed = signBackendPayload({ action: 'test' });
  delete signed._signature;
  assert.equal(verifyBackendSignature(signed, 60_000), false);
});

// ─── Session JWT ──────────────────────────────────────────────────────────────

console.log('\n[2] Session JWT');

test('createSessionToken returns a 3-part JWT string', () => {
  const token = createSessionToken({ email: 'admin@example.com', name: 'Admin' });
  assert.equal(token.split('.').length, 3);
});

test('verifySessionToken returns claims for valid token', () => {
  const token = createSessionToken({ email: 'admin@example.com', name: 'Admin' });
  const claims = verifySessionToken(token);
  assert.ok(claims, 'claims should not be null');
  assert.equal(claims.email, 'admin@example.com');
});

test('verifySessionToken rejects tampered payload', () => {
  const token = createSessionToken({ email: 'admin@example.com', name: 'Admin' });
  const parts = token.split('.');
  // Replace payload with different email
  const fakePayload = Buffer.from(JSON.stringify({ email: 'evil@attacker.com', exp: 9999999999 })).toString('base64url');
  const tampered = `${parts[0]}.${fakePayload}.${parts[2]}`;
  assert.equal(verifySessionToken(tampered), null);
});

test('verifySessionToken rejects expired token', () => {
  const expiredPayload = Buffer.from(JSON.stringify({ email: 'x@y.com', exp: 1, iat: 1 })).toString('base64url');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  // Build with correct signature for this secret — should still fail on exp
  const data = `${header}.${expiredPayload}`;
  const sig = createHmac('sha256', process.env.SESSION_SECRET).update(data).digest('base64url');
  const expiredToken = `${data}.${sig}`;
  assert.equal(verifySessionToken(expiredToken), null);
});

test('verifySessionToken returns null for garbage input', () => {
  assert.equal(verifySessionToken('not.a.jwt'), null);
  assert.equal(verifySessionToken(null), null);
  assert.equal(verifySessionToken(''), null);
});

// ─── Cookie Parsing ───────────────────────────────────────────────────────────

console.log('\n[3] Cookie Parsing');

test('parseCookies extracts multiple cookies', () => {
  const cookies = parseCookies('admin_session=abc123; theme=dark; lang=id');
  assert.equal(cookies.admin_session, 'abc123');
  assert.equal(cookies.theme, 'dark');
  assert.equal(cookies.lang, 'id');
});

test('parseCookies returns empty object for undefined', () => {
  assert.deepEqual(parseCookies(undefined), {});
});

// ─── Input Validation ─────────────────────────────────────────────────────────

console.log('\n[4] Registration Validation');

const VALID_BODY = {
  nama: 'Ahmad Fauzi',
  email: 'ahmad@example.com',
  whatsapp: '081234567890',
  privacyConsent: true,
  clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
};

test('valid registration payload passes', () => {
  const r = validateRegistration(VALID_BODY);
  assert.equal(r.valid, true);
  assert.equal(r.sanitized.email, 'ahmad@example.com');
});

test('whatsapp 08xxx normalised to 628xxx', () => {
  const r = validateRegistration({ ...VALID_BODY, whatsapp: '081234567890' });
  assert.equal(r.valid, true);
  assert.equal(r.sanitized.whatsapp, '6281234567890');
});

test('whatsapp 628xxx preserved', () => {
  const r = validateRegistration({ ...VALID_BODY, whatsapp: '6281234567890' });
  assert.equal(r.valid, true);
  assert.equal(r.sanitized.whatsapp, '6281234567890');
});

test('email normalised to lowercase', () => {
  const r = validateRegistration({ ...VALID_BODY, email: 'UPPER@EXAMPLE.COM' });
  assert.equal(r.valid, true);
  assert.equal(r.sanitized.email, 'upper@example.com');
});

test('short name rejected', () => {
  const r = validateRegistration({ ...VALID_BODY, nama: 'AB' });
  assert.equal(r.valid, false);
  assert.ok(r.errors.nama);
});

test('formula injection in name rejected', () => {
  const r = validateRegistration({ ...VALID_BODY, nama: '=IMPORTRANGE(x,y)' });
  assert.equal(r.valid, false);
});

test('invalid email rejected', () => {
  const r = validateRegistration({ ...VALID_BODY, email: 'notanemail' });
  assert.equal(r.valid, false);
  assert.ok(r.errors.email);
});

test('missing privacyConsent rejected', () => {
  const r = validateRegistration({ ...VALID_BODY, privacyConsent: false });
  assert.equal(r.valid, false);
  assert.ok(r.errors.privacyConsent);
});

test('invalid UUID rejected', () => {
  const r = validateRegistration({ ...VALID_BODY, clientRequestId: 'not-a-uuid' });
  assert.equal(r.valid, false);
  assert.ok(r.errors.clientRequestId);
});

test('honeypot field triggers silent reject', () => {
  const r = validateRegistration({ ...VALID_BODY, _hp: 'bot-filled' });
  assert.equal(r.valid, false);
  assert.equal(r.honeypot, true);
});

console.log('\n[5] Check-in Validation');

test('valid SCAN check-in passes', () => {
  const r = validateCheckin({ ticketCode: 'NWDS-7K9P-M2X4', method: 'SCAN' });
  assert.equal(r.valid, true);
  assert.equal(r.sanitized.ticketCode, 'NWDS-7K9P-M2X4');
});

test('valid MANUAL check-in passes', () => {
  const r = validateCheckin({ ticketCode: 'NWDS-AB3D-XY7Z', method: 'manual' });
  assert.equal(r.valid, true);
  assert.equal(r.sanitized.method, 'MANUAL');
});

test('ticket code with ambiguous chars rejected (contains 0 or O)', () => {
  const r = validateCheckin({ ticketCode: 'NWDS-0K9P-M2X4', method: 'SCAN' });
  assert.equal(r.valid, false);
});

test('invalid method rejected', () => {
  const r = validateCheckin({ ticketCode: 'NWDS-7K9P-M2X4', method: 'UNKNOWN' });
  assert.equal(r.valid, false);
});

test('empty ticketCode rejected', () => {
  const r = validateCheckin({ ticketCode: '', method: 'SCAN' });
  assert.equal(r.valid, false);
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Total: ${passed + failed} tests | PASS: ${passed} | FAIL: ${failed}`);
if (failed > 0) {
  process.exit(1);
}
