import { requireAdmin, requireCsrf } from '../_lib/middleware.js';
import { clearSessionCookie } from '../_lib/auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  if (!requireCsrf(req, res)) return;

  // Verify session exists before clearing (not strictly required, but logs clean)
  const session = requireAdmin(req, res);
  if (!session) return;

  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}
