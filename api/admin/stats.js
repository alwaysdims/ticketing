import { requireAdmin } from '../_lib/middleware.js';
import { callAppsScript, AppScriptError, errorResponse } from '../_lib/appsScript.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  const session = requireAdmin(req, res);
  if (!session) return;

  try {
    const stats = await callAppsScript('getStats');
    return res.status(200).json({
      totalRegistered: stats.totalRegistered,
      checkedIn: stats.checkedIn,
      notCheckedIn: stats.notCheckedIn,
      attendancePercentage: stats.attendancePercentage,
      quotaCapacity: stats.quotaCapacity,
    });
  } catch (err) {
    if (err instanceof AppScriptError) {
      return errorResponse(res, err.httpStatus, 'BACKEND_ERROR', err.message);
    }
    console.error('[admin/stats] Unhandled error:', err);
    return errorResponse(res, 500, 'INTERNAL_ERROR', 'Gagal mengambil statistik.');
  }
}
