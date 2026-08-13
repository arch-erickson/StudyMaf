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
    var body = req.body || {}, userId = auth.text(body.user_id, 80), email = auth.email(body.email);
    if (!userId && !email) return auth.json(res, 400, { error: 'Enter an email address or choose an existing account.' });
    if (!userId) {
      var profiles = await auth.db('profiles?email=eq.' + encodeURIComponent(email) + '&select=id,email');
      if (profiles && profiles[0]) userId = profiles[0].id;
    }
    if (userId) {
      var saved = await auth.db('user_roles?user_id=eq.' + encodeURIComponent(userId), { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ role: 'professor', assigned_at: new Date().toISOString() }) });
      return auth.json(res, 200, { professor: saved && saved[0], status: 'active' });
    }
    var invited = await auth.db('account_role_invites?on_conflict=email', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ email: email, role: 'professor', created_by: account.user.id }) });
    return auth.json(res, 201, { invitation: invited && invited[0], status: 'pending' });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not manage professors.' }); }
};
