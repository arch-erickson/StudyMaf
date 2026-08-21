var tutor = require('./_lib/tutor');
var auth = require('./_lib/studymaf-auth');
var practice = require('./_lib/tutor-practice');
var crypto = require('crypto');

function action(req) {
  var query = req.query || {};
  if (query.action) return String(query.action);
  try { return new URL(req.url, 'http://localhost').searchParams.get('action') || ''; } catch (error) { return ''; }
}

function decodedDataUrl(value, allowedTypes, maxBytes) {
  var raw = String(value || ''), match = raw.match(/^data:([a-z0-9/+.-]+);base64,([a-z0-9+/=\s]+)$/i);
  if (!match || allowedTypes.indexOf(match[1].toLowerCase()) < 0) throw new Error('That file type is not supported.');
  var body = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!body.length || body.length > maxBytes) throw new Error('That file must be 4 MB or smaller.');
  return { mime: match[1].toLowerCase(), buffer: body };
}

function safeName(value, fallback) {
  var name = String(value || fallback || 'upload').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);
  return name || fallback || 'upload';
}

function extensionFor(mime) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf' }[mime] || 'bin';
}

function nowPath(userId, prefix, mime, name) {
  return String(userId).replace(/[^a-z0-9-]/ig, '') + '/' + prefix + '/' + Date.now() + '-' + crypto.randomUUID() + '-' + safeName(name, 'file.' + extensionFor(mime));
}

async function activeStudentAccount(req, res) {
  return auth.requireWorkspace(req, res, ['student']);
}

async function weakLessons(account, lessonIds, supplied) {
  var keyPrefix = encodeURIComponent(account.user.id + ':');
  var rows = await auth.db('tutor_problem_memory?problem_key=like.' + keyPrefix + '*&select=lesson_id,wrong_count');
  var allowed = (lessonIds || []).reduce(function (map, id) { map[String(id)] = true; return map; }, {}), result = {};
  (rows || []).forEach(function (row) { if (allowed[row.lesson_id]) result[row.lesson_id] = (result[row.lesson_id] || 0) + Math.max(0, Number(row.wrong_count) || 0); });
  (Array.isArray(supplied) ? supplied : []).slice(-100).forEach(function (row) {
    if (!row || !allowed[row.lesson_id]) return;
    if (row.outcome === 'wrong') result[row.lesson_id] = (result[row.lesson_id] || 0) + 1;
  });
  return result;
}

async function rememberExamAttempt(account, body, outcome) {
  var lessonId = practice.text(body.lesson_id, 120), questionId = practice.text(body.question_id, 160);
  if (!lessonId || !questionId) return;
  var problemKey = account.user.id + ':' + lessonId + ':' + questionId;
  var previous = await auth.db('tutor_problem_memory?problem_key=eq.' + encodeURIComponent(problemKey) + '&select=wrong_count,help_level');
  var prior = previous && previous[0] || { wrong_count: 0, help_level: 0 }, now = new Date().toISOString();
  var memory = { problem_key: problemKey, lesson_id: lessonId, updated_at: now };
  if (outcome === 'wrong') {
    memory.wrong_count = Number(prior.wrong_count || 0) + 1;
    memory.help_level = Math.min(Number(prior.help_level || 0) + 1, 3);
    memory.latest_misconception = practice.text(body.student_answer, 500);
    memory.last_wrong_at = now;
  }
  await auth.db('tutor_problem_memory?on_conflict=problem_key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(memory) });
  await auth.db('tutor_attempts', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ problem_key: problemKey, lesson_id: lessonId, outcome: outcome }) });
}

async function extractPdf(buffer) {
  var PDFParse = require('pdf-parse').PDFParse, parser = new PDFParse({ data: buffer });
  try { var result = await parser.getText(); return practice.text(result && result.text, 16000); }
  finally { await parser.destroy(); }
}

