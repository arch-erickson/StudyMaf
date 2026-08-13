var auth = require('../_lib/studymaf-auth');

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  try {
    var account = await auth.requireRole(req, res, ['admin']);
    if (!account) return;
    if (req.method === 'GET') {
      var roles = await auth.db('user_roles?role=eq.professor&select=user_id,assigned_at,profiles(id,email,display_name,last_seen_at)&order=assigned_at.desc');
      return auth.json(res, 200, { professors: roles || [] });
    }
    if (req.method !== 'POST') return auth.json(res, 405, { error: 'Method not allowed.' });
    var userId = auth.text((req.body || {}).user_id, 80);
    if (!userId) return auth.json(res, 400, { error: 'User id is required.' });
    var saved = await auth.db('user_roles?user_id=eq.' + encodeURIComponent(userId), { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ role: 'professor', assigned_at: new Date().toISOString() }) });
    return auth.json(res, 200, { professor: saved && saved[0] });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not manage professors.' }); }
};
