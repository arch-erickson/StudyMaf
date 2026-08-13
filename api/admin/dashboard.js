var auth = require('../_lib/studymaf-auth');

function number(value) { return Math.max(0, Number(value) || 0); }
function bucket(map, key, label) {
  if (!map[key]) map[key] = { key: key, label: label || 'Unassigned class', total_time_seconds: 0, calculator_uses: 0, modes: { learn: 0, practice: 0, test: 0, study: 0 }, delivery: { online: 0, offline: 0 }, lessons: {}, completion_percent: null };
  return map[key];
}
function summarize(events, progressRows) {
  var users = {};
  function user(id) {
    if (!users[id]) users[id] = { total_time_seconds: 0, calculator_uses: 0, modes: { learn: 0, practice: 0, test: 0, study: 0 }, delivery: { online: 0, offline: 0 }, classes: {}, overall_completion_percent: null };
    return users[id];
  }
  (events || []).forEach(function (event) {
    var entry = user(event.user_id), seconds = number(event.duration_seconds), mode = event.study_mode || 'study', delivery = event.delivery_mode || 'offline';
    var classEntry = bucket(entry.classes, event.class_key || event.class_section_id || 'unassigned', event.class_name || event.course_code || 'Unassigned class');
    if (event.event_type === 'calculator_use') { entry.calculator_uses++; classEntry.calculator_uses++; return; }
    entry.total_time_seconds += seconds; classEntry.total_time_seconds += seconds;
    entry.modes[mode] = number(entry.modes[mode]) + seconds; classEntry.modes[mode] = number(classEntry.modes[mode]) + seconds;
    entry.delivery[delivery] = number(entry.delivery[delivery]) + seconds; classEntry.delivery[delivery] = number(classEntry.delivery[delivery]) + seconds;
    if (event.lesson_id) {
      if (!classEntry.lessons[event.lesson_id]) classEntry.lessons[event.lesson_id] = { lesson_id: event.lesson_id, total_time_seconds: 0 };
      classEntry.lessons[event.lesson_id].total_time_seconds += seconds;
    }
  });
  (progressRows || []).forEach(function (row) {
    var entry = user(row.user_id), state = row.state && typeof row.state === 'object' ? row.state : {}, classes = Array.isArray(state.classes) ? state.classes : [], progress = state.progress && typeof state.progress === 'object' ? state.progress : {};
    var totalSolved = 0, totalTarget = 0;
    classes.forEach(function (course) {
      var classEntry = bucket(entry.classes, course.id || 'unassigned', course.name || course.code || 'Class'), solved = 0, target = 0;
      (course.lessonIds || []).forEach(function (lessonId) {
        var p = progress[(course.id || '') + '::' + lessonId] || {}, done = p.solved != null ? number(p.solved) : Object.keys(p.done || {}).length;
        solved += done; target += number((course.lessonTargets || {})[lessonId]);
      });
      if (!target) target = solved;
      classEntry.completion_percent = target ? Math.round(Math.min(solved, target) / target * 100) : 0;
      totalSolved += solved; totalTarget += target;
    });
    entry.overall_completion_percent = totalTarget ? Math.round(Math.min(totalSolved, totalTarget) / totalTarget * 100) : 0;
  });
  Object.keys(users).forEach(function (id) { users[id].classes = Object.keys(users[id].classes).map(function (key) { var item = users[id].classes[key]; item.lessons = Object.keys(item.lessons).map(function (lesson) { return item.lessons[lesson]; }).sort(function (a, b) { return b.total_time_seconds - a.total_time_seconds; }); return item; }); });
  return users;
}

