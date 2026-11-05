import { requireAdmin } from '../_lib/middleware.js';
import { callAppsScript, AppScriptError, errorResponse } from '../_lib/appsScript.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  const session = requireAdmin(req, res);
  if (!session) return;

  // Optional query params: ?q=fauzi&status=CHECKED_IN
  const { q = '', status = 'all' } = req.query || {};

  // Sanitize query params before forwarding
  const sanitizedQ = String(q).slice(0, 100).replace(/[<>"']/g, '');
  const allowedStatuses = ['all', 'CHECKED_IN', 'NOT_CHECKED_IN'];
  const sanitizedStatus = allowedStatuses.includes(status) ? status : 'all';

  try {
    const result = await callAppsScript('getParticipants', {
      q: sanitizedQ,
      status: sanitizedStatus,
    });

    return res.status(200).json({ participants: result.participants || [] });
  } catch (err) {
    if (err instanceof AppScriptError) {
      return errorResponse(res, err.httpStatus, 'BACKEND_ERROR', err.message);
    }
    console.error('[admin/participants] Unhandled error:', err);
    return errorResponse(res, 500, 'INTERNAL_ERROR', 'Gagal mengambil data peserta.');
  }
}
