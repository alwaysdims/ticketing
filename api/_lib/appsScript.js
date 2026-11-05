import { createHmacEnvelope } from './auth.js';
import { CONFIG } from './config.js';

/**
 * Call the Google Apps Script Web App with a signed payload.
 * Throws on network error or non-2xx HTTP status.
 */
export async function callAppsScript(action, data = {}) {
  if (!CONFIG.APPS_SCRIPT_URL) {
    throw new AppScriptError('APPS_SCRIPT_URL not configured', 503);
  }

  const body = createHmacEnvelope(action, data);

  let response;
  try {
    response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.error(`[appsScript] Network error calling ${action}:`, err.message);
    throw new AppScriptError('Backend unreachable', 503);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[appsScript] HTTP ${response.status} from Apps Script (${action}): ${text.slice(0, 200)}`);
    throw new AppScriptError(`Backend returned ${response.status}`, 502);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > 256 * 1024) throw new AppScriptError('Backend response too large', 502);

  let json;
  try {
    json = await response.json();
  } catch {
    throw new AppScriptError('Backend returned non-JSON response', 502);
  }
  if (!json || json.ok !== true || !json.result || typeof json.result !== 'object') {
    const code = json?.error?.code || 'INTERNAL_ERROR';
    const statusMap = { UNAUTHORIZED: 401, EXPIRED_REQUEST: 401, REPLAY_DETECTED: 409, INVALID_REQUEST: 400, ALREADY_REGISTERED: 409, QUOTA_EXCEEDED: 410, ALREADY_USED: 409, INVALID: 404, SERVER_BUSY: 503 };
    throw new AppScriptError(code, statusMap[code] || 502, code);
  }

  return json.result;
}

export class AppScriptError extends Error {
  constructor(message, httpStatus = 500, code = 'BACKEND_ERROR') {
    super(message);
    this.name = 'AppScriptError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/**
 * Standard JSON error response helper for Vercel Functions.
 */
export function errorResponse(res, status, code, message, details) {
  const error = { code, message };
  if (details !== undefined) error.details = details;
  return res.status(status).json({ success: false, error });
}

/**
 * Standard JSON success response helper.
 */
export function successResponse(res, status, data) {
  return res.status(status).json({ success: true, ...data });
}
