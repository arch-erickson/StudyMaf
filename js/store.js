/* StudyMAF — persistent state (localStorage). MVP: no backend.
 * Everything the user creates (classes, progress, accent, drawings, uploads,
 * mode settings) lives client-side. Lesson CONTENT still comes from /data JSON.
 */
window.Store = (function () {
  "use strict";
  var KEY = "studymaf.v1";
  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
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
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota */ }
  }
  function uid() { return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  return {
    all: function () { return state; },

    // ----- one-time migration flags -----
    flag: function (name) { return !!(state.flags && state.flags[name]); },
    setFlag: function (name) { state.flags = state.flags || {}; state.flags[name] = true; save(); },

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
        createdAt: Date.now()
      };
      state.classes.push(c); save(); return c;
    },
    removeClass: function (id) {
      state.classes = state.classes.filter(function (c) { return c.id !== id; });
      delete state.uploads[id]; delete state.modes[id]; save();
    },

    // ----- progress -----
    _pkey: function (cid, lid) { return cid + "::" + lid; },
    lessonProgress: function (cid, lid) {
      var k = this._pkey(cid, lid);
      return state.progress[k] || { done: {}, xp: 0 };
    },
    markProblemDone: function (cid, lid, pid, xp) {
      var k = this._pkey(cid, lid);
      var p = state.progress[k] || { done: {}, xp: 0 };
      if (!p.done[pid]) { p.done[pid] = true; p.xp += (xp || 0); }
      state.progress[k] = p; save(); return p;
    },
    classProgressPct: function (cls, lessonProblemCounts) {
      // lessonProblemCounts: { lessonId: total }
      var total = 0, done = 0, self = this;
      (cls.lessonIds || []).forEach(function (lid) {
        var t = lessonProblemCounts[lid] || 0;
        total += t;
        var p = self.lessonProgress(cls.id, lid);
        done += Math.min(Object.keys(p.done).length, t);
      });
      return total ? Math.round((done / total) * 100) : 0;
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
