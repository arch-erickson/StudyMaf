var auth = require('../_lib/studymaf-auth');

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  if (req.method !== 'GET') return auth.json(res, 405, { error: 'Method not allowed.' });
  try {
    var account = await auth.authenticated(req, res);
    if (!account) return;
    auth.json(res, 200, { user: { id: account.user.id, email: account.user.email, name: (account.user.user_metadata || {}).full_name || (account.user.user_metadata || {}).name || '' }, role: account.role });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not load your account.' }); }
};
