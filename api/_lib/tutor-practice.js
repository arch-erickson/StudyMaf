/* Shared AI helpers for the authenticated exam and homework routes. */

function text(value, limit) { return typeof value === 'string' ? value.trim().slice(0, limit || 1000) : ''; }
function normal(value) { return text(value, 800).toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9.+\-/%= ]/g, '').trim(); }
function safeDifficulty(value) { value = text(value, 20).toLowerCase(); return ['easy', 'medium', 'hard', 'stretch', 'extreme'].indexOf(value) >= 0 ? value : 'medium'; }

async function completion(messages, maxTokens) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('The online tutor is not configured.');
  var response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://studymaf.com',
      'X-OpenRouter-Title': 'StudyMAF Tutor'
    },
    body: JSON.stringify({ model: 'openrouter/free', reasoning: { enabled: false }, messages: messages, max_tokens: maxTokens || 500 })
  });
  var data = await response.json().catch(function () { return {}; });
  if (!response.ok) throw new Error(data && data.error && data.error.message || 'The free tutor model is busy.');
  var answer = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (Array.isArray(answer)) answer = answer.map(function (part) { return part && part.text || ''; }).join('');
  if (!answer) throw new Error('The tutor did not return a response.');
  return String(answer);
}

function jsonFromModel(answer) {
  var raw = String(answer || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  var first = raw.indexOf('{'), array = raw.indexOf('['), start = first < 0 ? array : array < 0 ? first : Math.min(first, array);
  if (start < 0) throw new Error('The tutor returned an unreadable result.');
  var end = raw.lastIndexOf(raw.charAt(start) === '[' ? ']' : '}');
  return JSON.parse(raw.slice(start, end + 1));
}

function validQuestion(value, fallbackId) {
  value = value && typeof value === 'object' ? value : {};
  var prompt = text(value.prompt, 1800), answer = text(value.correct_answer || value.answer, 600);
  if (!prompt || !answer) return null;
  var steps = Array.isArray(value.solution_steps || value.steps) ? (value.solution_steps || value.steps).map(function (step) { return text(step, 600); }).filter(Boolean).slice(0, 8) : [];
  return {
    id: text(value.id, 160) || fallbackId,
    lesson_id: text(value.lesson_id || value._lid, 120),
    prompt: prompt,
    correct_answer: answer,
    solution_steps: steps,
    hint: text(value.hint, 600),
    difficulty: safeDifficulty(value.difficulty)
  };
}

function deterministicSelection(pool, count, difficulty, weakLessons) {
  var wanted = difficulty === 'mixed' ? [] : [difficulty === 'extreme' ? 'stretch' : difficulty];
  var ranked = pool.map(function (item, index) {
    var weak = Number(weakLessons[item.lesson_id] || 0), bonus = wanted.length && wanted.indexOf(item.difficulty) >= 0 ? 200 : 0;
    return { item: item, score: weak * 100 + bonus - index / 1000 };
  }).sort(function (a, b) { return b.score - a.score; });
  return ranked.slice(0, count).map(function (row) { return row.item; });
}

async function chooseExamQuestions(pool, count, difficulty, weakLessons) {
  var fallback = deterministicSelection(pool, count, difficulty, weakLessons);
  var listing = pool.map(function (item) { return { id: item.id, lesson_id: item.lesson_id, difficulty: item.difficulty, prompt: item.prompt.slice(0, 500), weak_spot_score: Number(weakLessons[item.lesson_id] || 0) }; });
  try {
    var answer = await completion([
      { role: 'system', content: 'You select a fair StudyMAF practice exam. Return ONLY JSON: {"ids":["question-id"]}. Select exactly the requested count when possible. Prefer lessons with larger weak_spot_score, while respecting requested difficulty. Do not write questions, explanations, or answers.' },
      { role: 'user', content: JSON.stringify({ count: count, difficulty: difficulty, questions: listing }) }
    ], 280);
    var parsed = jsonFromModel(answer), ids = parsed && parsed.ids;
    if (!Array.isArray(ids)) throw new Error('No question IDs returned.');
    var map = pool.reduce(function (memo, item) { memo[item.id] = item; return memo; }, {}), seen = {}, chosen = ids.map(function (id) { id = String(id); if (seen[id] || !map[id]) return null; seen[id] = true; return map[id]; }).filter(Boolean);
    fallback.forEach(function (item) { if (chosen.length < count && !seen[item.id]) { chosen.push(item); seen[item.id] = true; } });
    return { questions: chosen.slice(0, count), source: 'ai' };
  } catch (error) {
    return { questions: fallback, source: 'local-fallback' };
  }
}

async function gradeAnswer(prompt, correctAnswer, studentAnswer) {
  var localCorrect = normal(studentAnswer) === normal(correctAnswer);
  try {
    var answer = await completion([
      { role: 'system', content: 'You grade one StudyMAF answer. Return ONLY JSON: {"correct":true|false,"explanation":"one short, direct sentence"}. Accept mathematically equivalent answers. Do not reveal hidden reasoning. Do not mark an answer correct just because it is close.' },
      { role: 'user', content: JSON.stringify({ prompt: text(prompt, 1800), correct_answer: text(correctAnswer, 600), student_answer: text(studentAnswer, 800) }) }
    ], 160);
    var result = jsonFromModel(answer);
    if (typeof result.correct !== 'boolean') throw new Error('Invalid grade.');
    return { correct: result.correct, explanation: text(result.explanation, 500) || (result.correct ? 'Correct.' : 'Review the method and try again.'), source: 'ai' };
  } catch (error) {
    return { correct: localCorrect, explanation: localCorrect ? 'Correct.' : 'That does not match the expected answer. Review the solution steps and try again.', source: 'local-fallback' };
  }
}

async function generateHomeworkPractice(extractedText, imageData, classCode, lessonIds) {
  var prompt = 'Create 4 to 8 original StudyMAF practice questions matching this homework. Return ONLY JSON: {"questions":[{"prompt":"","correct_answer":"","solution_steps":[""],"hint":"","difficulty":"easy|medium|hard","lesson_id":""}]}. Keep questions answerable, use LaTex $...$ for formulas, and do not copy private student work verbatim. Use one of these lesson IDs when relevant: ' + (lessonIds || []).join(', ') + '. Course: ' + text(classCode, 32) + '. Extracted homework text: ' + text(extractedText, 12000);
  var content = imageData ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageData } }] : prompt;
  var answer = await completion([{ role: 'system', content: 'You are a careful educational content generator. Output valid JSON only.' }, { role: 'user', content: content }], 1500);
  var parsed = jsonFromModel(answer), raw = parsed && parsed.questions;
  if (!Array.isArray(raw)) throw new Error('Rho could not create a practice set from this assignment.');
  return raw.map(function (item, index) { return validQuestion(item, 'homework-' + Date.now() + '-' + index); }).filter(Boolean).slice(0, 8);
}

module.exports = { text: text, validQuestion: validQuestion, chooseExamQuestions: chooseExamQuestions, gradeAnswer: gradeAnswer, generateHomeworkPractice: generateHomeworkPractice };
