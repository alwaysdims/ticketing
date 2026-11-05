import { requireAdmin } from '../_lib/middleware.js';
import { errorResponse } from '../_lib/appsScript.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  const session = requireAdmin(req, res);
  if (!session) return; // 401 already sent

  return res.status(200).json({
    authenticated: true,
    admin: { email: session.email, name: session.name },
  });
}
