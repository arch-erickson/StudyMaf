var auth = require('../_lib/studymaf-auth');

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  if (req.method !== 'GET') return auth.json(res, 405, { error: 'Method not allowed.' });
  try {
    var account = await auth.authenticated(req, res);
    if (!account) return;
    var uid = account.user.id, email = String(account.user.email || '').toLowerCase();
    // Link any invited-by-email enrollments to this signed-in student so that classes
    // a professor added them to appear immediately — no join code required.
    if (email) {
      try {
        await auth.db('class_enrollments?student_email=eq.' + encodeURIComponent(email) + '&student_id=is.null&status=eq.invited', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ student_id: uid, status: 'active', joined_at: new Date().toISOString() }) });
      } catch (linkError) { /* Non-fatal: the class list below still resolves by email. */ }
    }
    // Match by email (professors always enroll by email) so the roster and the student
    // dashboard stay in sync whether or not the enrollment was linked to an account id.
    var rows = await auth.db('class_enrollments?student_email=eq.' + encodeURIComponent(email) + '&status=neq.removed&select=id,status,joined_at,class_sections(id,section_label,term,join_code,course_catalog(id,code,title,subject,description,lessons,textbooks))&order=joined_at.desc');
    await Promise.all((rows || []).map(async function (row) {
      var section = row.class_sections || {}, course = section.course_catalog || {};
      if (course.id) course.course_documents = await auth.signedCourseDocuments(course.id);
    }));
    auth.json(res, 200, { classes: rows || [] });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not load your classes.' }); }
};
