var auth = require('../_lib/studymaf-auth');

function validState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  // This endpoint stores progress, not uploaded files or screenshots.
  return JSON.stringify(value).length <= 240000 ? value : null;
}

function activityRows(value, account) {
  var events = Array.isArray(value) ? value.slice(0, 30) : [];
  return events.map(function (event) {
    event = event && typeof event === 'object' ? event : {};
    var type = event.event_type === 'calculator_use' ? 'calculator_use' : 'study_time';
    var mode = ['learn', 'practice', 'test'].indexOf(event.study_mode) >= 0 ? event.study_mode : 'study';
    var delivery = event.delivery_mode === 'online' ? 'online' : 'offline';
    var seconds = Math.max(0, Math.min(300, Math.floor(Number(event.duration_seconds) || 0)));
    if (type === 'study_time' && seconds < 5) return null;
    return {
      user_id: account.user.id,
      class_section_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(event.class_section_id || '')) ? event.class_section_id : null,
      class_key: auth.text(event.class_key, 120),
      class_name: auth.text(event.class_name, 180),
      course_code: auth.code(event.course_code, 32),
      lesson_id: auth.text(event.lesson_id, 120),
      event_type: type,
      study_mode: mode,
      delivery_mode: delivery,
      duration_seconds: type === 'calculator_use' ? 0 : seconds
    };
  }).filter(Boolean);
}

module.exports = async function handler(req, res) {
  if (!auth.cors(req, res)) return;
  try {
    var account = await auth.authenticated(req, res);
    if (!account) return;
    if (req.method === 'GET') {
      var rows = await auth.db('account_progress?user_id=eq.' + encodeURIComponent(account.user.id) + '&select=state,updated_at');
      return auth.json(res, 200, { progress: rows && rows[0] || null });
    }
    if (req.method === 'POST') {
      var events = activityRows((req.body || {}).events, account);
      if (!events.length) return auth.json(res, 400, { error: 'No valid activity was supplied.' });
      await auth.db('account_activity_events', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(events) });
      return auth.json(res, 201, { saved: events.length });
    }
    if (req.method !== 'PUT') return auth.json(res, 405, { error: 'Method not allowed.' });
    var state = validState((req.body || {}).state);
    if (!state) return auth.json(res, 400, { error: 'Progress data is invalid or too large.' });
    var payload = { user_id: account.user.id, state: state, updated_at: new Date().toISOString() };
    var saved = await auth.db('account_progress?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(payload) });
    return auth.json(res, 200, { progress: saved && saved[0] });
  } catch (error) { auth.json(res, 500, { error: error.message || 'Could not save your progress.' }); }
};
