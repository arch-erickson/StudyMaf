import { Auth } from './auth.js';

let started = false, muted = false, timer = 0;

function pause(milliseconds) { return new Promise(function (resolve) { setTimeout(resolve, milliseconds); }); }

function uploadSoon() {
  if (muted || !Auth.getAccount() || Auth.getAccount().role !== 'student') return;
  clearTimeout(timer);
  timer = setTimeout(async function () {
    try { await Auth.api('/api/student/progress', { method: 'PUT', body: JSON.stringify({ state: Store.cloudProgress() }) }); }
    catch (error) { console.warn('StudyMAF progress will retry after your next change.', error.message); }
  }, 850);
}

async function switchAccount(account) {
  clearTimeout(timer); muted = true;
  try {
    if (!account || account.role !== 'student') { window.StudyMAFPrivateCourseDocuments = {}; Store.setAccount(null); return; }
    Store.setAccount(account.user.id);
    // Progress is useful, but it must never block professor-assigned classes.
    try {
      var remote = await Auth.api('/api/student/progress');
      if (remote.progress && remote.progress.state) Store.applyCloudProgress(remote.progress.state);
      else await Auth.api('/api/student/progress', { method: 'PUT', body: JSON.stringify({ state: Store.cloudProgress() }) });
    } catch (progressError) { console.warn('StudyMAF progress will sync later.', progressError.message); }

    var classes = null, classError = null;
    for (var attempt = 0; attempt < 3 && !classes; attempt++) {
      try { classes = await Auth.api('/api/student/classes'); }
      catch (error) { classError = error; if (attempt < 2) await pause((attempt + 1) * 900); }
    }
    if (!classes) throw classError || new Error('Could not load enrolled classes.');
    window.StudyMAFPrivateCourseDocuments = {};
    (classes.classes || []).forEach(function (row) {
      var section = Array.isArray(row.class_sections) ? row.class_sections[0] : row.class_sections || {};
      var course = Array.isArray(section.course_catalog) ? section.course_catalog[0] : section.course_catalog || {};
      if (section.id) window.StudyMAFPrivateCourseDocuments['server-' + section.id] = Array.isArray(course.course_documents) ? course.course_documents : [];
    });
    Store.syncEnrolledClasses(classes.classes || []);
    window.StudyMAFClassSync = { status: 'ready', count: (classes.classes || []).length };
    window.dispatchEvent(new Event('studymaf-account-ready'));
  } catch (error) { window.StudyMAFClassSync = { status: 'error', message: error.message || 'Could not load enrolled classes.' }; console.warn('StudyMAF could not sync your enrolled classes yet.', error.message); }
  finally { muted = false; }
}

export function startProgressSync() {
  if (started) return;
  started = true;
  Store.onChange(uploadSoon);
  Auth.onChange(switchAccount);
  switchAccount(Auth.getAccount());
}
