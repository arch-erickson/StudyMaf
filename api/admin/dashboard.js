var auth = require('../_lib/studymaf-auth');

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  if (req.method !== 'GET') return auth.json(res, 405, { error: 'Method not allowed.' });
  try {
    var account = await auth.requireRole(req, res, ['admin']);
    if (!account) return;
    var results = await Promise.all([
      auth.db('profiles?select=id,email,display_name,last_seen_at,created_at&order=created_at.desc&limit=100'),
      auth.db('user_roles?select=user_id,role,assigned_at'),
      auth.db('course_catalog?select=id,code,title,subject,is_active&order=code.asc'),
      auth.db('class_sections?select=id,section_label,term,join_code,professor_id,course_catalog(code,title),profiles!class_sections_professor_id_fkey(email,display_name)&order=created_at.desc')
    ]);
    auth.json(res, 200, { users: results[0] || [], roles: results[1] || [], courses: results[2] || [], classes: results[3] || [] });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not load the admin dashboard.' }); }
};
