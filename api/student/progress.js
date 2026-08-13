var auth = require('../_lib/studymaf-auth');

function validState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  // This endpoint stores progress, not uploaded files or screenshots.
  return JSON.stringify(value).length <= 240000 ? value : null;
}

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  try {
    var account = await auth.authenticated(req, res);
    if (!account) return;
    if (req.method === 'GET') {
      var rows = await auth.db('account_progress?user_id=eq.' + encodeURIComponent(account.user.id) + '&select=state,updated_at');
      return auth.json(res, 200, { progress: rows && rows[0] || null });
    }
    if (req.method !== 'PUT') return auth.json(res, 405, { error: 'Method not allowed.' });
    var state = validState((req.body || {}).state);
    if (!state) return auth.json(res, 400, { error: 'Progress data is invalid or too large.' });
    var payload = { user_id: account.user.id, state: state, updated_at: new Date().toISOString() };
    var saved = await auth.db('account_progress?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(payload) });
    return auth.json(res, 200, { progress: saved && saved[0] });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not save your progress.' }); }
};
