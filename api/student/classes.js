var auth = require('../_lib/studymaf-auth');

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  if (req.method !== 'GET') return auth.json(res, 405, { error: 'Method not allowed.' });
  try {
    var account = await auth.authenticated(req, res);
    if (!account) return;
    var rows = await auth.db('class_enrollments?student_id=eq.' + encodeURIComponent(account.user.id) + '&status=eq.active&select=id,status,joined_at,class_sections(id,section_label,term,join_code,course_catalog(id,code,title,subject,description,lessons,textbooks))&order=joined_at.desc');
    await Promise.all((rows || []).map(async function (row) {
      var section = row.class_sections || {}, course = section.course_catalog || {};
      if (course.id) course.course_documents = await auth.signedCourseDocuments(course.id);
    }));
    auth.json(res, 200, { classes: rows || [] });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not load your classes.' }); }
};
