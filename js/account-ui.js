import { Auth } from './auth.js';

function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
function injectStyles() {
  if (document.getElementById('studymaf-account-styles')) return;
  const style = document.createElement('style'); style.id = 'studymaf-account-styles';
  style.textContent = '.account-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:0 0 22px}.account-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.account-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:18px}.account-card h3{margin:0 0 6px;font-size:1rem}.account-card p{margin:4px 0;color:var(--ink-soft);font-size:.88rem}.account-table{width:100%;border-collapse:collapse;font-size:.88rem}.account-table th,.account-table td{padding:10px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.account-table th{font-size:.72rem;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft)}.account-form{display:grid;gap:10px;max-width:500px}.account-form label{display:grid;gap:5px;font-size:.83rem;font-weight:700}.account-form input,.account-form select,.account-form textarea{font:inherit;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);padding:10px 12px}.account-form textarea{min-height:70px;resize:vertical}.account-note{color:var(--ink-soft);font-size:.88rem}.account-role{display:inline-block;padding:3px 9px;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.account-empty{padding:22px;border:1px dashed var(--line);border-radius:14px;color:var(--ink-soft);text-align:center}.account-divider{height:1px;background:var(--line);margin:22px 0}.account-header-name{max-width:175px;display:inline-flex;gap:8px;align-items:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.account-avatar{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent);flex:0 0 auto}.account-avatar svg{width:16px;height:16px}@media(max-width:620px){.account-table{display:block;overflow:auto}.account-header-name .account-name{display:none}}';
  document.head.appendChild(style);
}