async function appRoute(req, res, route) {
  if (!auth.cors(req, res)) return;
  if (req.method !== 'POST') return auth.json(res, 405, { error: 'Use POST.' });
  try {
    if (route === 'feedback') {
      var feedbackAccount = await auth.authenticated(req, res);
      if (!feedbackAccount) return;
      var feedback = req.body || {}, category = practice.text(feedback.category, 120), message = practice.text(feedback.message, 4000), page = practice.text(feedback.page, 1000), imagePath = null;
      if (!category || !message) return auth.json(res, 400, { error: 'Choose a category and write a short message.' });
      if (feedback.image) {
        var feedbackImage = decodedDataUrl(feedback.image.dataUrl, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], 4194304);
        imagePath = nowPath(feedbackAccount.user.id, 'feedback', feedbackImage.mime, feedback.image.name);
        await auth.uploadPrivateObject('feedback', imagePath, feedbackImage.buffer, feedbackImage.mime);
      }
      try {
        await auth.db('feedback', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: feedbackAccount.user.id, email: auth.email(feedbackAccount.user.email), category: category, message: message, page: page, image_path: imagePath }) });
      } catch (error) {
        if (imagePath) { try { await auth.removePrivateObject('feedback', imagePath); } catch (cleanupError) {} }
        throw error;
      }
      return auth.json(res, 200, { ok: true });
    }

    var account = await activeStudentAccount(req, res);
    if (!account) return;
    var body = req.body || {};
    if (route === 'exam') {
      if (body.action === 'grade') {
        var grade = await practice.gradeAnswer(body.prompt, body.correct_answer, body.student_answer);
        await rememberExamAttempt(account, body, grade.correct ? 'correct' : 'wrong');
        return auth.json(res, 200, grade);
      }
      var lessonIds = Array.isArray(body.lesson_ids) ? body.lesson_ids.map(function (id) { return practice.text(id, 120); }).filter(Boolean).slice(0, 80) : [];
      var pool = (Array.isArray(body.questions) ? body.questions : []).slice(0, 240).map(function (question, index) {
        return practice.validQuestion(Object.assign({}, question || {}, { lesson_id: question && (question.lesson_id || question._lid) }), 'exam-' + index);
      }).filter(function (question) { return question && lessonIds.indexOf(question.lesson_id) >= 0; });
      if (!pool.length || !lessonIds.length) return auth.json(res, 400, { error: 'No valid class questions were supplied.' });
      var count = Math.max(1, Math.min(40, Number(body.count) || 10)), weakness = await weakLessons(account, lessonIds, body.recent_attempts);
      var selected = await practice.chooseExamQuestions(pool, Math.min(count, pool.length), practice.text(body.difficulty, 20) || 'mixed', weakness);
      return auth.json(res, 200, { questions: selected.questions, source: selected.source, weak_lessons: weakness });
    }

    if (route === 'homework') {
      var file = body.file || {}, homework = decodedDataUrl(file.dataUrl, ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], 4194304), classSectionId = practice.text(body.class_section_id, 80), classCode = auth.code(body.class_code, 32), lessonIdsForHomework = Array.isArray(body.lesson_ids) ? body.lesson_ids.map(function (id) { return practice.text(id, 120); }).filter(Boolean).slice(0, 80) : [];
      if (!classSectionId || !classCode || !lessonIdsForHomework.length) return auth.json(res, 400, { error: 'Choose an assigned class before uploading homework.' });
      var membership = await auth.db('class_enrollments?class_section_id=eq.' + encodeURIComponent(classSectionId) + '&student_email=eq.' + encodeURIComponent(auth.email(account.user.email)) + '&status=eq.active&select=id&limit=1');
      if (!membership || !membership.length) return auth.json(res, 403, { error: 'This homework must belong to one of your assigned classes.' });
      var homeworkPath = nowPath(account.user.id, 'homework', homework.mime, file.name), saved = await auth.db('homework_documents', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ user_id: account.user.id, class_section_id: classSectionId, class_code: classCode, original_name: safeName(file.name, 'homework.' + extensionFor(homework.mime)), storage_bucket: 'homework', storage_path: homeworkPath, mime_type: homework.mime, size_bytes: homework.buffer.length, processing_status: 'processing' }) });
      var document = saved && saved[0];
      try {
        await auth.uploadPrivateObject('homework', homeworkPath, homework.buffer, homework.mime);
        var extracted = homework.mime === 'application/pdf' ? await extractPdf(homework.buffer) : '';
        if (homework.mime === 'application/pdf' && !extracted) throw new Error('This PDF has no readable text. Upload clear images of the assignment instead.');
        var questions = await practice.generateHomeworkPractice(extracted, homework.mime.indexOf('image/') === 0 ? file.dataUrl : '', classCode, lessonIdsForHomework);
        if (!questions.length) throw new Error('Rho could not create practice questions from this assignment.');
        await auth.db('homework_documents?id=eq.' + encodeURIComponent(document.id), { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ extracted_text: extracted, generated_practice: questions, processing_status: 'ready', processing_note: '', processed_at: new Date().toISOString() }) });
        return auth.json(res, 200, { document_id: document.id, questions: questions });
      } catch (error) {
        await auth.db('homework_documents?id=eq.' + encodeURIComponent(document.id), { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ processing_status: 'failed', processing_note: practice.text(error.message, 500) }) }).catch(function () {});
        throw error;
      }
    }
    return auth.json(res, 404, { error: 'Unknown app route.' });
  } catch (error) { return auth.json(res, 502, { error: error.message || 'The online tutor could not complete that request.' }); }
}

module.exports = async function (req, res) {
  var route = action(req);

  if (['feedback', 'exam', 'homework'].indexOf(route) >= 0) return appRoute(req, res, route);
  if (!tutor.requireActionToken(req, res)) return;

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
