var tutor = require('./_lib/tutor');

function action(req) {
  var query = req.query || {};
  if (query.action) return String(query.action);
  try { return new URL(req.url, 'http://localhost').searchParams.get('action') || ''; } catch (error) { return ''; }
}

module.exports = async function (req, res) {
  if (!tutor.requireActionToken(req, res)) return;
  var route = action(req);

  try {
    if (route === 'history') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });
      var key = tutor.requiredString(req.query.problem_key, 'problem_key');
      var rows = await tutor.supabase('tutor_problem_memory?problem_key=eq.' + encodeURIComponent(key) + '&select=problem_key,lesson_id,wrong_count,help_level,latest_misconception,last_wrong_at');
      return res.status(200).json({ memory: rows[0] || null });
    }

    if (route === 'attempts') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
      var body = req.body || {};
      var problemKey = tutor.requiredString(body.problem_key, 'problem_key');
      var lessonId = tutor.requiredString(body.lesson_id, 'lesson_id');
      var outcome = body.outcome === 'correct' ? 'correct' : body.outcome === 'wrong' ? 'wrong' : null;
      if (!outcome) throw new Error('outcome must be wrong or correct.');
      var misconception = typeof body.misconception === 'string' ? body.misconception.slice(0, 500) : null;
      var previous = await tutor.supabase('tutor_problem_memory?problem_key=eq.' + encodeURIComponent(problemKey) + '&select=wrong_count,help_level');
      var prior = previous[0] || { wrong_count: 0, help_level: 0 };
      var memory = { problem_key: problemKey, lesson_id: lessonId, updated_at: new Date().toISOString() };
      if (outcome === 'wrong') {
        memory.wrong_count = prior.wrong_count + 1;
        memory.help_level = Math.min(prior.help_level + 1, 3);
        memory.latest_misconception = misconception;
        memory.last_wrong_at = memory.updated_at;
      }
      await tutor.supabase('tutor_problem_memory?on_conflict=problem_key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(memory) });
      await tutor.supabase('tutor_attempts', { method: 'POST', body: JSON.stringify({ problem_key: problemKey, lesson_id: lessonId, outcome: outcome, misconception: misconception }) });
      return res.status(200).json({ problem_key: problemKey, wrong_count: outcome === 'wrong' ? memory.wrong_count : prior.wrong_count, help_level: outcome === 'wrong' ? memory.help_level : prior.help_level });
    }

    return res.status(404).json({ error: 'Tutor memory route not found.' });
  } catch (error) { return res.status(400).json({ error: error.message || 'Invalid tutor memory request.' }); }
};
