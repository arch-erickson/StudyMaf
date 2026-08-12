var recent = new Map();
var tutor = require('../_lib/tutor');

function allowed(req, res) {
  var origin = req.headers.origin || '';
  var ok = /^https:\/\/(www\.)?studymaf\.com$/.test(origin) || /^https:\/\/localhost(?::\d+)?$/.test(origin);
  if (ok) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return !origin || ok;
}
function safe(value, length) { return typeof value === 'string' ? value.trim().slice(0, length) : ''; }
function rateOk(req) {
  var ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(), now = Date.now();
  var hits = (recent.get(ip) || []).filter(function (time) { return now - time < 60000; }); if (hits.length >= 30) return false; hits.push(now); recent.set(ip, hits); return true;
}

module.exports = async function (req, res) {
  if (req.method === 'OPTIONS') { allowed(req, res); return res.status(204).end(); }
  if (!allowed(req, res)) return res.status(403).json({ error: 'This tutor is available only from StudyMAF.' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!rateOk(req)) return res.status(429).json({ error: 'Please wait a moment.' });
  try {
    var body = req.body || {}, context = body.context || {}, learner = safe(context.learner_id, 100), lesson = safe(context.lesson_id, 100), question = safe(context.question_id, 160);
    var outcome = body.outcome === 'correct' ? 'correct' : body.outcome === 'wrong' ? 'wrong' : '';
    if (!learner || !lesson || !question || !outcome) return res.status(400).json({ error: 'Missing attempt context.' });
    var problemKey = learner + ':' + lesson + ':' + question;
    var previous = await tutor.supabase('tutor_problem_memory?problem_key=eq.' + encodeURIComponent(problemKey) + '&select=wrong_count,help_level');
    var prior = previous[0] || { wrong_count: 0, help_level: 0 }, now = new Date().toISOString();
    var memory = { problem_key: problemKey, lesson_id: lesson, updated_at: now };
    if (outcome === 'wrong') { memory.wrong_count = prior.wrong_count + 1; memory.help_level = Math.min(prior.help_level + 1, 3); memory.latest_misconception = safe(context.question_prompt, 500); memory.last_wrong_at = now; }
    await tutor.supabase('tutor_problem_memory?on_conflict=problem_key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(memory) });
    await tutor.supabase('tutor_attempts', { method: 'POST', body: JSON.stringify({ problem_key: problemKey, lesson_id: lesson, outcome: outcome }) });
    res.status(200).json({ ok: true, wrong_count: outcome === 'wrong' ? memory.wrong_count : prior.wrong_count });
  } catch (error) { res.status(503).json({ error: 'Could not save this attempt.' }); }
};
