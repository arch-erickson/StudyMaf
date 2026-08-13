var auth = require('../_lib/studymaf-auth');

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  try {
    var account = await auth.requireRole(req, res, ['professor', 'admin']);
    if (!account) return;
    if (req.method === 'GET') {
      var rows = await auth.db('class_sections?professor_id=eq.' + encodeURIComponent(account.user.id) + '&select=id,section_label,term,join_code,is_active,created_at,course_catalog(id,code,title,subject)&order=created_at.desc');
      return auth.json(res, 200, { classes: rows || [] });
    }
    if (req.method !== 'POST') return auth.json(res, 405, { error: 'Method not allowed.' });
    var body = req.body || {}, courseId = auth.text(body.course_id, 80);
    if (!courseId) return auth.json(res, 400, { error: 'Choose a course.' });
    var courses = await auth.db('course_catalog?id=eq.' + encodeURIComponent(courseId) + '&is_active=eq.true&select=id');
    if (!courses || !courses.length) return auth.json(res, 400, { error: 'That course is not available.' });
    // The database keeps an internal unique value for legacy compatibility, but
    // students are enrolled directly by their professor—there is no join-code UI.
    var privateCode = 'PRIVATE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    var section = { course_id: courseId, professor_id: account.user.id, section_label: auth.text(body.section_label, 100) || 'Section 1', term: auth.text(body.term, 80), join_code: privateCode };
    var created = await auth.db('class_sections', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(section) });
    return auth.json(res, 201, { class: created && created[0] });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not manage classes.' }); }
};
