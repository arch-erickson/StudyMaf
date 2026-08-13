import { STUDYMAF_AUTH_CONFIG as config } from './auth-config.js';

/* Minimal Supabase Auth client for the static GitHub Pages app. It uses only
 * the publishable key and keeps all roles/classes behind the Vercel API. */
const SESSION_KEY = 'studymaf.auth.session.v1';
let session = null;
let account = null;
const listeners = [];

function configured() { return /^https:\/\//.test(config.supabaseUrl || '') && /^sb_publishable_/.test(config.publishableKey || ''); }
function notify() { listeners.slice().forEach(function (fn) { try { fn(account); } catch (e) {} }); }
function save(next) { session = next || null; try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {} }
function clear() { session = null; account = null; try { localStorage.removeItem(SESSION_KEY); } catch (e) {} notify(); }
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
  async sendEmailCode(email) {
    return request('/otp', { method: 'POST', body: JSON.stringify({ email: String(email || '').trim(), create_user: true }) });
  },
  async verifyEmailCode(email, token) {
    const data = await request('/verify', { method: 'POST', body: JSON.stringify({ email: String(email || '').trim(), token: String(token || '').trim(), type: 'email' }) });
    save(data);
    return loadAccount();
  },
  startGoogle() {
    if (!configured()) throw new Error('Sign-in has not been configured yet.');
    const redirect = location.origin + location.pathname;
    location.assign(config.supabaseUrl.replace(/\/$/, '') + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(redirect));
  },
  async signOut() {
    if (session && session.access_token) {
      try { await request('/logout', { method: 'POST', headers: { apikey: config.publishableKey, Authorization: 'Bearer ' + session.access_token } }); } catch (e) {}
    }
    clear();
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
