var auth = require('../_lib/studymaf-auth');

function number(value) { return Math.max(0, Number(value) || 0); }
function chunks(items, size) { var out = []; for (var i = 0; i < items.length; i += size) out.push(items.slice(i, i + size)); return out; }
function profileOf(row) { var value = row && row.profiles; return Array.isArray(value) ? value[0] || {} : value || {}; }
function sectionKey(section) { return 'server-' + section.id; }

function progressFor(studentId, state, section, course) {
  state = state && typeof state === 'object' ? state : {};
  var classes = Array.isArray(state.classes) ? state.classes : [];
  var cls = classes.filter(function (item) { return item && (item.serverSectionId === section.id || item.id === section.id || item.id === sectionKey(section)); })[0] || {};
  var lessonIds = cls.lessonIds || (course.lessons || []).map(function (lesson) { return lesson.id; }) || [];
  var targets = cls.lessonTargets || {}, all = state.progress && typeof state.progress === 'object' ? state.progress : {}, totals = { xp: 0, solved: 0, target: 0, lessons: [] };
  lessonIds.forEach(function (lessonId) {
    var item = all[(cls.id || sectionKey(section)) + '::' + lessonId] || {}, solved = item.solved != null ? number(item.solved) : Object.keys(item.done || {}).length, target = number(targets[lessonId]);
    totals.xp += number(item.xp); totals.solved += solved; totals.target += target;
    totals.lessons.push({ lesson_id: lessonId, xp: number(item.xp), solved: solved, target: target, completion_percent: target ? Math.round(Math.min(solved, target) / target * 100) : 0 });
  });
  totals.completion_percent = totals.target ? Math.round(Math.min(totals.solved, totals.target) / totals.target * 100) : 0;
  return totals;
}

function activityFor(studentId, events) {
  var result = { total_time_seconds: 0, calculator_uses: 0, modes: { learn: 0, practice: 0, test: 0, study: 0 }, delivery: { online: 0, offline: 0 }, lessons: {} };
  (events || []).filter(function (event) { return event.user_id === studentId; }).forEach(function (event) {
    if (event.event_type === 'calculator_use') { result.calculator_uses++; return; }
    var seconds = number(event.duration_seconds), mode = event.study_mode || 'study', delivery = event.delivery_mode || 'offline';
    result.total_time_seconds += seconds; result.modes[mode] = number(result.modes[mode]) + seconds; result.delivery[delivery] = number(result.delivery[delivery]) + seconds;
    if (event.lesson_id) result.lessons[event.lesson_id] = number(result.lessons[event.lesson_id]) + seconds;
  });
  return result;
}

function tutorFor(studentId, attempts, memories) {
  var prefix = studentId + ':', result = { total: 0, correct: 0, wrong: 0, problems_missed: 0 };
  (attempts || []).filter(function (item) { return String(item.problem_key || '').indexOf(prefix) === 0; }).forEach(function (item) { result.total++; result[item.outcome] = number(result[item.outcome]) + 1; });
  (memories || []).filter(function (item) { return String(item.problem_key || '').indexOf(prefix) === 0 && number(item.wrong_count) > 0; }).forEach(function () { result.problems_missed++; });
  return result;
}

async function tutorRows(table, studentIds, fields) {
  if (!studentIds.length) return [];
  var groups = chunks(studentIds, 35);
  var all = await Promise.all(groups.map(function (group) {
    var clause = '(' + group.map(function (id) { return 'problem_key.like.' + id + ':*'; }).join(',') + ')';
    return auth.db(table + '?or=' + encodeURIComponent(clause) + '&select=' + fields + '&limit=5000');
  }));
  return [].concat.apply([], all);
}

