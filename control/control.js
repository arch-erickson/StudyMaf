import { Auth } from '../js/auth.js';
import '../js/generators.js';
import { createAccountUI } from '../js/account-ui.js?v=11';

const shell = document.querySelector('.control-shell');
const card = document.querySelector('.auth-card');
const app = document.querySelector('#control-app');
const host = document.querySelector('#control-modal');
const bottom = document.querySelector('.bottom');
const form = document.querySelector('#email-form');
const error = document.querySelector('#error');
const accountBar = document.querySelector('#control-account');
function showError(message) { error.textContent = message || ''; error.hidden = !message; }
function closeModal() { host.hidden = true; host.innerHTML = ''; }
function modal(html, options) { host.hidden = false; host.innerHTML = '<div class="control-modal-backdrop"><section class="control-modal-card' + (options && options.wide ? ' wide' : '') + '"><button class="modal-x" type="button" aria-label="Close" data-close>×</button>' + html + '</section></div>'; host.onclick = function (event) { if (event.target === host.querySelector('.control-modal-backdrop') || event.target.closest('[data-close]')) closeModal(); }; return host.querySelector('.control-modal-card'); }
const portal = createAccountUI({ modal: modal, closeModal: closeModal, reroute: renderPortal });
function deny(message) { shell.classList.remove('portal'); app.hidden = true; card.hidden = false; bottom.hidden = false; accountBar.hidden = true; showError(message); }
function renderPortal() { const account = Auth.getAccount(); if (!account || account.role !== 'admin') return deny(account ? 'This account is not approved for StudyMAF Control.' : 'Sign in with an administrator account.'); card.hidden = true; bottom.hidden = true; app.hidden = false; accountBar.hidden = false; shell.classList.add('portal'); portal.renderAdmin(app); }
function verifyScreen(address) { card.innerHTML = '<div class="math-mark" aria-hidden="true">✓</div><p class="kicker">Check your inbox</p><h1>Enter your code.</h1><p class="intro">We sent a verification code to <strong>' + address.replace(/[&<>"']/g, '') + '</strong>.</p><form id="code-form"><label for="code">Verification code</label><input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required placeholder="123456"><p class="error" id="code-error" hidden></p><button class="submit" type="submit">Verify and continue →</button></form><p class="terms"><a href="./">Use a different email</a></p>'; card.querySelector('#code-form').onsubmit = async function (event) { event.preventDefault(); const button = event.currentTarget.querySelector('button'); const codeError = card.querySelector('#code-error'); button.disabled = true; try { await Auth.verifyEmailCode(address, card.querySelector('#code').value); renderPortal(); } catch (reason) { codeError.textContent = reason.message; codeError.hidden = false; button.disabled = false; } }; }
document.querySelector('#google').onclick = function () { try { Auth.startGoogle(location.href); } catch (reason) { showError(reason.message); } };
form.onsubmit = async function (event) { event.preventDefault(); const button = form.querySelector('button'); button.disabled = true; showError(''); try { const address = document.querySelector('#email').value.trim(); await Auth.sendEmailCode(address, location.origin + location.pathname); verifyScreen(address); } catch (reason) { showError(reason.message); button.disabled = false; } };
Auth.init().then(renderPortal).catch(function () { deny('Sign in with an administrator account.'); });
document.querySelector('#control-profile').onclick = function () { portal.openAccount(); };
