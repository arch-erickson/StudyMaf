import { Auth } from './auth.js';

const root = document.querySelector('#signin-app');
let intent = new URLSearchParams(location.search).get('intent') === 'professor' ? 'professor' : 'student';
function esc(value) { return String(value || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
function destination(account) {
  if (account.role === 'admin') return '../control/';
  if (intent === 'professor' && account.role !== 'professor') throw new Error('This account is not marked as a professor yet. Ask a StudyMAF administrator for professor access.');
  if (intent === 'student' && account.role !== 'student') throw new Error('This email is not enrolled as a student. Ask the professor to add this same email to a class roster first.');
  return '../dashboard/';
}
function go(account) { location.assign(destination(account)); }
function error(message) { const box = root.querySelector('#signin-error'); if (box) { box.textContent = message || ''; box.hidden = !message; } }
function codeScreen(address) {
  root.querySelector('.sl-login').innerHTML = '<div class="sl-symbol">✓</div><p class="sl-kicker">Check your inbox</p><h1>Enter your code.</h1><p class="sl-intro">We sent a verification code to <strong>' + esc(address) + '</strong>.</p><form id="signin-code-form"><label for="signin-code">Verification code</label><input id="signin-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required placeholder="123456"><p class="sl-error" id="signin-error" hidden></p><button class="sl-submit" type="submit">Verify and continue →</button></form><a class="sl-text-link" href="./">Use a different email</a>';
  root.querySelector('#signin-code-form').onsubmit = async function (event) { event.preventDefault(); const button = event.currentTarget.querySelector('button'); button.disabled = true; button.textContent = 'Verifying…'; error(''); try { go(await Auth.verifyEmailCode(address, root.querySelector('#signin-code').value)); } catch (reason) { error(reason.message); button.disabled = false; button.textContent = 'Verify and continue →'; } };
}
function render() {
  root.innerHTML = '<div class="sl-login-page"><a class="sl-brand" href="../">Study<span>MAF</span></a><section class="sl-login"><div class="sl-symbol">Σ</div><p class="sl-kicker">StudyMAF</p><h1>Welcome back.</h1><p class="sl-intro">Sign in to your study space. No password needed.</p><div class="sl-roles"><button class="sl-role' + (intent === 'student' ? ' active' : '') + '" data-role="student" type="button">Student</button><button class="sl-role' + (intent === 'professor' ? ' active' : '') + '" data-role="professor" type="button">Professor</button></div><p class="sl-role-note">' + (intent === 'professor' ? 'Use your professor email. Your access is checked after sign-in.' : 'Use your student email to continue.') + '</p><button class="sl-google" id="signin-google" type="button"><strong>G</strong>Continue with Google</button><div class="sl-or">or continue with email</div><form id="signin-email-form"><label for="signin-email">Email address</label><input id="signin-email" type="email" autocomplete="email" required placeholder="you@example.com"><p class="sl-error" id="signin-error" hidden></p><button class="sl-submit" type="submit">Send verification code →</button></form><p class="sl-signin-terms">By continuing, you agree to use StudyMAF for learning and classwork.</p></section></div>';
  root.querySelectorAll('[data-role]').forEach(function (button) { button.onclick = function () { intent = button.dataset.role; Auth.setWorkspace(intent); history.replaceState(null, document.title, location.pathname + '?intent=' + intent); render(); }; });
  root.querySelector('#signin-google').onclick = function () { try { Auth.setWorkspace(intent); Auth.startGoogle(location.origin + location.pathname + '?intent=' + intent); } catch (reason) { error(reason.message); } };
  root.querySelector('#signin-email-form').onsubmit = async function (event) { event.preventDefault(); const button = event.currentTarget.querySelector('button'); const address = root.querySelector('#signin-email').value.trim(); button.disabled = true; button.textContent = 'Sending…'; error(''); try { Auth.setWorkspace(intent); await Auth.sendEmailCode(address, location.origin + location.pathname + '?intent=' + intent); codeScreen(address); } catch (reason) { error(reason.message); button.disabled = false; button.textContent = 'Send verification code →'; } };
}
Auth.setWorkspace(intent);
render();
Auth.init().then(function (account) { if (!account) return; try { go(account); } catch (reason) { error(reason.message); } }).catch(function () {});
