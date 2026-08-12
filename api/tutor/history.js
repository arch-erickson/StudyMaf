var tutor = require('../_lib/tutor');

module.exports = async function (req, res) {
  if (!tutor.requireActionToken(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });
  try {
    var key = tutor.requiredString(req.query.problem_key, 'problem_key');
    var rows = await tutor.supabase('tutor_problem_memory?problem_key=eq.' + encodeURIComponent(key) + '&select=problem_key,lesson_id,wrong_count,help_level,latest_misconception,last_wrong_at');
    res.status(200).json({ memory: rows[0] || null });
  } catch (error) { res.status(400).json({ error: error.message }); }
};
