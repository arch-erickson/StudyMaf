/* Server-only authentication and database helpers for StudyMAF accounts.
 * Never put the Supabase service-role key in browser JavaScript. */

var DEFAULT_ORIGINS = ['https://studymaf.com', 'https://www.studymaf.com', 'http://localhost:3000', 'http://localhost:8080'];

function config() {
  var url = process.env.SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Account service is not configured.');
  return { url: url.replace(/\/$/, ''), key: key };
}

function allowedOrigin(origin) {
  if (!origin) return true;
  var list = (process.env.STUDYMAF_ALLOWED_ORIGINS || '').split(',').map(function (item) { return item.trim(); }).filter(Boolean);
  return DEFAULT_ORIGINS.concat(list).indexOf(origin) >= 0;
}

function cors(req, res) {
  var origin = req.headers.origin || '';
  if (!allowedOrigin(origin)) { res.status(403).json({ error: 'This service is available only from StudyMAF.' }); return false; }
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return false; }
  return true;
}

function json(res, status, body) { res.status(status).json(body); }
function text(value, limit) { return typeof value === 'string' ? value.trim().slice(0, limit || 500) : ''; }
function email(value) { var result = text(value, 320).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result) ? result : ''; }
function code(value, limit) { return text(value, limit || 32).toUpperCase().replace(/[^A-Z0-9_-]/g, ''); }

async function db(path, options) {
  var c = config();
  options = options || {};
  var headers = Object.assign({ apikey: c.key, Authorization: 'Bearer ' + c.key, 'Content-Type': 'application/json' }, options.headers || {});
  var response = await fetch(c.url + '/rest/v1/' + path, Object.assign({}, options, { headers: headers }));
  var raw = await response.text();
  var data = raw ? JSON.parse(raw) : null;
  if (!response.ok) {
    var message = data && (data.message || data.hint || data.details) || 'Database request failed (' + response.status + ').';
    throw new Error(message);
  }
  return data;
}

async function deleteAuthUser(userId) {
  var c = config();
  var response = await fetch(c.url + '/auth/v1/admin/users/' + encodeURIComponent(userId), {
    method: 'DELETE',
    headers: { apikey: c.key, Authorization: 'Bearer ' + c.key }
  });
  var raw = await response.text(), data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch (error) {}
  if (!response.ok) throw new Error(data && (data.msg || data.message) || 'Could not remove this account.');
  return data;
}

async function ensureProfile(user) {
  var name = user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name);
  var body = { id: user.id, email: String(user.email || '').toLowerCase(), last_seen_at: new Date().toISOString() };
  // Do not overwrite a name chosen in StudyMAF settings with an empty OAuth/OTP profile.
  if (name) body.display_name = name;
  await db('profiles?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(body) });
  var roles = await db('user_roles?user_id=eq.' + encodeURIComponent(user.id) + '&select=role');
  if (!roles || !roles.length) {
    await db('user_roles?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ user_id: user.id, role: 'student' }) });
    return 'student';
  }
  return roles[0].role;
}

async function authenticated(req, res) {
  var header = req.headers.authorization || '';
  if (!/^Bearer\s+.+/i.test(header)) { json(res, 401, { error: 'Sign in required.' }); return null; }
  var c = config();
  var response = await fetch(c.url + '/auth/v1/user', { headers: { apikey: c.key, Authorization: header } });
  if (!response.ok) { json(res, 401, { error: 'Your session has expired. Please sign in again.' }); return null; }
  var user = await response.json();
  var role = await ensureProfile(user);
  return { user: user, role: role };
}

async function requireRole(req, res, roles) {
  var account = await authenticated(req, res);
  if (!account) return null;
  if (roles.indexOf(account.role) < 0) { json(res, 403, { error: 'You do not have access to this area.' }); return null; }
  return account;
}

async function ownedSection(sectionId, professorId) {
  var rows = await db('class_sections?id=eq.' + encodeURIComponent(sectionId) + '&professor_id=eq.' + encodeURIComponent(professorId) + '&select=id,course_id,section_label,term,join_code,is_active');
  return rows && rows[0] || null;
}

module.exports = { cors: cors, json: json, text: text, email: email, code: code, db: db, deleteAuthUser: deleteAuthUser, authenticated: authenticated, requireRole: requireRole, ownedSection: ownedSection };
