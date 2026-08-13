var auth = require('../_lib/studymaf-auth');

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  try {
    var account = await auth.requireRole(req, res, ['professor', 'admin']);
    if (!account) return;
    var body = req.body || {}, sectionId = auth.text((req.query && req.query.class_id) || body.class_id, 80);
    if (!sectionId) return auth.json(res, 400, { error: 'class_id is required.' });
    var section = await auth.ownedSection(sectionId, account.user.id);
    if (!section && account.role !== 'admin') return auth.json(res, 404, { error: 'Class not found.' });
    if (req.method === 'GET') {
      var students = await auth.db('class_enrollments?class_section_id=eq.' + encodeURIComponent(sectionId) + '&select=id,student_email,status,invited_at,joined_at,profiles(id,email,display_name,last_seen_at)&order=student_email.asc');
      return auth.json(res, 200, { students: students || [] });
    }
    if (req.method !== 'POST') return auth.json(res, 405, { error: 'Method not allowed.' });
    var studentEmail = auth.email(body.student_email);
    if (!studentEmail) return auth.json(res, 400, { error: 'Enter a valid student email.' });
    var existing = await auth.db('profiles?email=eq.' + encodeURIComponent(studentEmail) + '&select=id');
    var enrollment = { class_section_id: sectionId, student_email: studentEmail, student_id: existing && existing[0] ? existing[0].id : null, status: existing && existing[0] ? 'active' : 'invited', joined_at: existing && existing[0] ? new Date().toISOString() : null };
    var saved = await auth.db('class_enrollments?on_conflict=class_section_id,student_email', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(enrollment) });
    return auth.json(res, 201, { student: saved && saved[0] });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not manage students.' }); }
};
