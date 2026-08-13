import { Auth } from './auth.js';

// Small, batched, account-bound analytics. It records real active study time,
// never typed answers, tutor messages, screenshots, or calculator expressions.
let lastActiveAt = Date.now();
let lastFlushedAt = Date.now();
let lastContext = null;
let calculatorOpen = false;
let pending = [];

function active() { lastActiveAt = Date.now(); }
function currentClass() {
  const match = String(location.hash || '').match(/^#\/class\/([^?]+)/);
  const id = match && decodeURIComponent(match[1]);
  return id && window.Store && Store.getClass ? Store.getClass(id) : null;
}
function context() {
  const cls = currentClass();
  const lesson = (String(location.hash || '').match(/[?&]lesson=([^&]+)/) || [])[1] || '';
  const node = document.querySelector('.learn-session') ? 'learn' : document.querySelector('.quiz-session') ? 'test' : document.querySelector('.session') ? 'practice' : 'study';
  const online = cls && window.Store && Store.getMode && Store.getMode(cls.id).online;
  return { class_section_id: cls && cls.serverSectionId || '', class_key: cls && cls.id || '', class_name: cls && cls.name || '', course_code: cls && cls.code || '', lesson_id: lesson ? decodeURIComponent(lesson) : '', study_mode: node, delivery_mode: online ? 'online' : 'offline' };
}
function add(event) { pending.push(Object.assign({}, context(), event)); }
async function flush(force) {
  const now = Date.now();
  if (!Auth.getAccount()) { pending = []; lastFlushedAt = now; return; }
  const idle = now - lastActiveAt > 90000;
  const elapsed = Math.floor((now - lastFlushedAt) / 1000);
  if (!idle && (force || elapsed >= 30)) add({ event_type: 'study_time', duration_seconds: Math.min(300, elapsed) });
  lastFlushedAt = now;
  if (!pending.length) return;
  const events = pending.splice(0, 30);
  try { await Auth.api('/api/student/progress', { method: 'POST', body: JSON.stringify({ events: events }) }); }
  catch (error) { pending = events.concat(pending).slice(0, 30); }
}
function inspect() {
  const nowContext = JSON.stringify(context());
  if (lastContext && lastContext !== nowContext) flush(true);
  lastContext = nowContext;
  const dock = document.getElementById('calc-dock');
  const open = !!(dock && !dock.hidden);
  if (open && !calculatorOpen) add({ event_type: 'calculator_use', duration_seconds: 0 });
  calculatorOpen = open;
}

export function startActivityTracking() {
  ['pointerdown', 'keydown', 'touchstart', 'mousemove'].forEach(function (name) { window.addEventListener(name, active, { passive: true }); });
  window.addEventListener('hashchange', inspect);
  document.addEventListener('visibilitychange', function () { if (document.hidden) flush(true); else active(); });
  window.addEventListener('pagehide', function () { flush(true); });
  new MutationObserver(inspect).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'class'] });
  setInterval(function () { inspect(); flush(false); }, 30000);
  inspect();
}
