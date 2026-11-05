import { parseCookies, verifySessionToken, assertCsrfHeader } from './auth.js';
import { errorResponse } from './appsScript.js';

/**
 * Middleware: verify admin_session cookie.
 * Returns the session claims if valid, or sends 401 and returns null.
 * Usage:
 *   const session = await requireAdmin(req, res);
 *   if (!session) return;
 */
export function requireAdmin(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies['admin_session'];
  const claims = verifySessionToken(token);
  if (!claims) {
    errorResponse(res, 401, 'UNAUTHENTICATED', 'Admin session required');
    return null;
  }
  return claims;
}

/**
 * Middleware: require X-Requested-With header on mutating requests.
 * Returns true if OK, or sends 403 and returns false.
 */
export function requireCsrf(req, res) {
  if (!assertCsrfHeader(req)) {
    errorResponse(res, 403, 'CSRF_MISSING', 'Missing required request header');
    return false;
  }
  return true;
}

/**
 * Lightweight IP-based rate limiter using an in-memory Map.
 * LIMITATION: This is per-instance only — Vercel serverless has multiple
 * cold-started instances. For production-grade rate limiting across all
 * instances, use Vercel KV, Upstash Redis, or Vercel Edge Middleware.
 * For < 200 participants this is acceptable as a best-effort guard.
 *
 * Returns true if the request is allowed, false if rate-limited.
 */
const ipWindowMap = new Map(); // { ip: { count, windowStart } }

export function checkRateLimit(ip, { maxRequests = 5, windowMs = 10 * 60 * 1000 } = {}) {
  const now = Date.now();
  const entry = ipWindowMap.get(ip) || { count: 0, windowStart: now };

  if (now - entry.windowStart > windowMs) {
    // Reset window
    ipWindowMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count++;
  ipWindowMap.set(ip, entry);
  return true;
}

/**
 * Extract the real client IP respecting Vercel forwarded headers.
 */
export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Reject requests whose JSON body exceeds maxBytes to prevent payload stuffing.
 */
export function checkPayloadSize(req, maxBytes = 16 * 1024) {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  return contentLength <= maxBytes;
}
