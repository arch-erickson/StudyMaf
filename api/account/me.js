var auth = require('../_lib/studymaf-auth');

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  try {
    var account = await auth.authenticated(req, res);
    if (!account) return;
    var workspace;
    try { workspace = await auth.resolveWorkspace(req, account); }
    catch (error) { return auth.json(res, 403, { error: error.message || 'This account cannot use the requested workspace.' }); }
    if (req.method === 'PATCH') {
      var displayName = auth.text((req.body || {}).display_name, 80);
      var saved = await auth.db('profiles?id=eq.' + encodeURIComponent(account.user.id), {
        method: 'PATCH', headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ display_name: displayName || null, updated_at: new Date().toISOString() })
      });
      return auth.json(res, 200, { user: { id: account.user.id, email: account.user.email, name: saved && saved[0] && saved[0].display_name || '' }, role: workspace.role, base_role: workspace.base_role, available_workspaces: workspace.available_workspaces });
    }
    if (req.method !== 'GET') return auth.json(res, 405, { error: 'Method not allowed.' });
    var profiles = await auth.db('profiles?id=eq.' + encodeURIComponent(account.user.id) + '&select=display_name');
    var profile = profiles && profiles[0] || {};
    auth.json(res, 200, { user: { id: account.user.id, email: account.user.email, name: profile.display_name || (account.user.user_metadata || {}).full_name || (account.user.user_metadata || {}).name || '' }, role: workspace.role, base_role: workspace.base_role, available_workspaces: workspace.available_workspaces });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not load your account.' }); }
};
