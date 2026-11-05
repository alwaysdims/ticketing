import { requireAdmin, requireCsrf, getClientIp, checkRateLimit } from '../_lib/middleware.js';
import { validateCheckin } from '../_lib/validate.js';
import { callAppsScript, AppScriptError, errorResponse, successResponse } from '../_lib/appsScript.js';
import { createHash } from 'node:crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  // CSRF guard
  if (!requireCsrf(req, res)) return;

  // Admin session guard — email comes from verified session, not request body
  const session = requireAdmin(req, res);
  if (!session) return;

  // Rate limit: 60 check-in attempts per minute per IP (high to allow fast scanning)
  const ip = getClientIp(req);
  if (!checkRateLimit(ip, { maxRequests: 60, windowMs: 60 * 1000 })) {
    return errorResponse(res, 429, 'RATE_LIMITED', 'Terlalu banyak percobaan check-in. Tunggu sebentar.');
  }

  // Validate input
  const result = validateCheckin(req.body);
  if (!result.valid) {
    return errorResponse(res, 400, 'VALIDATION_ERROR', 'Input tidak valid', { fields: result.errors });
  }

  const { ticketCode, method } = result.sanitized;

  // Hash IP for audit log — avoid storing raw IP in Sheets
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);

  try {
    const gasResult = await callAppsScript('checkin', {
      ticketCode,
      method,
      adminEmail: session.email, // Source from verified server session, never from req.body
      ipHash,
    });

    switch (gasResult.status) {
      case 'SUCCESS':
        return successResponse(res, 200, {
          result: 'SUCCESS',
          participant: {
            nama: gasResult.nama,
            ticketCode: gasResult.ticketCode,
            checkedInAt: gasResult.checkedInAt,
          },
        });

      case 'ALREADY_USED':
        return res.status(409).json({
          success: false,
          result: 'ALREADY_USED',
          message: 'Tiket sudah digunakan sebelumnya',
          participant: {
            nama: gasResult.nama,
            ticketCode: gasResult.ticketCode,
            firstCheckedInAt: gasResult.firstCheckedInAt,
          },
        });

      case 'INVALID':
        return res.status(404).json({
          success: false,
          result: 'INVALID',
          message: 'Kode tiket tidak ditemukan dalam sistem',
        });

      case 'LOCKED_COLLISION':
        // Concurrent check-in; ask client to retry once
        return res.status(503).json({
          success: false,
          result: 'LOCKED_COLLISION',
          message: 'Sistem sedang diproses bersamaan. Coba lagi dalam 1 detik.',
        });

      default:
        console.error('[admin/checkin] Unexpected Apps Script status:', gasResult.status);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Respons tidak dikenal dari backend.');
    }
  } catch (err) {
    if (err instanceof AppScriptError) {
      return errorResponse(res, err.httpStatus, 'BACKEND_ERROR', err.message);
    }
    console.error('[admin/checkin] Unhandled error:', err);
    return errorResponse(res, 500, 'INTERNAL_ERROR', 'Terjadi kesalahan tidak terduga.');
  }
}