export function createAccountUI(options) {
  injectStyles();
  const modal = options.modal, closeModal = options.closeModal, reroute = options.reroute;
  let headerButton;

  function appPage(path) { return new URL(path, new URL('../', import.meta.url)).href; }

  function account() { return Auth.getAccount(); }
  function isRole(role) { return account() && account().role === role; }
  function headerLabel() { const a = account(); return a ? ((a.user.name || a.user.email || 'Account').split(' ')[0]) : ''; }
  function syncHeader() {
    if (!headerButton) return;
    const a = account();
    headerButton.hidden = !a;
    if (!a) return;
    headerButton.innerHTML = '<span class="account-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20c.7-3.5 3.5-5.4 7.5-5.4s6.8 1.9 7.5 5.4"/></svg></span><span class="account-name">' + esc(headerLabel()) + '</span>';
    headerButton.className = 'btn ghost account-header-name';
    headerButton.title = 'Open account menu';
  }
  function errorBox(message) { return '<div class="join-err">' + esc(message) + '</div>'; }

  function openAccount() {
    const a = account();
    if (!a) return openSignIn();
    const links = a.role === 'professor' ? '<button class="btn ghost" id="acct-prof">Professor dashboard</button>' : '';
    const m = modal('<h2>Your account</h2><p class="modal-sub">' + esc(a.user.email) + '</p><p><span class="account-role">' + esc(a.role) + '</span></p><div class="modal-actions">' + links + '<button class="btn subtle" data-close>Close</button><button class="btn primary" id="acct-out">Sign out</button></div>');
    const p = m.querySelector('#acct-prof');
    if (p) p.onclick = function () { closeModal(); location.hash = '#/professor'; };
    m.querySelector('#acct-out').onclick = async function () { await Auth.signOut(); closeModal(); location.assign(appPage('signin/')); };
  }

  function openSignIn() {
    const m = modal('<div id="auth-screen"><h2>Welcome to StudyMAF</h2><p class="modal-sub">Use Google or a one-time email code. No password needed.</p><button class="btn ghost" id="auth-google" style="width:100%;justify-content:center">Continue with Google</button><div class="account-divider"></div><form class="account-form" id="auth-email-form"><label>Email address<input id="auth-email" type="email" autocomplete="email" required placeholder="you@example.com"></label><div id="auth-error"></div><button class="btn primary" type="submit">Email me a code</button></form><p class="account-note">Your code expires after the time set in Supabase.</p></div>');
    m.querySelector('#auth-google').onclick = function () { try { Auth.startGoogle(); } catch (error) { m.querySelector('#auth-error').innerHTML = errorBox(error.message); } };
    m.querySelector('#auth-email-form').onsubmit = async function (event) {
      event.preventDefault(); const input = m.querySelector('#auth-email'), err = m.querySelector('#auth-error'), button = m.querySelector('button[type="submit"]');
      button.disabled = true; button.textContent = 'Sending…'; err.innerHTML = '';
      try { await Auth.sendEmailCode(input.value, appPage('signin/')); showVerify(m, input.value); }
      catch (error) { err.innerHTML = errorBox(error.message); button.disabled = false; button.textContent = 'Email me a code'; }
    };
  }

  function showVerify(m, email) {
    const host = m.querySelector('#auth-screen');
    host.innerHTML = '<h2>Check your email</h2><p class="modal-sub">We sent a six-digit code to <strong>' + esc(email) + '</strong>.</p><form class="account-form" id="auth-code-form"><label>Verification code<input id="auth-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required placeholder="123456"></label><div id="auth-error"></div><button class="btn primary" type="submit">Verify and sign in</button><button class="btn subtle" type="button" id="auth-back">Use a different email</button></form>';
    host.querySelector('#auth-back').onclick = openSignIn;
    host.querySelector('#auth-code-form').onsubmit = async function (event) {
      event.preventDefault(); const error = host.querySelector('#auth-error'), button = host.querySelector('button[type="submit"]'); button.disabled = true; button.textContent = 'Verifying…'; error.innerHTML = '';
      try { await Auth.verifyEmailCode(email, host.querySelector('#auth-code').value); closeModal(); reroute(); }
      catch (reason) { error.innerHTML = errorBox(reason.message); button.disabled = false; button.textContent = 'Verify and sign in'; }
    };
  }

  function restricted(target, title, need) {
    target.innerHTML = '<div class="page wrap"><div class="account-card"><h1>' + esc(title) + '</h1><p class="modal-sub">' + esc(need) + '</p><a class="btn primary" href="' + esc(appPage('dashboard/')) + '">Go to your dashboard</a></div></div>';
  }

  function setPage(target, title, subtitle) {
    target.innerHTML = '<div class="page wrap"><div class="crumbs"><a href="#/">← Your classes</a></div><div class="section-head"><div><h1>' + esc(title) + '</h1><p class="section-sub">' + esc(subtitle) + '</p></div><span class="account-role">' + esc(account().role) + '</span></div><div id="account-page-body"></div></div>';
    return target.querySelector('#account-page-body');
  }

  async function renderProfessor(target) {
    if (!account()) return restricted(target, 'Professor area', 'Sign in with your professor account to manage classes.');
    if (account().role !== 'professor') return restricted(target, 'Professor area', 'Your account is not marked as a professor yet. Ask an administrator to update it.');
    const body = setPage(target, 'Professor area', 'Create sections from the approved course list and add student email addresses.');
    body.innerHTML = '<div class="account-empty">Loading your classes…</div>';
    try {
      const [catalog, classes] = await Promise.all([Auth.api('/api/catalog'), Auth.api('/api/professor/classes')]);
      const choices = (catalog.courses || []).map(function (course) { return '<option value="' + esc(course.id) + '">' + esc(course.code + ' — ' + course.title) + '</option>'; }).join('');
      body.innerHTML = '<div class="account-grid"><section class="account-card"><h3>Create a class section</h3><form class="account-form" id="prof-create"><label>Course<select name="course_id" required><option value="">Choose a course</option>' + choices + '</select></label><label>Section name<input name="section_label" required placeholder="Section 01"></label><label>Term<input name="term" placeholder="Fall 2026"></label><label>Student join code<input name="join_code" required maxlength="32" placeholder="PHYS1442-A"></label><div id="prof-create-error"></div><button class="btn primary" type="submit">Create class</button></form></section><section class="account-card"><h3>Your classes</h3><div id="prof-class-list"></div></section></div>';
      function drawClasses() {
        const list = body.querySelector('#prof-class-list'), rows = classes.classes || [];
        list.innerHTML = rows.length ? rows.map(function (item) { const course = item.course_catalog || {}; return '<div style="padding:10px 0;border-bottom:1px solid var(--line)"><strong>' + esc(course.code || 'Course') + ' · ' + esc(item.section_label) + '</strong><p>' + esc(item.term || 'No term') + ' · Join code: <strong>' + esc(item.join_code) + '</strong></p><button class="btn ghost" data-roster="' + esc(item.id) + '">Students</button></div>'; }).join('') : '<p class="account-note">No sections yet.</p>';
        list.querySelectorAll('[data-roster]').forEach(function (button) { button.onclick = function () { openRoster(button.getAttribute('data-roster')); }; });
      }
      drawClasses();
      body.querySelector('#prof-create').onsubmit = async function (event) { event.preventDefault(); const form = event.currentTarget, error = body.querySelector('#prof-create-error'); error.innerHTML = ''; try { const data = await Auth.api('/api/professor/classes', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); classes.classes.unshift(Object.assign(data.class, { course_catalog: (catalog.courses || []).find(function (x) { return x.id === data.class.course_id; }) })); form.reset(); drawClasses(); } catch (reason) { error.innerHTML = errorBox(reason.message); } };
      function openRoster(classId) {
        const m = modal('<h2>Student roster</h2><div id="roster-content" class="account-empty">Loading students…</div>');
        const host = m.querySelector('#roster-content');
        async function load() { try { const data = await Auth.api('/api/professor/students?class_id=' + encodeURIComponent(classId)); host.className = ''; host.innerHTML = '<form class="account-form" id="roster-add"><label>Student email<input name="student_email" type="email" required placeholder="student@example.com"></label><div id="roster-error"></div><button class="btn primary" type="submit">Add student</button></form><div class="account-divider"></div>' + (data.students.length ? '<table class="account-table"><thead><tr><th>Student</th><th>Status</th><th>Last seen</th></tr></thead><tbody>' + data.students.map(function (student) { const p = student.profiles || {}; return '<tr><td>' + esc(p.display_name || student.student_email) + '<br><span class="account-note">' + esc(student.student_email) + '</span></td><td>' + esc(student.status) + '</td><td>' + esc(p.last_seen_at ? new Date(p.last_seen_at).toLocaleDateString() : 'Not yet') + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="account-note">No students added yet.</p>'); host.querySelector('#roster-add').onsubmit = async function (event) { event.preventDefault(); try { await Auth.api('/api/professor/students', { method: 'POST', body: JSON.stringify({ class_id: classId, student_email: new FormData(event.currentTarget).get('student_email') }) }); await load(); } catch (reason) { host.querySelector('#roster-error').innerHTML = errorBox(reason.message); } }; } catch (reason) { host.innerHTML = errorBox(reason.message); } }
        load();
      }
    } catch (error) { body.innerHTML = errorBox(error.message); }
  }

  async function renderAdmin(target) {
    if (!account()) return restricted(target, 'Admin dashboard', 'Sign in with an administrator account to continue.');
    if (!isRole('admin')) return restricted(target, 'Admin dashboard', 'This page is available only to StudyMAF administrators.');
    const body = setPage(target, 'Admin dashboard', 'Manage accounts, professors, approved courses, and class sections.');
    body.innerHTML = '<div class="account-empty">Loading dashboard…</div>';
    try {
      const data = await Auth.api('/api/admin/dashboard'), roleByUser = Object.fromEntries((data.roles || []).map(function (role) { return [role.user_id, role.role]; }));
      body.innerHTML = '<div class="account-toolbar"><button class="btn primary" id="admin-course">Add course</button><button class="btn ghost" id="admin-refresh">Refresh</button></div><div class="account-grid"><section class="account-card"><h3>' + (data.users || []).length + ' accounts</h3><p>Students, professors, and administrators with an account.</p></section><section class="account-card"><h3>' + (data.courses || []).length + ' approved courses</h3><p>Available for professors to create sections from.</p></section><section class="account-card"><h3>' + (data.classes || []).length + ' class sections</h3><p>Current professor-owned sections.</p></section></div><div class="account-divider"></div><h2>Accounts</h2><table class="account-table"><thead><tr><th>Email</th><th>Role</th><th>Last seen</th><th></th></tr></thead><tbody>' + (data.users || []).map(function (user) { const role = roleByUser[user.id] || 'student'; return '<tr><td>' + esc(user.display_name || user.email) + '<br><span class="account-note">' + esc(user.email) + '</span></td><td><span class="account-role">' + esc(role) + '</span></td><td>' + esc(user.last_seen_at ? new Date(user.last_seen_at).toLocaleDateString() : 'Never') + '</td><td>' + (role === 'student' ? '<button class="btn ghost" data-promote="' + esc(user.id) + '">Make professor</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table><div class="account-divider"></div><h2>Class sections</h2><table class="account-table"><thead><tr><th>Class</th><th>Professor</th><th>Join code</th></tr></thead><tbody>' + (data.classes || []).map(function (section) { const course = section.course_catalog || {}, professor = section.profiles || {}; return '<tr><td>' + esc(course.code || '') + ' · ' + esc(section.section_label) + '<br><span class="account-note">' + esc(section.term || '') + '</span></td><td>' + esc(professor.display_name || professor.email || 'Unassigned') + '</td><td>' + esc(section.join_code) + '</td></tr>'; }).join('') + '</tbody></table>';
      body.querySelector('#admin-refresh').onclick = function () { renderAdmin(target); };
      body.querySelectorAll('[data-promote]').forEach(function (button) { button.onclick = async function () { try { await Auth.api('/api/admin/professors', { method: 'POST', body: JSON.stringify({ user_id: button.getAttribute('data-promote') }) }); renderAdmin(target); } catch (reason) { alert(reason.message); } }; });
      body.querySelector('#admin-course').onclick = openCourseForm;
    } catch (error) { body.innerHTML = errorBox(error.message); }
  }

  function openCourseForm() {
    const m = modal('<h2>Add approved course</h2><p class="modal-sub">Professors can create their own sections from this course.</p><form class="account-form" id="admin-course-form"><label>Course code<input name="code" required placeholder="CALC1"></label><label>Course title<input name="title" required placeholder="Calculus I"></label><label>Subject<input name="subject" required placeholder="calculus"></label><label>Description<textarea name="description" placeholder="What students will study"></textarea></label><div id="admin-course-error"></div><div class="modal-actions"><button class="btn subtle" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Add course</button></div></form>');
    m.querySelector('#admin-course-form').onsubmit = async function (event) { event.preventDefault(); try { await Auth.api('/api/admin/courses', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); closeModal(); location.hash = '#/admin'; } catch (reason) { m.querySelector('#admin-course-error').innerHTML = errorBox(reason.message); } };
  }

  return {
    ready: function () { return Auth.init(); },
    mountHeader: function () { const nav = document.querySelector('.header-actions'); if (!nav) return; headerButton = document.createElement('button'); headerButton.type = 'button'; headerButton.hidden = true; headerButton.onclick = openAccount; nav.appendChild(headerButton); syncHeader(); Auth.onChange(syncHeader); },
    openSignIn: openSignIn,
    renderProfessor: renderProfessor,
    renderAdmin: renderAdmin,
    account: account
  };
}
