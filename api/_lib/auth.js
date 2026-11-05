import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { CONFIG } from './config.js';

// ─── HMAC Signing ─────────────────────────────────────────────────────────────

/**
 * Build a canonical string from the request body object and sign it with
 * HMAC-SHA256. The signature plus a fresh timestamp are embedded in the
 * body itself because Apps Script doPost() does not expose custom HTTP headers.
 *
 * Canonical format:  timestamp + "." + JSON.stringify(sortedPayload)
 * This binds the signature to the exact payload content and time.
 */
export function signBackendPayload(payload) {
  const timestamp = Date.now().toString();
  // Sort keys so signature is deterministic regardless of insertion order.
  const canonical = timestamp + '.' + JSON.stringify(sortObjectKeys(payload));
  const signature = createHmac('sha256', CONFIG.BACKEND_SECRET_KEY)
    .update(canonical)
    .digest('hex');

  return { ...payload, _timestamp: timestamp, _signature: signature };
}

/**
 * Apps Script calls this logic server-side. Duplicated here for unit tests.
 * Returns true if signature is valid and timestamp is within allowed window.
 */
export function verifyBackendSignature(body, toleranceMs = 60_000) {
  const { _timestamp, _signature, ...rest } = body;
  if (!_timestamp || !_signature) return false;

  const age = Date.now() - parseInt(_timestamp, 10);
  if (age < 0 || age > toleranceMs) return false; // expired or future-dated

  const canonical = _timestamp + '.' + JSON.stringify(sortObjectKeys(rest));
  const expected = createHmac('sha256', CONFIG.BACKEND_SECRET_KEY)
    .update(canonical)
    .digest('hex');

  // Constant-time comparison prevents timing attacks.
  try {
    return timingSafeEqual(Buffer.from(_signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false; // Different lengths → invalid
  }
}

function sortObjectKeys(obj) {
  return Object.keys(obj).sort().reduce((acc, k) => { acc[k] = obj[k]; return acc; }, {});
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

export function clearSessionCookie() {
  return 'admin_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
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

// ─── Random token for idempotency / honeypot check ────────────────────────────

export function randomHex(bytes = 16) {
  return randomBytes(bytes).toString('hex');
}
