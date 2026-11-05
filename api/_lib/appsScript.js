import { randomUUID } from 'node:crypto';
import { CONFIG } from './config.js';
import { signBackendPayload } from './auth.js';

/**
 * Call the Google Apps Script Web App with a signed payload.
 * Throws on network error or non-2xx HTTP status.
 */
export async function callAppsScript(action, data = {}) {
  if (!CONFIG.APPS_SCRIPT_URL) {
    throw new AppScriptError('APPS_SCRIPT_URL not configured', 503);
  }

  const body = signBackendPayload({ action, requestId: randomUUID(), ...data });

  let response;
  try {
    response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Vercel Functions timeout is 10 s — give Apps Script 8 s max.
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

  let json;
  try {
    json = await response.json();
  } catch {
    throw new AppScriptError('Backend returned non-JSON response', 502);
  }

  return json;
}

export class AppScriptError extends Error {
  constructor(message, httpStatus = 500) {
    super(message);
    this.name = 'AppScriptError';
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