async function detail(account, sectionId) {
  var section;
  if (account.role === 'admin') {
    var sections = await auth.db('class_sections?id=eq.' + encodeURIComponent(sectionId) + '&select=id,course_id,section_label,term,is_active,created_at,course_catalog(id,code,title,subject,description,lessons,textbooks)');
    section = sections && sections[0];
  } else {
    var owned = await auth.ownedSection(sectionId, account.user.id);
    if (owned) {
      var ownRows = await auth.db('class_sections?id=eq.' + encodeURIComponent(sectionId) + '&select=id,course_id,section_label,term,is_active,created_at,course_catalog(id,code,title,subject,description,lessons,textbooks)');
      section = ownRows && ownRows[0];
    }
  }
  if (!section) throw new Error('Class not found.');

  var enrolled = await auth.db('class_enrollments?class_section_id=eq.' + encodeURIComponent(section.id) + '&select=student_id,student_email,status,invited_at,joined_at,profiles(id,email,display_name,last_seen_at)&order=student_email.asc');
  var studentIds = (enrolled || []).filter(function (row) { return row.student_id && row.status !== 'removed'; }).map(function (row) { return row.student_id; });
  var results = await Promise.all([
    studentIds.length ? auth.db('account_progress?user_id=in.(' + studentIds.map(encodeURIComponent).join(',') + ')&select=user_id,state,updated_at') : Promise.resolve([]),
    auth.db('account_activity_events?class_section_id=eq.' + encodeURIComponent(section.id) + '&select=user_id,lesson_id,event_type,study_mode,delivery_mode,duration_seconds&limit=20000'),
    tutorRows('tutor_attempts', studentIds, 'problem_key,outcome,lesson_id,created_at'),
    tutorRows('tutor_problem_memory', studentIds, 'problem_key,wrong_count,lesson_id')
  ]);
  var progressRows = results[0] || [], eventRows = results[1] || [], attemptRows = results[2] || [], memoryRows = results[3] || [], byProgress = {};
  progressRows.forEach(function (row) { byProgress[row.user_id] = row; });
  var course = section.course_catalog || {};
  course.course_documents = await auth.signedCourseDocuments(course.id);
  var students = (enrolled || []).map(function (enrollment) {
    var profile = profileOf(enrollment), id = enrollment.student_id, progress = id ? progressFor(id, (byProgress[id] || {}).state, section, course) : progressFor('', {}, section, course), activity = id ? activityFor(id, eventRows) : activityFor('', []), tutor = id ? tutorFor(id, attemptRows, memoryRows) : tutorFor('', [], []);
    return { id: id || '', email: profile.email || enrollment.student_email, display_name: profile.display_name || '', status: enrollment.status, invited_at: enrollment.invited_at, joined_at: enrollment.joined_at, last_seen_at: profile.last_seen_at || null, progress: progress, activity: activity, attempts: tutor };
  });
  return { section: section, students: students, analytics: { student_count: students.length, active_student_count: students.filter(function (student) { return !!student.id; }).length } };
}

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  try {
    var account = await auth.requireRole(req, res, ['professor', 'admin']);
    if (!account) return;
    if (req.method === 'GET') {
      var sectionId = auth.text(req.query && req.query.class_id, 80);
      if (sectionId) return auth.json(res, 200, await detail(account, sectionId));
      var filter = account.role === 'admin' ? '' : 'professor_id=eq.' + encodeURIComponent(account.user.id) + '&';
      var rows = await auth.db('class_sections?' + filter + 'select=id,section_label,term,is_active,created_at,course_catalog(id,code,title,subject)&order=created_at.desc');
      return auth.json(res, 200, { classes: rows || [] });
    }
    if (req.method !== 'POST') return auth.json(res, 405, { error: 'Method not allowed.' });
    if (account.role !== 'professor') return auth.json(res, 403, { error: 'Only professors can create a class section.' });
    var body = req.body || {}, courseId = auth.text(body.course_id, 80);
    if (!courseId) return auth.json(res, 400, { error: 'Choose a course.' });
    var courses = await auth.db('course_catalog?id=eq.' + encodeURIComponent(courseId) + '&is_active=eq.true&select=id');
    if (!courses || !courses.length) return auth.json(res, 400, { error: 'That course is not available.' });
    var privateCode = 'PRIVATE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    var section = { course_id: courseId, professor_id: account.user.id, section_label: auth.text(body.section_label, 100) || 'Section 1', term: auth.text(body.term, 80), join_code: privateCode };
    var created = await auth.db('class_sections', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(section) });
    return auth.json(res, 201, { class: created && created[0] });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not manage classes.' }); }
};
