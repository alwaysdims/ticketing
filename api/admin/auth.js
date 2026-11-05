import { CONFIG } from '../_lib/config.js';
import { createSessionToken, buildSessionCookie } from '../_lib/auth.js';
import { errorResponse } from '../_lib/appsScript.js';
import { getClientIp, checkRateLimit, checkPayloadSize } from '../_lib/middleware.js';

// Google's public token verification endpoint
const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo?id_token=';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  if (!checkPayloadSize(req)) {
    return errorResponse(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds limit');
  }

  // Rate limit auth attempts: 10 per 10 minutes per IP
  const ip = getClientIp(req);
  if (!checkRateLimit(ip, { maxRequests: 10, windowMs: 10 * 60 * 1000 })) {
    return errorResponse(res, 429, 'RATE_LIMITED', 'Terlalu banyak percobaan login. Tunggu beberapa menit.');
  }

  const { credential } = req.body || {};
  if (!credential || typeof credential !== 'string') {
    return errorResponse(res, 400, 'MISSING_CREDENTIAL', 'Google ID token tidak ditemukan dalam request.');
  }

  // Verify token with Google's public endpoint
  // For production, use google-auth-library for local signature verification
  // to avoid a network call. Using tokeninfo here for simplicity without
  // extra npm dependencies — acceptable for < 200 logins total.
  let tokenInfo;
  try {
    const verifyRes = await fetch(`${GOOGLE_TOKEN_INFO_URL}${encodeURIComponent(credential)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!verifyRes.ok) {
      return errorResponse(res, 401, 'INVALID_TOKEN', 'Token Google tidak valid atau sudah kedaluwarsa.');
    }
    tokenInfo = await verifyRes.json();
  } catch (err) {
    console.error('[admin/auth/google] Token verification network error:', err.message);
    return errorResponse(res, 503, 'UPSTREAM_ERROR', 'Gagal memverifikasi token dengan Google. Coba lagi.');
  }

  // Validate token claims
  if (
    !tokenInfo.aud ||
    tokenInfo.aud !== CONFIG.GOOGLE_CLIENT_ID ||
    tokenInfo.email_verified !== 'true' ||
    !['accounts.google.com', 'https://accounts.google.com'].includes(tokenInfo.iss) ||
    parseInt(tokenInfo.exp, 10) < Math.floor(Date.now() / 1000)
  ) {
    return errorResponse(res, 401, 'INVALID_TOKEN_CLAIMS', 'Klaim token Google tidak memenuhi syarat.');
  }

  const email = tokenInfo.email?.toLowerCase();
  if (!email) {
    return errorResponse(res, 401, 'MISSING_EMAIL', 'Token tidak mengandung alamat email.');
  }

  // Check ADMIN_ALLOWLIST
  if (!CONFIG.ADMIN_ALLOWLIST.includes(email)) {
    // Log the unauthorized attempt without revealing the allowlist content
    console.warn(`[admin/auth/google] Unauthorized email attempt: ${email.slice(0, 4)}***`);
    return errorResponse(res, 403, 'UNAUTHORIZED_ADMIN_EMAIL', 'Email ini tidak memiliki akses admin.');
  }

  // Issue session cookie
  const sessionPayload = { email, name: tokenInfo.name || email };
  const token = createSessionToken(sessionPayload);
  const cookieStr = buildSessionCookie(token);

  res.setHeader('Set-Cookie', cookieStr);
  return res.status(200).json({
    success: true,
    admin: { email, name: tokenInfo.name || email },
  });
}
