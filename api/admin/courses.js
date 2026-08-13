var auth = require('../_lib/studymaf-auth');

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  try {
    var account = await auth.requireRole(req, res, ['admin']);
    if (!account) return;
    if (req.method === 'GET') {
      var courses = await auth.db('course_catalog?select=*&order=code.asc');
      return auth.json(res, 200, { courses: courses || [] });
    }
    if (req.method !== 'POST' && req.method !== 'PATCH') return auth.json(res, 405, { error: 'Method not allowed.' });
    var body = req.body || {}, course = { code: auth.code(body.code, 32), title: auth.text(body.title, 180), subject: auth.text(body.subject, 60).toLowerCase(), description: auth.text(body.description, 1000), lessons: Array.isArray(body.lessons) ? body.lessons : [], textbooks: Array.isArray(body.textbooks) ? body.textbooks : [], is_active: body.is_active !== false };
    if (!course.code || !course.title || !course.subject) return auth.json(res, 400, { error: 'Code, title, and subject are required.' });
    if (req.method === 'POST') {
      var created = await auth.db('course_catalog', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(course) });
      return auth.json(res, 201, { course: created && created[0] });
    }
    var id = auth.text(body.id, 80);
    if (!id) return auth.json(res, 400, { error: 'Course id is required.' });
    var updated = await auth.db('course_catalog?id=eq.' + encodeURIComponent(id), { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(course) });
    return auth.json(res, 200, { course: updated && updated[0] });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not manage courses.' }); }
};
