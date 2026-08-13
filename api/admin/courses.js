var auth = require('../_lib/studymaf-auth');

function documentBody(body, courseId, userId) {
  var kind = auth.text(body.kind, 20), path = auth.text(body.storage_path, 500), name = auth.text(body.original_name, 240), mime = auth.text(body.mime_type, 100), size = Math.max(0, Number(body.size_bytes) || 0);
  if (['syllabus', 'textbook'].indexOf(kind) < 0) throw new Error('Choose a syllabus or textbook PDF.');
  if (!name || mime !== 'application/pdf' || !/\.pdf$/i.test(name)) throw new Error('Only PDF source documents can be added.');
  if (size < 1 || size > 52428800) throw new Error('Each source PDF must be between 1 byte and 50 MB.');
  if (path.indexOf(courseId + '/' + kind + '/') !== 0 || !/^[a-zA-Z0-9_./-]+$/.test(path)) throw new Error('The uploaded document path is not valid.');
  return { course_id: courseId, kind: kind, original_name: name, storage_bucket: 'course-source', storage_path: path, mime_type: mime, size_bytes: size, processing_status: 'uploaded', uploaded_by: userId };
}

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
    var body = req.body || {};
    if (req.method === 'PATCH' && body.action === 'attach_document') {
      var uploadCourseId = auth.text(body.id, 80);
      if (!uploadCourseId) return auth.json(res, 400, { error: 'Course id is required.' });
      var existing = await auth.db('course_catalog?id=eq.' + encodeURIComponent(uploadCourseId) + '&select=id');
      if (!existing || !existing[0]) return auth.json(res, 404, { error: 'That course no longer exists.' });
      var document = documentBody(body, uploadCourseId, account.user.id);
      var savedDocument = await auth.db('course_documents', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(document) });
      return auth.json(res, 201, { document: savedDocument && savedDocument[0] });
    }
    if (req.method === 'PATCH' && body.action === 'queue_ingestion') {
      var queueCourseId = auth.text(body.id, 80);
      if (!queueCourseId) return auth.json(res, 400, { error: 'Course id is required.' });
      var sourceDocuments = await auth.db('course_documents?course_id=eq.' + encodeURIComponent(queueCourseId) + '&select=id,kind');
      if (!(sourceDocuments || []).some(function (item) { return item.kind === 'syllabus'; })) return auth.json(res, 400, { error: 'Upload a syllabus before requesting a course build.' });
      await auth.db('course_documents?course_id=eq.' + encodeURIComponent(queueCourseId) + '&processing_status=eq.uploaded', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ processing_status: 'queued', processing_note: 'Waiting for the StudyMAF course builder.' }) });
      var job = await auth.db('course_ingestion_jobs', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ course_id: queueCourseId, requested_by: account.user.id, status: 'queued', message: 'Source PDFs are stored privately and ready for course processing.' }) });
      return auth.json(res, 201, { job: job && job[0] });
    }
    var course = { code: auth.code(body.code, 32), title: auth.text(body.title, 180), subject: auth.text(body.subject, 60).toLowerCase(), description: auth.text(body.description, 1000), lessons: Array.isArray(body.lessons) ? body.lessons : [], textbooks: Array.isArray(body.textbooks) ? body.textbooks : [], is_active: body.source_upload ? false : body.is_active !== false };
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
