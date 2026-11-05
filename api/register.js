import { randomBytes } from 'node:crypto';
import { validateRegistration } from './_lib/validate.js';
import { callAppsScript, errorResponse, successResponse, AppScriptError } from './_lib/appsScript.js';
import { getClientIp, checkRateLimit, checkPayloadSize } from './_lib/middleware.js';

export default async function handler(req, res) {
  // Method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  // Payload size guard (16 KB max)
  if (!checkPayloadSize(req)) {
    return errorResponse(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds limit');
  }

  // IP rate limit: 5 registration attempts per 10 minutes per IP
  const ip = getClientIp(req);
  if (!checkRateLimit(ip, { maxRequests: 5, windowMs: 10 * 60 * 1000 })) {
    return errorResponse(res, 429, 'RATE_LIMITED', 'Terlalu banyak permintaan. Coba lagi dalam beberapa menit.');
  }

  // Input validation + sanitization
  const result = validateRegistration(req.body);

  if (result.honeypot) {
    // Silent success — do not reveal honeypot to bots
    return res.status(200).json({ success: true, data: { ticketCode: 'HONEYPOT' } });
  }

  if (!result.valid) {
    return errorResponse(res, 400, 'VALIDATION_ERROR', 'Input tidak valid', { fields: result.errors });
  }

  const { nama, email, whatsapp, privacyConsent, clientRequestId } = result.sanitized;
  const ticketCode = createTicketCode_();

  try {
    const gasResult = await callAppsScript('register', {
      nama,
      email,
      whatsapp,
      privacyConsent,
      clientRequestId,
      ticketCode,
    });

    switch (gasResult.status) {
      case 'REGISTERED':
        return successResponse(res, 201, {
          data: {
            ticketCode: gasResult.ticketCode,
            nama: gasResult.nama,
            registeredAt: gasResult.registeredAt,
            eventName: gasResult.eventName,
          },
        });

      case 'ALREADY_PROCESSED':
        // Idempotent: same clientRequestId already succeeded — return same ticket
        return successResponse(res, 200, {
          data: {
            ticketCode: gasResult.ticketCode,
            nama: gasResult.nama,
            registeredAt: gasResult.registeredAt,
            eventName: gasResult.eventName,
          },
        });

      case 'ALREADY_REGISTERED':
        return errorResponse(res, 409, 'ALREADY_REGISTERED', 'Email atau nomor WhatsApp sudah terdaftar.');

      case 'QUOTA_EXCEEDED':
        return errorResponse(res, 410, 'QUOTA_EXCEEDED', 'Kapasitas pendaftaran telah penuh.');

      default:
        console.error('[register] Unexpected Apps Script status:', gasResult.status);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Terjadi kesalahan pada sistem. Coba lagi nanti.');
    }
  } catch (err) {
    if (err instanceof AppScriptError) {
      return errorResponse(res, err.httpStatus, err.code, err.code === 'BACKEND_ERROR' ? err.message : 'Request backend ditolak.');
    }
    console.error('[register] Unhandled error:', err);
    return errorResponse(res, 500, 'INTERNAL_ERROR', 'Terjadi kesalahan tidak terduga.');
  }
}

function createTicketCode_() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  let value = '';
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return `NWDS-${value.slice(0, 4)}-${value.slice(4)}`;
}