function hourlySeries(events) {
  var rows = {};
  (events || []).forEach(function (event) {
    var stamp = new Date(event.occurred_at || Date.now());
    if (isNaN(stamp.getTime())) return;
    var hour = new Date(Date.UTC(stamp.getUTCFullYear(), stamp.getUTCMonth(), stamp.getUTCDate(), stamp.getUTCHours())).toISOString();
    if (!rows[hour]) rows[hour] = { at: hour, study_seconds: 0, calculator_uses: 0, modes: { learn: 0, practice: 0, test: 0, study: 0 }, delivery: { online: 0, offline: 0 } };
    var row = rows[hour], seconds = number(event.duration_seconds), mode = event.study_mode || 'study', delivery = event.delivery_mode || 'offline';
    if (event.event_type === 'calculator_use') { row.calculator_uses++; return; }
    row.study_seconds += seconds;
    row.modes[mode] = number(row.modes[mode]) + seconds;
    row.delivery[delivery] = number(row.delivery[delivery]) + seconds;
  });
  return Object.keys(rows).sort().map(function (key) { return rows[key]; });
}

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  try {
    var account = await auth.requireRole(req, res, ['admin']);
    if (!account) return;
    if (req.method === 'DELETE') {
      var userId = auth.text((req.body || {}).user_id, 80);
      if (!userId) return auth.json(res, 400, { error: 'Choose an account to remove.' });
      if (userId === account.user.id) return auth.json(res, 400, { error: 'You cannot remove the administrator account you are using.' });
      var found = await auth.db('profiles?id=eq.' + encodeURIComponent(userId) + '&select=id,email');
      if (!found || !found[0]) return auth.json(res, 404, { error: 'This account no longer exists.' });
      var owned = await auth.db('class_sections?professor_id=eq.' + encodeURIComponent(userId) + '&select=id&limit=1');
      if (owned && owned.length) return auth.json(res, 409, { error: 'Move or remove this professor’s classes before removing their account.' });
      var targetRoles = await auth.db('user_roles?user_id=eq.' + encodeURIComponent(userId) + '&select=role');
      if (targetRoles && targetRoles[0] && targetRoles[0].role === 'admin') {
        var admins = await auth.db('user_roles?role=eq.admin&select=user_id');
        if (!admins || admins.length < 2) return auth.json(res, 409, { error: 'StudyMAF must keep at least one administrator account.' });
      }
      await auth.db('class_enrollments?student_id=eq.' + encodeURIComponent(userId), { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
      await auth.db('account_role_invites?email=eq.' + encodeURIComponent(found[0].email), { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
      await auth.deleteAuthUser(userId);
      return auth.json(res, 200, { removed: { id: userId, email: found[0].email } });
    }
    if (req.method !== 'GET') return auth.json(res, 405, { error: 'Method not allowed.' });
    var results = await Promise.all([
      auth.db('profiles?select=id,email,display_name,last_seen_at,created_at&order=created_at.desc&limit=500'),
      auth.db('user_roles?select=user_id,role,assigned_at'),
      auth.db('course_catalog?select=id,code,title,subject,is_active&order=code.asc'),
      auth.db('class_sections?select=id,section_label,term,professor_id,course_catalog(code,title),profiles!class_sections_professor_id_fkey(email,display_name)&order=created_at.desc'),
      auth.db('class_enrollments?select=class_section_id,student_id,student_email,status'),
      auth.db('account_role_invites?select=email,role,created_at&order=created_at.desc'),
      auth.db('account_activity_events?select=user_id,class_section_id,class_key,class_name,course_code,lesson_id,event_type,study_mode,delivery_mode,duration_seconds,occurred_at&order=occurred_at.desc&limit=20000'),
      auth.db('account_progress?select=user_id,state,updated_at')
    ]);
    auth.json(res, 200, { users: results[0] || [], roles: results[1] || [], courses: results[2] || [], classes: results[3] || [], enrollments: results[4] || [], professor_invites: results[5] || [], analytics: { generated_at: new Date().toISOString(), users: summarize(results[6], results[7]), hourly: hourlySeries(results[6]) } });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not load the admin dashboard.' }); }
};
