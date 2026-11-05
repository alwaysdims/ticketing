import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { CONFIG } from './config.js';

export function createHmacEnvelope(action, data = {}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = randomUuidV4();
  const payloadText = JSON.stringify({ action, data });
  const signature = createHmac('sha256', CONFIG.BACKEND_SECRET_KEY)
    .update(`${timestamp}.${nonce}.${payloadText}`, 'utf8')
    .digest('hex');
  return { timestamp, nonce, payloadText, signature };
}

export function verifyHmacEnvelope(envelope, toleranceSeconds = 60) {
  if (!envelope || typeof envelope !== 'object') return false;
  const { timestamp, nonce, payloadText, signature } = envelope;
  if (!Number.isInteger(timestamp) || typeof nonce !== 'string' || typeof payloadText !== 'string' || typeof signature !== 'string') return false;
  if (!isUuidV4(nonce) || !/^[0-9a-f]{64}$/.test(signature)) return false;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (age < 0 || age > toleranceSeconds) return false;
  const expected = createHmac('sha256', CONFIG.BACKEND_SECRET_KEY)
    .update(`${timestamp}.${nonce}.${payloadText}`, 'utf8')
    .digest('hex');
  return safeEqualHex(signature, expected);
}

function safeEqualHex(left, right) {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

function randomUuidV4() {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isUuidV4(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// ─── Session JWT (stateless, HMAC-signed) ─────────────────────────────────────

/**
 * Minimal stateless session token.
 * Header.Payload.Signature — no dependency on jsonwebtoken package.
 * Using base64url encoding throughout.
 */
export function createSessionToken(adminData) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + CONFIG.SESSION_MAX_AGE;
  const payload = b64url(JSON.stringify({ ...adminData, exp, iat: Math.floor(Date.now() / 1000) }));
  const data = `${header}.${payload}`;
  const sig = b64url(createHmac('sha256', CONFIG.SESSION_SECRET).update(data).digest());
  return `${data}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const data = `${parts[0]}.${parts[1]}`;
  const sig = b64url(createHmac('sha256', CONFIG.SESSION_SECRET).update(data).digest());

  let valid = false;
  try {
    valid = timingSafeEqual(Buffer.from(parts[2], 'base64url'), Buffer.from(sig, 'base64url'));
  } catch { return null; }

  if (!valid) return null;

  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  if (claims.exp < Math.floor(Date.now() / 1000)) return null; // expired
  return claims;
}

function b64url(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return buf.toString('base64url');
}

function safeEqualBytes(left, right) {
  return left.length === right.length && timingSafeEqual(left, right);
}

// ─── Cookie Parsing ───────────────────────────────────────────────────────────

export function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), decodeURIComponent(v.join('='))];
    })
  );
}

export function buildSessionCookie(token) {
  return [
    `admin_session=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${CONFIG.SESSION_MAX_AGE}`,
  ].join('; ');
}

export function buildCsrfCookie(token) {
  return [
    `csrf_token=${encodeURIComponent(token)}`,
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${CONFIG.SESSION_MAX_AGE}`,
  ].join('; ');
}

export function clearSessionCookie() {
  return [
    'admin_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    'csrf_token=; Secure; SameSite=Lax; Path=/; Max-Age=0'
  ];
}

// ─── CSRF Guard ───────────────────────────────────────────────────────────────

/**
 * All mutating admin requests must include header X-Requested-With: XMLHttpRequest.
 * This is a lightweight same-origin guard; modern browsers block cross-origin
 * requests from setting custom headers without CORS preflight approval.
 */
export function assertCsrfHeader(req) {
  return req.headers['x-requested-with'] === 'XMLHttpRequest';
}

export function assertCsrfToken(req) {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies.csrf_token;
  const headerToken = req.headers['x-csrf-token'];
  return Boolean(cookieToken && headerToken && safeEqualBytes(Buffer.from(cookieToken), Buffer.from(headerToken)));
}

// ─── Random token for idempotency / honeypot check ────────────────────────────

export function randomHex(bytes = 16) {
  return randomBytes(bytes).toString('hex');
}
