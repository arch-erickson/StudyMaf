import { Auth } from '../js/auth.js';

const params = new URLSearchParams(location.search);
let intent = params.get('intent') === 'professor' ? 'professor' : 'student';
const form = document.querySelector('#email-form');
const error = document.querySelector('#error');
const email = document.querySelector('#email');
const google = document.querySelector('#google');
const note = document.querySelector('#role-note');

function showError(message) { error.textContent = message; error.hidden = !message; }
function setIntent(next) {
  intent = next;
  document.querySelectorAll('[data-intent]').forEach(function (button) { button.classList.toggle('active', button.dataset.intent === intent); });
  note.textContent = intent === 'professor' ? 'Use your professor email. Your role is checked after sign-in.' : 'Use your student email to continue.';
}
function destination(account) {
  if (intent === 'professor' && !['professor', 'admin'].includes(account.role)) throw new Error('This account is not marked as a professor yet. Ask an administrator to give it professor access.');
  if (account.role === 'admin') return '../#/admin';
  if (intent === 'professor') return '../#/professor';
  return '../#/';
}
function verifyScreen(address) {
  document.querySelector('.auth-card').innerHTML = '<div class="math-mark" aria-hidden="true">✓</div><p class="kicker">Check your inbox</p><h1>Enter your code.</h1><p class="intro">We sent a six-digit verification code to <strong>' + address.replace(/[<>&]/g, '') + '</strong>.</p><form id="code-form"><label for="code">Verification code</label><input id="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="123456" required autofocus><p class="error" id="error" hidden></p><button class="submit" type="submit">Verify and continue <span>→</span></button></form><p class="terms"><a href="./" id="different-email">Use a different email</a></p>';
  document.querySelector('#different-email').onclick = function (event) { event.preventDefault(); location.reload(); };
  document.querySelector('#code-form').onsubmit = async function (event) {
    event.preventDefault(); const button = event.currentTarget.querySelector('button'), localError = document.querySelector('#error'); localError.hidden = true; button.disabled = true; button.textContent = 'Verifying…';
    try { const account = await Auth.verifyEmailCode(address, document.querySelector('#code').value); location.assign(destination(account)); }
    catch (reason) { localError.textContent = reason.message; localError.hidden = false; button.disabled = false; button.innerHTML = 'Verify and continue <span>→</span>'; }
  };
}

document.querySelectorAll('[data-intent]').forEach(function (button) { button.onclick = function () { setIntent(button.dataset.intent); }; });
google.onclick = function () { try { Auth.startGoogle(); } catch (reason) { showError(reason.message); } };
form.onsubmit = async function (event) {
  event.preventDefault(); const button = form.querySelector('button'); button.disabled = true; button.textContent = 'Sending…'; showError('');
  try { await Auth.sendEmailCode(email.value); verifyScreen(email.value); }
  catch (reason) { showError(reason.message); button.disabled = false; button.innerHTML = 'Send verification code <span>→</span>'; }
};

setIntent(intent);
Auth.init().then(function (account) {
  if (!account) return;
  try { location.assign(destination(account)); }
  catch (reason) { showError(reason.message); }
}).catch(function () {});
