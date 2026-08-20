var auth = require('./_lib/studymaf-auth');

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  if (req.method !== 'GET') return auth.json(res, 405, { error: 'Method not allowed.' });
  try {
    var account = await auth.authenticated(req, res);
    if (!account) return;
    var courseId = auth.text(req.query && req.query.course_id, 80);
    if (courseId) {
      if (['professor', 'admin'].indexOf(account.role) < 0) return auth.json(res, 403, { error: 'Only professors and administrators can preview the full course library.' });
      var found = await auth.db('course_catalog?id=eq.' + encodeURIComponent(courseId) + '&is_active=eq.true&select=id,code,title,subject,description,lessons,textbooks&limit=1');
      if (!found || !found[0]) return auth.json(res, 404, { error: 'Course not found.' });
      found[0].course_documents = await auth.signedCourseDocuments(found[0].id);
      return auth.json(res, 200, { course: found[0] });
    }
    var courses = await auth.db('course_catalog?is_active=eq.true&select=id,code,title,subject,description,lessons,textbooks&order=code.asc');
    auth.json(res, 200, { courses: courses || [] });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not load the course catalog.' }); }
};
