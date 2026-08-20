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
    // Resolve the three tables explicitly rather than relying on a nested REST
    // relation shape. This keeps each enrolled class visible even while the
    // PostgREST relationship cache is refreshing after schema changes.
    var rows = await auth.db('class_enrollments?student_email=eq.' + encodeURIComponent(email) + '&status=neq.removed&select=id,status,joined_at,class_section_id&order=joined_at.desc');
    var sectionIds = (rows || []).map(function (row) { return row.class_section_id; }).filter(Boolean);
    var sections = sectionIds.length ? await auth.db('class_sections?id=in.(' + sectionIds.map(encodeURIComponent).join(',') + ')&select=id,section_label,term,join_code,course_id') : [];
    var sectionsById = (sections || []).reduce(function (map, section) { map[section.id] = section; return map; }, {});
    var courseIds = (sections || []).map(function (section) { return section.course_id; }).filter(Boolean);
    var courses = courseIds.length ? await auth.db('course_catalog?id=in.(' + courseIds.map(encodeURIComponent).join(',') + ')&select=id,code,title,subject,description,lessons,textbooks') : [];
    var coursesById = (courses || []).reduce(function (map, course) { map[course.id] = course; return map; }, {});
    rows = (rows || []).map(function (row) {
      var section = sectionsById[row.class_section_id] || {};
      row.class_sections = Object.assign({}, section, { course_catalog: coursesById[section.course_id] || {} });
      return row;
    });
    // Source PDFs are an optional enhancement. A missing/processing source file
    // must never prevent a student's enrolled class cards from loading.
    await Promise.all((rows || []).map(async function (row) {
      var section = row.class_sections || {}, course = section.course_catalog || {};
      course.course_documents = [];
      if (!course.id) return;
      try { course.course_documents = await auth.signedCourseDocuments(course.id); }
      catch (documentError) { /* The class remains available while documents retry later. */ }
    }));
    auth.json(res, 200, { classes: rows || [] });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not load your classes.' }); }
};
