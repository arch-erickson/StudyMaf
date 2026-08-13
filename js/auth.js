import { STUDYMAF_AUTH_CONFIG as config } from './auth-config.js';

/* Minimal Supabase Auth client for the static GitHub Pages app. It uses only
 * the publishable key and keeps all roles/classes behind the Vercel API. */
const SESSION_KEY = 'studymaf.auth.session.v1';
let session = null;
let account = null;
const listeners = [];

function configured() { return /^https:\/\//.test(config.supabaseUrl || '') && /^sb_publishable_/.test(config.publishableKey || ''); }
function notify() { window.StudyMAFAccount = account; window.StudyMAFSession = session; listeners.slice().forEach(function (fn) { try { fn(account); } catch (e) {} }); }
function save(next) { session = next || null; window.StudyMAFSession = session; try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {} }
function clear() { session = null; account = null; window.StudyMAFAccount = null; window.StudyMAFSession = null; try { localStorage.removeItem(SESSION_KEY); } catch (e) {} notify(); }
function stored() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; } }

async function request(path, options) {
  if (!configured()) throw new Error('Sign-in has not been configured yet.');
  const response = await fetch(config.supabaseUrl.replace(/\/$/, '') + '/auth/v1' + path, Object.assign({
    headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' }
  }, options || {}));
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch (e) { data = null; }
  if (!response.ok) throw new Error((data && (data.msg || data.message || data.error_description)) || 'Sign-in request failed.');
  return data;
}

function sessionFromHash() {
  const hash = location.hash.replace(/^#/, '');
  if (!/(?:^|&)access_token=/.test(hash)) return null;
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token'), refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  history.replaceState(null, document.title, location.pathname + location.search + '#/');
  return { access_token: accessToken, refresh_token: refreshToken, expires_at: Number(params.get('expires_at') || 0), user: null };
}

async function refreshIfNeeded() {
  if (!session || !session.refresh_token) return null;
  const expiresAt = Number(session.expires_at || 0);
  if (expiresAt && expiresAt > Math.floor(Date.now() / 1000) + 45) return session;
  const data = await request('/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token }) });
  save(data);
  return session;
}

async function loadAccount() {
  if (!session || !session.access_token) { account = null; notify(); return null; }
  const response = await fetch(config.apiUrl.replace(/\/$/, '') + '/api/account/me', { headers: { Authorization: 'Bearer ' + session.access_token } });
  if (response.status === 401) { clear(); return null; }
  const data = await response.json().catch(function () { return {}; });
  if (!response.ok) throw new Error(data.error || 'Could not load your account.');
  account = data;
  notify();
  return account;
}

export const Auth = {
  async init() {
    if (!configured()) return null;
    const oauth = sessionFromHash();
    session = oauth || stored();
    if (!session) return null;
    try { await refreshIfNeeded(); return await loadAccount(); }
    catch (error) { clear(); return null; }
  },
  configured: configured,
  getSession: function () { return session; },
  getAccount: function () { return account; },
  onChange: function (fn) { listeners.push(fn); return function () { const n = listeners.indexOf(fn); if (n >= 0) listeners.splice(n, 1); }; },
  async sendEmailCode(email, redirectTo) {
    var body = { email: String(email || '').trim(), create_user: true };
    if (redirectTo) body.email_redirect_to = redirectTo;
    return request('/otp', { method: 'POST', body: JSON.stringify(body) });
  },
  async verifyEmailCode(email, token) {
    const data = await request('/verify', { method: 'POST', body: JSON.stringify({ email: String(email || '').trim(), token: String(token || '').trim(), type: 'email' }) });
    save(data);
    return loadAccount();
  },
  startGoogle(redirectTo) {
    if (!configured()) throw new Error('Sign-in has not been configured yet.');
    const redirect = redirectTo || (location.origin + location.pathname);
    location.assign(config.supabaseUrl.replace(/\/$/, '') + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(redirect));
  },
  async signOut() {
    if (session && session.access_token) {
      try { await request('/logout', { method: 'POST', headers: { apikey: config.publishableKey, Authorization: 'Bearer ' + session.access_token } }); } catch (e) {}
    }
    clear();
  },
  async uploadCourseSource(courseId, kind, file) {
    await refreshIfNeeded();
    if (!session || !session.access_token) throw new Error('Sign in required.');
    if (!file || file.type !== 'application/pdf' || !/\.pdf$/i.test(file.name || '')) throw new Error('Please choose a PDF file.');
    if (file.size < 1 || file.size > 52428800) throw new Error('Each source PDF must be 50 MB or smaller.');
    var safeName = String(file.name || 'source.pdf').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'source.pdf';
    var path = String(courseId) + '/' + String(kind) + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '-' + safeName;
    var storageUrl = config.supabaseUrl.replace(/\/$/, '') + '/storage/v1/object/course-source/' + path.split('/').map(encodeURIComponent).join('/');
    var response = await fetch(storageUrl, { method: 'POST', headers: { apikey: config.publishableKey, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/pdf', 'x-upsert': 'false' }, body: file });
    var raw = await response.text(), data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (e) {}
    if (!response.ok) throw new Error((data && (data.message || data.error)) || 'Could not store this PDF securely.');
    return { storage_path: path, original_name: String(file.name || 'source.pdf'), mime_type: 'application/pdf', size_bytes: file.size };
  },
  async api(path, options) {
    await refreshIfNeeded();
    if (!session || !session.access_token) throw new Error('Sign in required.');
    const response = await fetch(config.apiUrl.replace(/\/$/, '') + path, Object.assign({
      headers: { Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' }
    }, options || {}));
    const data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }
};
