var recent = new Map();

function cors(req, res) {
  var origin = req.headers.origin || '';
  var allowed = /^https:\/\/(www\.)?studymaf\.com$/.test(origin) || /^https:\/\/studymaf\.com$/.test(origin);
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

module.exports = async function (req, res) {
  if (req.method === 'OPTIONS') { cors(req, res); return res.status(204).end(); }
  if (!cors(req, res)) return res.status(403).json({ error: 'This tutor is available only from StudyMAF.' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!rateOk(req)) return res.status(429).json({ error: 'Please wait a moment, then try again.' });
  var body = req.body || {}, question = typeof body.question === 'string' ? body.question.trim().slice(0, 2400) : '';
  if (!question) return res.status(400).json({ error: 'Please write a question.' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'The tutor is not configured yet.' });
  var lesson = typeof body.lesson_id === 'string' ? body.lesson_id.slice(0, 100) : 'the current lesson';
  var instructions = [
    'You are StudyMAF AI, a friendly physics study helper.',
    'Use plain, short sentences. Do not use fancy words.',
    'The student is working on: ' + lesson + '.',
    'Teach the method. Start with one useful hint or question. Do not dump a full answer unless the student asks for it.',
    'If a formula is needed, show it and explain every symbol in simple words.',
    'Do not pretend you can see their textbook or a problem that was not provided.'
  ].join(' ');
  try {
    var response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://studymaf.com',
        'X-OpenRouter-Title': 'StudyMAF Tutor'
      },
      body: JSON.stringify({ model: 'openrouter/free', messages: [{ role: 'system', content: instructions }, { role: 'user', content: question }], max_tokens: 500 })
    });
    var data = await response.json();
    if (!response.ok) throw new Error(data.error && data.error.message ? data.error.message : 'The free model is busy.');
    var answer = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!answer) throw new Error('The tutor did not return an answer.');
    res.status(200).json({ answer: String(answer).slice(0, 6000) });
  } catch (error) {
    res.status(502).json({ error: error.message || 'The tutor could not answer right now.' });
  }
};
