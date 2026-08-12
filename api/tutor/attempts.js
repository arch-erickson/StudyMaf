var tutor = require('../_lib/tutor');

module.exports = async function (req, res) {
  if (!tutor.requireActionToken(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  try {
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
    res.status(200).json({ problem_key: problemKey, wrong_count: outcome === 'wrong' ? memory.wrong_count : prior.wrong_count, help_level: outcome === 'wrong' ? memory.help_level : prior.help_level });
  } catch (error) { res.status(400).json({ error: error.message }); }
};
