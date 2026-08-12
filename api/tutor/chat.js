var recent = new Map();
var tutor = require('../_lib/tutor');

function cors(req, res) {
  var origin = req.headers.origin || '';
  var allowed = /^https:\/\/(www\.)?studymaf\.com$/.test(origin) || /^https:\/\/localhost(?::\d+)?$/.test(origin);
  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return !origin || allowed;
}

function rateOk(req) {
  var ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  var now = Date.now(), history = (recent.get(ip) || []).filter(function (t) { return now - t < 60000; });
  if (history.length >= 8) return false;
  history.push(now); recent.set(ip, history); return true;
}

function text(value, limit) { return typeof value === 'string' ? value.trim().slice(0, limit) : ''; }
function cleanContext(raw) {
  raw = raw && typeof raw === 'object' ? raw : {};
  return {
    page: text(raw.page, 120), learner_id: text(raw.learner_id, 100), class_name: text(raw.class_name, 160), lesson_id: text(raw.lesson_id, 100),
    lesson_title: text(raw.lesson_title, 200), lesson_summary: text(raw.lesson_summary, 1200), chapter: text(raw.chapter, 120),
    textbook: text(raw.textbook, 350), question_id: text(raw.question_id, 160), question_prompt: text(raw.question_prompt, 2400),
    hint: text(raw.hint, 800), difficulty: text(raw.difficulty, 40), source: text(raw.source, 160)
  };
}

async function problemMemory(context) {
  if (!context.question_id || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    var key = encodeURIComponent((context.learner_id || 'legacy') + ':' + (context.lesson_id || 'studymaf') + ':' + context.question_id);
    var result = await tutor.supabase('tutor_problem_memory?problem_key=eq.' + key + '&select=wrong_count,help_level,latest_misconception');
    return result[0] || null;
  } catch (error) { return null; }
}

module.exports = async function (req, res) {
  if (req.method === 'OPTIONS') { cors(req, res); return res.status(204).end(); }
  if (!cors(req, res)) return res.status(403).json({ error: 'This tutor is available only from StudyMAF.' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!rateOk(req)) return res.status(429).json({ error: 'Please wait a moment, then try again.' });

  var body = req.body || {}, question = text(body.question, 2400), context = cleanContext(body.context);
  if (!context.lesson_id) context.lesson_id = text(body.lesson_id, 100);
  if (!context.page) context.page = text(body.page, 160);
  var image = text(body.image_data, 1800000);
  if (!question) return res.status(400).json({ error: 'Please write a question.' });
  if (image && !/^data:image\/(png|jpeg|webp|gif);base64,/.test(image)) return res.status(400).json({ error: 'That image format is not supported.' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'The tutor is not configured yet.' });

  var memory = await problemMemory(context);
  var instructions = [
    'You are Rho (ρ), the StudyMAF tutor. Be warm, calm, and direct.',
    'Use very simple words and short sentences. Avoid fancy language.',
    'Teach the method. Start with one clear hint or a question. Do not give a full final answer unless the student asks for it.',
    'If you use a formula, show it and explain each symbol in plain words.',
    'Use the exact StudyMAF context below. Never claim to see a page, diagram, textbook passage, or answer that was not supplied.',
    'The textbook line is a course reference, not the full textbook. You may say “This connects to [chapter]” but must not invent a quotation or page number.',
    context.lesson_title ? 'Lesson: ' + context.lesson_title + '.' : '',
    context.lesson_summary ? 'Lesson summary: ' + context.lesson_summary : '',
    context.chapter ? 'Assigned textbook chapter: ' + context.chapter + '.' : '',
    context.textbook ? 'Course books: ' + context.textbook + '.' : '',
    context.question_prompt ? 'Exact problem: ' + context.question_prompt : '',
    context.hint ? 'Existing StudyMAF hint: ' + context.hint : '',
    memory && memory.wrong_count ? 'This problem has been missed ' + memory.wrong_count + ' time(s). Give a more concrete explanation and focus on the likely mix-up: ' + (memory.latest_misconception || 'identify the first step that is confusing.') : '',
    image ? 'The student attached a photo. Inspect it carefully. State what you can read, then point to the first useful next step.' : ''
  ].filter(Boolean).join('\n');
  var userContent = image ? [{ type: 'text', text: question }, { type: 'image_url', image_url: { url: image } }] : question;
  try {
    var response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://studymaf.com', 'X-OpenRouter-Title': 'StudyMAF Tutor' },
      body: JSON.stringify({ model: 'openrouter/free', messages: [{ role: 'system', content: instructions }, { role: 'user', content: userContent }], max_tokens: 500 })
    });
    var data = await response.json();
    if (!response.ok) throw new Error(data.error && data.error.message ? data.error.message : (image ? 'A free vision model is busy. Try again in a moment.' : 'The free model is busy.'));
    var answer = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!answer) throw new Error('The tutor did not return an answer.');
    res.status(200).json({ answer: String(answer).slice(0, 6000), context_used: { lesson_id: context.lesson_id, question_id: context.question_id, chapter: context.chapter } });
  } catch (error) { res.status(502).json({ error: error.message || 'The tutor could not answer right now.' }); }
};
