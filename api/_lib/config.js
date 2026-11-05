// Shared server config — NEVER imported from frontend bundles.
// All values come from Vercel Environment Variables only.

export const CONFIG = {
  // Apps Script Web App deployment URL (doPost endpoint)
  APPS_SCRIPT_URL: process.env.APPS_SCRIPT_URL,

  // HMAC-SHA256 shared secret used to sign every server→Apps Script request.
  // Apps Script verifies this in the request body (not a header — GAS doPost
  // does not expose custom headers reliably).
  BACKEND_SECRET_KEY: process.env.BACKEND_SECRET_KEY,

  // Google OAuth Client ID (public, used to verify id_token aud claim)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,

  // Comma-separated list of admin Google email addresses
  ADMIN_ALLOWLIST: (process.env.ADMIN_ALLOWLIST || '').split(',').map(e => e.trim().toLowerCase()),

  // Secret used to sign/verify the admin_session cookie JWT
  SESSION_SECRET: process.env.SESSION_SECRET,

  // Max-age in seconds for admin_session cookie (8 hours)
  SESSION_MAX_AGE: 8 * 60 * 60,

  // Quota cap — also enforced server-side by Apps Script
  QUOTA_CAPACITY: parseInt(process.env.QUOTA_CAPACITY || '200', 10),

  // Event name surfaced in registration response
  EVENT_NAME: process.env.EVENT_NAME || 'Nusantara Web & Design Summit 2026',
};

// Validate required vars at cold-start so mis-config fails loudly.
const REQUIRED = ['APPS_SCRIPT_URL', 'BACKEND_SECRET_KEY', 'GOOGLE_CLIENT_ID', 'SESSION_SECRET'];
for (const key of REQUIRED) {
  if (!process.env[key]) {
    // Log to Vercel runtime logs — do NOT expose to HTTP callers.
    console.error(`[config] Missing required env var: ${key}`);
  }
}
