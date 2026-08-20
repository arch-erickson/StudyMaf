import { Auth } from './auth.js';

let started = false, muted = false, timer = 0;

function uploadSoon() {
  if (muted || !Auth.getAccount()) return;
  clearTimeout(timer);
  timer = setTimeout(async function () {
    try { await Auth.api('/api/student/progress', { method: 'PUT', body: JSON.stringify({ state: Store.cloudProgress() }) }); }
    catch (error) { console.warn('StudyMAF progress will retry after your next change.', error.message); }
  }, 850);
}

async function switchAccount(account) {
  clearTimeout(timer); muted = true;
  try {
    if (!account) { window.StudyMAFPrivateCourseDocuments = {}; Store.setAccount(null); return; }
    Store.setAccount(account.user.id);
    var remote = await Auth.api('/api/student/progress');
    if (remote.progress && remote.progress.state) Store.applyCloudProgress(remote.progress.state);
    else await Auth.api('/api/student/progress', { method: 'PUT', body: JSON.stringify({ state: Store.cloudProgress() }) });
    var classes = await Auth.api('/api/student/classes');
    window.StudyMAFPrivateCourseDocuments = {};
    (classes.classes || []).forEach(function (row) {
      var section = Array.isArray(row.class_sections) ? row.class_sections[0] : row.class_sections || {};
      var course = Array.isArray(section.course_catalog) ? section.course_catalog[0] : section.course_catalog || {};
      if (section.id) window.StudyMAFPrivateCourseDocuments['server-' + section.id] = Array.isArray(course.course_documents) ? course.course_documents : [];
    });
    Store.syncEnrolledClasses(classes.classes || []);
    window.dispatchEvent(new Event('studymaf-account-ready'));
  } catch (error) { console.warn('StudyMAF could not sync your account yet.', error.message); }
  finally { muted = false; }
}

export function startProgressSync() {
  if (started) return;
  started = true;
  Store.onChange(uploadSoon);
  Auth.onChange(switchAccount);
  switchAccount(Auth.getAccount());
}
