/* StudyMAF — persistent state (localStorage). MVP: no backend.
 * Everything the user creates (classes, progress, accent, drawings, uploads,
 * mode settings) lives client-side. Lesson CONTENT still comes from /data JSON.
 */
window.Store = (function () {
  "use strict";
  var KEY = "studymaf.v1", activeKey = KEY, listeners = [];
  var state = load(activeKey);

  function load(key) {
    try {
      var raw = localStorage.getItem(key || activeKey);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return defaults();
  }
  function defaults() {
    return {
      accent: "#EF8354",
      classes: [],
      progress: {},   // "classId::lessonId" -> { done: {problemId:true}, xp: number }
      drawings: {},    // "classId::lessonId::problemId" -> dataURL
      uploads: {},     // classId -> { syllabus, textbook, homework:[] }
      modes: {},       // classId -> { online:bool }
      notebook: [],    // saved works: { id, lessonId, lessonName, title, date, image }
      scratch: {},     // resume data: "cid::lid::pid" -> strokes JSON string
      flags: {}        // one-time migration flags
    };
  }
  function save() {
    try { localStorage.setItem(activeKey, JSON.stringify(state)); } catch (e) { /* quota */ }
    listeners.slice().forEach(function (listener) { try { listener(); } catch (e) {} });
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function uid() { return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  return {
    all: function () { return state; },
    onChange: function (listener) {
      listeners.push(listener);
      return function () { var index = listeners.indexOf(listener); if (index >= 0) listeners.splice(index, 1); };
    },
    // Accounts never share a browser cache. The current anonymous cache is
    // adopted only when the first account signs in on this device.
    setAccount: function (userId) {
      var nextKey = userId ? KEY + ".account." + userId : KEY;
      if (nextKey === activeKey) return;
      var oldKey = activeKey, oldState = state;
      try { localStorage.setItem(oldKey, JSON.stringify(oldState)); } catch (e) {}
      var hadNext = false;
      try { hadNext = !!localStorage.getItem(nextKey); } catch (e) {}
      var next = load(nextKey);
      if (userId && !hadNext && oldKey === KEY) next = oldState;
      activeKey = nextKey; state = next || defaults(); save();
    },
    cloudProgress: function () {
      return clone({ version: 1, classes: state.classes || [], progress: state.progress || {}, uploads: state.uploads || {}, modes: state.modes || {}, flags: state.flags || {} });
    },
    applyCloudProgress: function (remote) {
      if (!remote || typeof remote !== "object") return;
      ["classes", "progress", "uploads", "modes", "flags"].forEach(function (key) {
        if (remote[key] && typeof remote[key] === "object") state[key] = clone(remote[key]);
      });
      save();
    },
    syncEnrolledClasses: function (enrollments) {
      (enrollments || []).forEach(function (row) {
        // PostgREST returns to-one embeds as objects, but an older cached schema
        // can return a one-item array. Support both so an enrollment is never
        // silently skipped while the relationship cache catches up.
        var section = Array.isArray(row.class_sections) ? row.class_sections[0] : row.class_sections || {};
        var course = Array.isArray(section.course_catalog) ? section.course_catalog[0] : section.course_catalog || {};
        if (!section.id || !course.code) return;
        var found = state.classes.filter(function (item) { return item.serverSectionId === section.id; })[0];
        if (found) return;
        state.classes.push({
          id: "server-" + section.id,
          serverSectionId: section.id,
          name: course.title || course.code,
          semester: section.term || "",
          year: "",
          date: new Date().toISOString().slice(0, 10),
          thumbSeed: (function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; })(String(course.code || section.id)),
          lessonIds: (course.lessons || []).map(function (lesson) { return lesson.id; }),
          code: course.code,
          lessonTargets: {}, chapters: {}, createdAt: Date.now()
        });
      });
      save();
    },

    // ----- one-time migration flags -----
    flag: function (name) { return !!(state.flags && state.flags[name]); },
    setFlag: function (name) { state.flags = state.flags || {}; state.flags[name] = true; save(); },

    // ----- notebook grid preference -----
    getGrid: function () { return state.nbGrid || { type: "ruled", size: 40, color: "#c3ccd9", opacity: 0.7 }; },
    setGrid: function (g) { state.nbGrid = g; save(); },

    // ----- iPad mode (treat the web app like a native app: no text selection / callouts) -----
    getIpadMode: function () { return !!state.ipadMode; },
    setIpadMode: function (on) { state.ipadMode = !!on; save(); },

    // ----- accent -----
    getAccent: function () { return state.accent; },
    setAccent: function (hex) { state.accent = hex; save(); },

    // ----- classes -----
    classes: function () { return state.classes; },
    getClass: function (id) { return state.classes.filter(function (c) { return c.id === id; })[0]; },
    addClass: function (data) {
      var c = {
        id: uid(),
        name: data.name || "Untitled Class",
        semester: data.semester || "",
        year: data.year || "",
        date: new Date().toISOString().slice(0, 10),
        thumbSeed: Math.floor(Math.random() * 360),
        lessonIds: data.lessonIds || [],
        code: data.code || "",                    // join code this class came from
        lessonTargets: data.lessonTargets || {},  // lessonId -> # of syllabus problems (grade target)
        chapters: data.chapters || {},            // lessonId -> textbook chapter reference
        createdAt: Date.now()
      };
      state.classes.push(c); save(); return c;
    },
    // attach/update catalog metadata (code, grade targets, chapters) on an existing class
    setClassCatalog: function (id, meta) {
      var c = this.getClass(id); if (!c) return;
      if (meta.code) c.code = meta.code;
      if (meta.lessonIds) c.lessonIds = meta.lessonIds;
      if (meta.lessonTargets) c.lessonTargets = meta.lessonTargets;
      if (meta.chapters) c.chapters = meta.chapters;
      save();
    },
    removeClass: function (id) {
      state.classes = state.classes.filter(function (c) { return c.id !== id; });
      delete state.uploads[id]; delete state.modes[id]; save();
    },
    setClassLessons: function (id, lessonIds) {
      var c = this.getClass(id); if (!c) return; c.lessonIds = lessonIds; save();
    },

    // ----- progress -----
    _pkey: function (cid, lid) { return cid + "::" + lid; },
    lessonProgress: function (cid, lid) {
      var k = this._pkey(cid, lid);
      return state.progress[k] || { done: {}, xp: 0 };
    },
    // resume point for the generative session (which of the 7 slots you're on)
    getGenSlot: function (cid, lid) { var p = this.lessonProgress(cid, lid); return p.genSlot || 0; },
    setGenSlot: function (cid, lid, n) { var k = this._pkey(cid, lid); var p = state.progress[k] || { done: {}, xp: 0 }; p.genSlot = n; state.progress[k] = p; save(); },

    markProblemDone: function (cid, lid, pid, xp) {
      var k = this._pkey(cid, lid);
      var p = state.progress[k] || { done: {}, xp: 0, solved: 0 };
      if (!p.done[pid]) { p.done[pid] = true; p.xp += (xp || 0); p.solved = (p.solved || 0) + 1; }
      state.progress[k] = p; save(); return p;
    },
    // add XP without counting a syllabus-grade "solved" (e.g. quiz scoring)
    addXp: function (cid, lid, xp) {
      var k = this._pkey(cid, lid);
      var p = state.progress[k] || { done: {}, xp: 0, solved: 0 };
      p.xp += (xp || 0); state.progress[k] = p; save(); return p;
    },
    // ----- LEARN mode: which concepts the student has walked through -----
    // Stored inside the lesson's progress record, so it syncs with cloudProgress.
    markConceptLearned: function (cid, lid, level, xp) {
      var k = this._pkey(cid, lid);
      var p = state.progress[k] || { done: {}, xp: 0, solved: 0 };
      p.learned = p.learned || {};
      if (!p.learned[level]) { p.learned[level] = true; p.xp += (xp || 0); }
      state.progress[k] = p; save(); return p;
    },
    learnCompletion: function (cid, lid, total) {
      var p = this.lessonProgress(cid, lid);
      var done = Object.keys(p.learned || {}).length, t = total || 0;
      return { done: done, total: t, pct: t ? Math.round(Math.min(done, t) / t * 100) : 0 };
    },
    // total distinct correct answers in a lesson (grade counts these; EXP is unbounded)
    lessonSolved: function (cid, lid) {
      var p = this.lessonProgress(cid, lid);
      return p.solved != null ? p.solved : Object.keys(p.done || {}).length;
    },
    // grade out of the syllabus target: capped at target, but EXP keeps growing past it
    lessonGrade: function (cid, lid, target) {
      var s = this.lessonSolved(cid, lid), t = target || 0;
      return { solved: s, target: t, earned: Math.min(s, t), pct: t ? Math.round(Math.min(s, t) / t * 100) : 0 };
    },
    classExp: function (cls) {
      var self = this, x = 0;
      (cls.lessonIds || []).forEach(function (lid) { x += self.lessonProgress(cls.id, lid).xp || 0; });
      return x;
    },
    // overall completion across the class using per-lesson grade targets
    classCompletion: function (cls, targets) {
      var self = this, done = 0, total = 0;
      (cls.lessonIds || []).forEach(function (lid) {
        var t = (targets && targets[lid]) || 0; total += t;
        done += Math.min(self.lessonSolved(cls.id, lid), t);
      });
      return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
    },
    classProgressPct: function (cls, lessonProblemCounts) {
      return this.classCompletion(cls, lessonProblemCounts).pct;
    },

    // ----- drawings -----
    _dkey: function (cid, lid, pid) { return cid + "::" + lid + "::" + pid; },
    getDrawing: function (cid, lid, pid) { return state.drawings[this._dkey(cid, lid, pid)]; },
    saveDrawing: function (cid, lid, pid, dataURL) { state.drawings[this._dkey(cid, lid, pid)] = dataURL; save(); },

    // ----- uploads (syllabus / textbooks / homework) -----
    // textbooks: array of { kind:"name"|"cover", value } — the AI stage looks each up online.
    getUploads: function (cid) {
      var u = state.uploads[cid] || {};
      return { syllabus: u.syllabus || null, textbooks: u.textbooks || [], homework: u.homework || [] };
    },
    setUpload: function (cid, kind, name) {
      var u = state.uploads[cid] || {};
      if (kind === "homework") { u.homework = u.homework || []; u.homework.push(name); }
      else u[kind] = name; // syllabus
      state.uploads[cid] = u; save();
    },
    addTextbook: function (cid, kind, value) {
      var u = state.uploads[cid] || {}; u.textbooks = u.textbooks || [];
      u.textbooks.push({ kind: kind, value: value }); state.uploads[cid] = u; save();
    },
    removeTextbook: function (cid, i) {
      var u = state.uploads[cid]; if (!u || !u.textbooks) return;
      u.textbooks.splice(i, 1); save();
    },

    // ----- modes -----
    getMode: function (cid) { return state.modes[cid] || { online: false }; },
    setOnline: function (cid, on) {
      var m = state.modes[cid] || { online: false }; m.online = on; state.modes[cid] = m; save();
    },

    // ----- notebook (saved scratch-work pages) -----
    notebookEntries: function () { return (state.notebook || []).slice().reverse(); },
    addNotebookEntry: function (entry) {
      state.notebook = state.notebook || [];
      entry.id = "nb" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      entry.date = entry.date || new Date().toISOString();
      state.notebook.push(entry); save(); return entry;
    },
    removeNotebookEntry: function (id) {
      state.notebook = (state.notebook || []).filter(function (e) { return e.id !== id; }); save();
    },

    // ----- scratch resume (vector strokes per problem, for auto-save) -----
    _skey: function (cid, lid, pid) { return (cid || "_") + "::" + (lid || "_") + "::" + (pid || "_"); },
    getScratch: function (cid, lid, pid) { return (state.scratch || {})[this._skey(cid, lid, pid)] || null; },
    saveScratch: function (cid, lid, pid, strokesJSON) {
      state.scratch = state.scratch || {};
      if (strokesJSON) state.scratch[this._skey(cid, lid, pid)] = strokesJSON;
      else delete state.scratch[this._skey(cid, lid, pid)];
      save();
    }
  };
})();
