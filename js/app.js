/* StudyMAF — app shell: routing, dashboard, class page, sequential study session,
 * test/homework modes, accent theming, uploads. Content comes from /data JSON.
 *
 * AI-dependent features (tutor, syllabus/homework -> generated lessons) are
 * scaffolded with clear "next stage" notices: this MVP is static, no backend/keys.
 */
window.App = (function () {
  "use strict";

  var appEl, lessonIndex = [], lessonCache = {}, catalog = { classes: [] }, AccountUI = null;
  // ---- class catalog (join codes + syllabus grade targets) ----
  function catalogClassByCode(code) {
    var c = String(code || "").trim().toUpperCase();
    return (catalog.classes || []).filter(function (k) { return String(k.code || "").toUpperCase() === c; })[0];
  }
  function catalogMeta(cat) {
    var targets = {}, chapters = {}, ids = [];
    (cat.lessons || []).forEach(function (l) { ids.push(l.id); targets[l.id] = (l.problems || []).length; chapters[l.id] = l.chapter || ""; });
    return { lessonIds: ids, lessonTargets: targets, chapters: chapters };
  }
  // grade targets for a class: prefer stored catalog targets, else fall back to authored problem counts
  function lessonTargetsFor(cls) {
    if (cls.lessonTargets && Object.keys(cls.lessonTargets).length) return cls.lessonTargets;
    var m = {}; (cls.lessonIds || []).forEach(function (lid) { var e = lessonIndex.filter(function (x) { return x.id === lid; })[0]; m[lid] = e ? (e.problemCount || 0) : 0; });
    return m;
  }
  // Sparkle mark shown on each lesson when the class's online tutor is enabled.
  var SPARKLE_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M10 2c.35 4.2 2.3 6.15 6.5 6.5-4.2.35-6.15 2.3-6.5 6.5-.35-4.2-2.3-6.15-6.5-6.5C7.7 8.15 9.65 6.2 10 2Z"/><path d="M18 13.5c.18 2.1 1.15 3.07 3.25 3.25-2.1.18-3.07 1.15-3.25 3.25-.18-2.1-1.15-3.07-3.25-3.25 2.1-.18 3.07-1.15 3.25-3.25Z"/></svg>';
  var TUTOR_URL = "REPLACE_WITH_YOUR_TUTOR_URL"; // legacy external-tutor URL (no longer surfaced in the UI)
  var TUTOR_API_URL = "https://studymaf-tutor.vercel.app/api/tutor/chat";
  // This is updated as a student moves through StudyMAF. The API receives the
  // exact lesson/problem text; the tutor does not have to guess from the URL.
  var tutorContext = { page: "dashboard", lesson_id: "", lesson_title: "", chapter: "", textbook: "", question_id: "", question_prompt: "", hint: "" };
  function tutorLearnerId() {
    var signedIn = window.StudyMAFAccount;
    if (signedIn && signedIn.user && signedIn.user.id) return signedIn.user.id;
    var key = "studymaf-tutor-learner", id = localStorage.getItem(key);
    if (!id) { id = "learner-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); localStorage.setItem(key, id); }
    return id;
  }
  function setTutorContext(next) {
    tutorContext = Object.assign({ page: String(location.hash || "#/"), learner_id: tutorLearnerId(), class_id: "", lesson_id: "", lesson_title: "", chapter: "", textbook: "", question_id: "", question_prompt: "", hint: "" }, next || {});
    if (window.__studymafTutor && window.__studymafTutor.updateContext) window.__studymafTutor.updateContext(tutorContext);
  }
  // Textbook titles for a class. Under the City Tech MVP these come from the
  // course catalog (the professor's class), with any locally-noted books as a
  // fallback for older installs.
  function classTextbookList(cls) {
    var cat = cls && catalogClassByCode(cls.code);
    if (cat && (cat.textbooks || []).length) return cat.textbooks.slice();
    return ((cls && Store.getUploads(cls.id).textbooks) || []).map(function (b) { return b.value; });
  }
  function classTextbooks(cls) {
    return classTextbookList(cls).join("; ");
  }
  function recordTutorAttempt(outcome) {
    if (!tutorContext.lesson_id || !tutorContext.question_id) return;
    var session = window.StudyMAFSession;
    if (!session || !session.access_token) return;
    fetch(TUTOR_API_URL.replace(/\/chat$/, "/track"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token }, body: JSON.stringify({ context: tutorContext, outcome: outcome }) }).catch(function () {});
  }

  // ---------- helpers ----------
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function h(html) { var d = document.createElement("div"); d.innerHTML = html; return d; }
  function icon(name) { return window.Icons ? Icons.get(name) : ""; }
  // button with an SVG icon + text label
  function ib(cls, iconName, label) { var b = el("button", cls); b.innerHTML = icon(iconName) + "<span>" + esc(label) + "</span>"; return b; }

  // ---- rich text: renders math ($...$) AND outlines glossary keywords ----
  function splitMath(text) {
    var out = [], re = /(\$\$[^$]*\$\$|\$[^$]*\$)/g, last = 0, m;
    while ((m = re.exec(text))) { if (m.index > last) out.push({ math: false, s: text.slice(last, m.index) }); out.push({ math: true, s: m[0] }); last = m.index + m[0].length; }
    if (last < text.length) out.push({ math: false, s: text.slice(last) });
    return out;
  }
  function richText(container, text, glossary) {
    container.innerHTML = "";
    if (text == null) return container;
    var keys = glossary ? Object.keys(glossary) : [];
    keys.sort(function (a, b) { return b.length - a.length; });
    var re = keys.length ? new RegExp("\\b(" + keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")\\b", "gi") : null;
    var used = {};
    splitMath(text).forEach(function (seg) {
      if (seg.math || !re) { container.appendChild(document.createTextNode(seg.s)); return; }
      var s = seg.s, last = 0, m;
      re.lastIndex = 0;
      while ((m = re.exec(s))) {
        if (m.index > last) container.appendChild(document.createTextNode(s.slice(last, m.index)));
        var matched = m[0], key = null, lm = matched.toLowerCase();
        for (var i = 0; i < keys.length; i++) if (keys[i].toLowerCase() === lm) { key = keys[i]; break; }
        if (key && !used[key.toLowerCase()]) {
          used[key.toLowerCase()] = true;
          var b = el("button", "kw", matched);
          b.onclick = (function (k) { return function () { openDefinition(k, glossary[k]); }; })(key);
          container.appendChild(b);
        } else { container.appendChild(document.createTextNode(matched)); }
        last = m.index + matched.length;
      }
      if (last < s.length) container.appendChild(document.createTextNode(s.slice(last)));
    });
    StudyMath.render(container);
    return container;
  }
  // A definition either fills the concept reader's right-side dock (when the
  // reader is open) or, elsewhere, opens as a small overlay.
  var currentDefSink = null;
  function openDefinition(term, def) { if (!def) return; if (currentDefSink) currentDefSink(term, def); else showKeyword(term, def); }
  // keyword definitions open in their OWN layer, above the concept reader (which
  // lives in modal-host), so the reader is never destroyed.
  function showKeyword(term, def) {
    if (!def) return;
    var layer = el("div", "overlay kw-layer");
    layer.style.zIndex = "150";
    var m = el("div", "modal");
    m.innerHTML = "<div class='kw-modal'><h2>" + esc(term) + "</h2>" +
      "<div class='kw-block'><div class='kw-label plain'>In plain terms</div><p id='kw-plain'></p></div>" +
      "<div class='kw-block inclass'><div class='kw-label'>In this class</div><p id='kw-class'></p></div>" +
      "<div class='modal-actions'><button class='btn primary' id='kw-ok'>Got it</button></div></div>";
    layer.appendChild(m); document.body.appendChild(layer);
    richText(m.querySelector("#kw-plain"), def.plain, null);
    richText(m.querySelector("#kw-class"), def.in_class, null);
    function close() { layer.remove(); }
    m.querySelector("#kw-ok").onclick = close;
    layer.onclick = function (e) { if (e.target === layer) close(); };
  }
  function fetchJSON(path) { return fetch(path, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  function loadLesson(id) {
    if (lessonCache[id]) return Promise.resolve(lessonCache[id]);
    var entry = lessonIndex.filter(function (l) { return l.id === id; })[0];
    if (!entry) return Promise.reject(new Error("Unknown lesson " + id));
    return fetchJSON("data/" + entry.file).then(function (j) { lessonCache[id] = j; return j; });
  }

  // ---------- accent ----------
  function applyAccent(hex) {
    document.documentElement.style.setProperty("--accent", hex);
    // pick readable ink for accent buttons
    var ink = contrastInk(hex);
    document.documentElement.style.setProperty("--accent-ink", ink);
    document.querySelectorAll(".accent-dot").forEach(function (d) { d.style.background = hex; });
  }
  function contrastInk(hex) {
    var c = hex.replace("#", ""); if (c.length === 3) c = c.split("").map(function (x) { return x + x; }).join("");
    var r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    var l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return l > 0.62 ? "#2D3142" : "#ffffff";
  }

  // ---------- toast / modal / reward ----------
  function toast(msg) {
    var fx = document.getElementById("fx-layer");
    var t = el("div", "reward-pop");
    var card = el("div", "reward-card");
    card.style.padding = "16px 24px"; card.appendChild(el("div", "xp", msg));
    t.appendChild(card); t.style.alignItems = "flex-start"; t.style.paddingTop = "80px"; t.style.pointerEvents = "none";
    fx.appendChild(t); setTimeout(function () { t.remove(); }, 1400);
  }
  function reward(xp, iconName, label) {
    var fx = document.getElementById("fx-layer");
    var pop = el("div", "reward-pop");
    var card = el("div", "reward-card");
    var big = el("div", "big"); big.innerHTML = icon(iconName || "check"); card.appendChild(big);
    if (label) card.appendChild(el("div", null, label));
    card.appendChild(el("div", "xp", "+" + xp + " XP"));
    pop.appendChild(card); fx.appendChild(pop);
    setTimeout(function () { pop.remove(); }, 1200);
  }
  function modal(html, opts) {
    var host = document.getElementById("modal-host");
    host.innerHTML = ""; host.hidden = false; host.setAttribute("aria-hidden", "false");
    var m = el("div", "modal" + (opts && opts.wide ? " wide" : ""));
    var dismiss = el("button", "modal-x", "×");
    dismiss.type = "button"; dismiss.setAttribute("aria-label", "Close"); dismiss.setAttribute("data-close", "");
    m.appendChild(dismiss);
    m.appendChild(h(html));
    host.appendChild(m);
    host.onclick = function (e) { if (e.target === host || e.target.hasAttribute("data-close")) closeModal(); };
    StudyMath.render(m);
    return m;
  }
  function closeModal() { var host = document.getElementById("modal-host"); host.hidden = true; host.innerHTML = ""; }

  // ---------- thumbnails ----------
  function thumbStyle(seed) {
    var a = "hsl(" + seed + ",42%,58%)", b = "hsl(" + ((seed + 40) % 360) + ",46%,38%)";
    return "background:linear-gradient(135deg," + a + "," + b + ");";
  }

  // ---------- answer checking ----------
  function normalize(s) {
    return String(s).toLowerCase()
      .replace(/\$/g, "").replace(/\\dfrac|\\frac|\\cdot|\\,|\\/g, "")
      .replace(/\s+/g, "").replace(/^x=/, "").replace(/[{}]/g, "");
  }
  function isCorrect(userRaw, answerRaw) {
    var u = normalize(userRaw), a = normalize(answerRaw);
    if (!u) return false;
    if (u === a) return true;
    if (a === normalize("x=" + userRaw)) return true;
    // keyword answers
    if (/nosolution/.test(a) && /nosolution|none|nosol/.test(u)) return true;
    if (/(allreal|identity|allnumbers)/.test(a) && /(all|identity|every)/.test(u)) return true;
    // numeric compare
    var un = parseFloat(u), an = parseFloat(a);
    if (!isNaN(un) && !isNaN(an) && Math.abs(un - an) < 1e-9) return true;
    return false;
  }

  // ====================================================================
  // DASHBOARD
  // ====================================================================
  function renderDashboard() {
    appEl.innerHTML = "";
    var page = el("div", "page wrap");

    var profile = el("div", "profile");
    profile.appendChild(el("div", "avatar", "S"));
    var pinfo = el("div");
    pinfo.appendChild(el("h1", null, "Your classes"));
    pinfo.appendChild(el("p", null, "Pick a class to study, or add a new one."));
    profile.appendChild(pinfo);
    var ipadBtn = ib("btn " + (Store.getIpadMode() ? "primary" : "ghost"), "target", "iPad Mode" + (Store.getIpadMode() ? " · on" : ""));
    ipadBtn.style.marginLeft = "auto";
    ipadBtn.onclick = function () { Store.setIpadMode(!Store.getIpadMode()); applyIpadMode(); renderDashboard(); };
    var mcBtn = ib("btn ghost", "calculator", "Mobile calculator");
    mcBtn.onclick = function () { Calculator.openMobile(); };
    var nbBtn = ib("btn ghost", "bookOpen", "Notebook (" + Store.notebookEntries().length + ")");
    nbBtn.onclick = function () { location.hash = "#/notebook"; };
    profile.appendChild(ipadBtn); profile.appendChild(mcBtn); profile.appendChild(nbBtn);
    page.appendChild(profile);

    var head = el("div", "section-head");
    head.appendChild(el("h2", null, "Classes"));
    page.appendChild(head);

    var grid = el("div", "class-grid");

    Store.classes().forEach(function (c) {
      var card = el("button", "class-card");
      var thumb = el("div", "class-thumb"); thumb.setAttribute("style", thumbStyle(c.thumbSeed));
      var badge = el("span", "thumb-badge", (c.lessonIds.length) + " lesson" + (c.lessonIds.length === 1 ? "" : "s"));
      if (c.code) thumb.appendChild(el("span", "thumb-code", c.code));
      thumb.appendChild(badge); card.appendChild(thumb);
      var body = el("div", "class-body");
      body.appendChild(el("h3", null, c.name));
      var meta = [c.semester, c.year].filter(Boolean).join(" · ") || c.date;
      body.appendChild(el("p", "class-meta", meta));
      var pct = Store.classCompletion(c, lessonTargetsFor(c)).pct;
      var row = el("div", "progress-row");
      var track = el("div", "progress-track"); var fill = el("div", "progress-fill"); fill.style.width = pct + "%"; track.appendChild(fill);
      row.appendChild(track); row.appendChild(el("span", "progress-pct", pct + "%"));
      body.appendChild(row);
      body.appendChild(el("p", "class-xp", Store.classExp(c).toLocaleString() + " XP"));
      card.appendChild(body);
      card.onclick = function () { location.hash = "#/class/" + c.id; };
      grid.appendChild(card);
    });

    if (!Store.classes().length) {
      var emptyCard = el("div", "add-card empty-classes");
      emptyCard.appendChild(el("span", "plus", "◎"));
      emptyCard.appendChild(el("span", null, "Your professor adds you to a class and it appears here automatically."));
      grid.appendChild(emptyCard);
    }

    page.appendChild(grid);
    appEl.appendChild(page);
  }

  // Students join a class with a code their professor gives them. (The professor
  // dashboard that publishes classes + materials comes in a later stage.)
  function openJoinClass() {
    var m = modal(
      "<h2>Add a class</h2><p class='modal-sub'>Enter the class code your professor gave you. It loads the right lessons, textbook, and assignments.</p>" +
      "<div class='field'><label>Class code</label><input id='jc-code' placeholder='e.g. PHYS1442' autocapitalize='characters' autocomplete='off' style='text-transform:uppercase;letter-spacing:.08em;font-weight:700'></div>" +
      "<div id='jc-err' class='join-err' hidden></div>" +
      "<div id='jc-preview' class='join-preview' hidden></div>" +
      "<div class='modal-actions'><button class='btn subtle' data-close>Cancel</button><button class='btn primary' id='jc-join'>Join class</button></div>"
    );
    var input = m.querySelector("#jc-code"), errEl = m.querySelector("#jc-err"), prev = m.querySelector("#jc-preview");
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 40);
    function showErr(msg) { errEl.textContent = msg; errEl.hidden = false; prev.hidden = true; }
    function preview() {
      var cat = catalogClassByCode(input.value); errEl.hidden = true;
      if (!cat) { prev.hidden = true; return; }
      prev.hidden = false;
      prev.innerHTML = "<strong>" + esc(cat.name) + "</strong>" +
        "<span>" + [cat.institution, [cat.semester, cat.year].filter(Boolean).join(" ")].filter(Boolean).join(" · ") + "</span>" +
        "<span>" + (cat.lessons || []).length + " lessons · " + (cat.textbooks || []).length + " textbook(s)</span>";
    }
    input.addEventListener("input", preview);
    function join() {
      var code = input.value.trim();
      if (!code) return showErr("Enter a class code.");
      var cat = catalogClassByCode(code);
      if (!cat) return showErr("No class found for code “" + code.toUpperCase() + "”. Check with your professor.");
      if (Store.classes().some(function (c) { return String(c.code || "").toUpperCase() === String(cat.code).toUpperCase(); }))
        return showErr("You've already added this class.");
      var meta = catalogMeta(cat);
      var cls = Store.addClass({ name: cat.name, semester: cat.semester, year: cat.year, lessonIds: meta.lessonIds, code: cat.code, lessonTargets: meta.lessonTargets, chapters: meta.chapters });
      Store.setUpload(cls.id, "syllabus", "PHYS1442.pdf");
      (cat.textbooks || []).forEach(function (t) { Store.addTextbook(cls.id, "name", t); });
      closeModal(); renderDashboard();
    }
    m.querySelector("#jc-join").onclick = join;
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") join(); });
  }

  // ====================================================================
  // NOTEBOOK (saved scratch-work pages)
  // ====================================================================
  function renderNotebook() {
    appEl.innerHTML = "";
    var page = el("div", "page wrap");
    var crumbs = el("div", "crumbs"); var backLink = el("a", null, "← All classes"); backLink.href = "#/"; backLink.onclick = function (e) { e.preventDefault(); location.hash = "#/"; }; crumbs.appendChild(backLink); page.appendChild(crumbs);
    page.appendChild(el("h1", null, "Notebook"));
    page.appendChild(el("p", "section-sub", "Your saved scratch work, newest first."));

    var entries = Store.notebookEntries();
    if (!entries.length) {
      page.appendChild(el("p", "empty-hint", "Nothing saved yet. Open a problem, tap Scratch work, solve it by hand, then Save As."));
      appEl.appendChild(page); return;
    }
    var grid = el("div", "nb-grid");
    entries.forEach(function (en) {
      var card = el("button", "nb-card");
      var thumb = el("div", "thumb"); if (en.image) thumb.style.backgroundImage = "url(" + en.image + ")";
      var meta = el("div", "meta");
      meta.appendChild(el("h3", null, en.title || en.lessonName));
      var d = new Date(en.date);
      meta.appendChild(el("p", null, en.lessonName + " · " + d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })));
      card.append(thumb, meta);
      card.onclick = function () { viewNotebookEntry(en); };
      grid.appendChild(card);
    });
    page.appendChild(grid);
    appEl.appendChild(page);
  }
  function viewNotebookEntry(en) {
    var m = modal(
      "<h2>" + esc(en.title || en.lessonName) + "</h2>" +
      "<div class='sa-preview' style='max-height:420px'><img src='" + en.image + "' alt='work' style='max-height:420px'></div>" +
      "<div class='modal-actions'><button class='btn subtle' id='nb-del'>Delete</button>" +
      "<button class='btn ghost' id='nb-share'>Share</button>" +
      "<a class='btn primary' href='" + en.image + "' download='studymaf-work.png'>Download</a></div>", { wide: true });
    m.querySelector("#nb-del").onclick = function () { Store.removeNotebookEntry(en.id); closeModal(); renderNotebook(); };
    m.querySelector("#nb-share").onclick = function () {
      try {
        var arr = en.image.split(","), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8 = new Uint8Array(n);
        while (n--) u8[n] = bstr.charCodeAt(n);
        var file = new File([u8], "studymaf-work.png", { type: mime });
        if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: en.title || "StudyMAF" });
        else window.open(en.image, "_blank");
      } catch (e) { window.open(en.image, "_blank"); }
    };
  }

  // ====================================================================
  // CLASS PAGE
  // ====================================================================
  function renderClass(id, focusLesson) {
    var cls = Store.getClass(id);
    if (!cls) { location.hash = "#/"; return; }
    setTutorContext({ page: "class", class_id: cls.id, class_name: cls.name, textbook: classTextbooks(cls) });
    appEl.innerHTML = "";
    var page = el("div", "page wrap");

    var crumbs = el("div", "crumbs"); var backLink = el("a", null, "← All classes"); backLink.href = "#/"; backLink.onclick = function (e) { e.preventDefault(); location.hash = "#/"; }; crumbs.appendChild(backLink); page.appendChild(crumbs);

    var hero = el("div", "class-hero");
    var htext = el("div");
    htext.appendChild(el("h1", null, cls.name));
    htext.appendChild(el("p", "sub", [cls.semester, cls.year].filter(Boolean).join(" · ")));
    hero.appendChild(htext);
    var del = el("button", "btn subtle", "Remove class");
    del.onclick = function () { if (confirm("Remove this class? Progress stays saved but the card is removed.")) { Store.removeClass(id); location.hash = "#/"; } };
    hero.appendChild(del);
    page.appendChild(hero);

    // class-wide stats: total EXP + overall completion vs syllabus
    var targets = lessonTargetsFor(cls);
    var comp = Store.classCompletion(cls, targets), totXp = Store.classExp(cls);
    var stats = el("div", "class-stats");
    function stat(label, value, sub) { var s = el("div", "cstat"); s.appendChild(el("div", "cstat-val", value)); s.appendChild(el("div", "cstat-label", label)); if (sub) s.appendChild(el("div", "cstat-sub", sub)); return s; }
    stats.appendChild(stat("Total XP", totXp.toLocaleString(), "grows with every question — no cap"));
    var compStat = stat("Course completion", comp.pct + "%", comp.done + " / " + comp.total + " problems");
    var barWrap = el("div", "cstat-bar"); var barFill = el("div", "cstat-bar-fill"); barFill.style.width = comp.pct + "%"; barWrap.appendChild(barFill); compStat.appendChild(barWrap);
    stats.appendChild(compStat);
    page.appendChild(stats);

    // toolbar
    var mode = Store.getMode(id);
    var tb = el("div", "toolbar");
    var g1 = el("div", "group");
    var calcBtn = ib("btn ghost", "calculator", "Calculator"); calcBtn.onclick = function () { Calculator.open(); };
    var hwBtn = ib("btn ghost", "edit", "Homework"); hwBtn.onclick = function () { homeworkMode(id); };
    var testBtn = ib("btn ghost", "target", "Test mode"); testBtn.onclick = function () { testModeIntro(id); };
    var matBtn = ib("btn ghost", "book", "Materials"); matBtn.onclick = function () { materialsDialog(id); };
    g1.append(calcBtn, hwBtn, testBtn, matBtn);
    tb.appendChild(g1);
    tb.appendChild(el("div", "spacer"));
    // online toggle
    var sw = el("label", "switch");
    var inp = document.createElement("input"); inp.type = "checkbox"; inp.checked = mode.online;
    var track = el("span", "track");
    sw.appendChild(el("span", "mode-tag", "Online tutor")); sw.appendChild(inp); sw.appendChild(track);
    inp.onchange = function () { Store.setOnline(id, inp.checked); renderClass(id); };
    tb.appendChild(sw);
    page.appendChild(tb);


    // lessons
    page.appendChild(el("h2", "step-block", "Lessons"));
    var list = el("div", "lesson-list");
    if (!cls.lessonIds.length) list.appendChild(el("p", "empty-hint", "No lessons yet. Add lessons via data/index.json (or upload a syllabus in a later stage)."));
    cls.lessonIds.forEach(function (lid, i) {
      list.appendChild(buildLessonRow(cls, lid, i));
    });
    page.appendChild(list);
    appEl.appendChild(page);
    if (focusLesson) {
      var focus = list.querySelector("[data-lesson-id='" + String(focusLesson).replace(/'/g, "\\'") + "'] .lesson-btn");
      if (focus) setTimeout(function () { focus.click(); focus.scrollIntoView({ behavior: "smooth", block: "center" }); }, 20);
    }
  }

  function buildLessonRow(cls, lid, i) {
    var entry = lessonIndex.filter(function (l) { return l.id === lid; })[0] || { title: lid, problemCount: 20 };
    var prog = Store.lessonProgress(cls.id, lid);
    var target = lessonTargetsFor(cls)[lid] || entry.problemCount || 0;
    var grade = Store.lessonGrade(cls.id, lid, target);
    var chapter = (cls.chapters && cls.chapters[lid]) || "";

    var row = el("div", "lesson"); row.setAttribute("aria-expanded", "false"); row.setAttribute("data-lesson-id", lid);
    var btn = el("button", "lesson-btn");
    btn.appendChild(el("span", "lesson-idx", String(i + 1)));
    var main = el("div", "lesson-main");
    main.appendChild(el("p", "name", "Lesson " + (i + 1) + ": " + entry.title));
    var mp = el("div", "mini-progress");
    var track = el("div", "progress-track"); var fill = el("div", "progress-fill"); fill.style.width = grade.pct + "%"; track.appendChild(fill);
    mp.appendChild(track);
    mp.appendChild(el("span", "progress-pct", "Grade " + grade.earned + "/" + grade.target));
    mp.appendChild(el("span", "lesson-xp", (prog.xp || 0).toLocaleString() + " XP"));
    if (chapter) mp.appendChild(el("span", "lesson-chapter", chapter));
    main.appendChild(mp); btn.appendChild(main);
    if (isOnline(cls)) {
      var spark = el("span", "lesson-ai"); spark.title = "Online tutor is on for this class";
      spark.innerHTML = SPARKLE_SVG; btn.appendChild(spark);
    }
    var caret = el("span", "lesson-caret"); caret.innerHTML = icon("chevronRight"); btn.appendChild(caret);
    row.appendChild(btn);

    var panel = el("div", "lesson-panel"); panel.hidden = true;
    row.appendChild(panel);

    var loaded = false;
    btn.onclick = function () {
      var open = row.getAttribute("aria-expanded") === "true";
      row.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
      if (!open && !loaded) {
        loaded = true;
        panel.appendChild(el("p", "lp-summary", "Loading…"));
        loadLesson(lid).then(function (lesson) {
          setTutorContext({ page: "lesson", class_id: cls.id, class_name: cls.name, lesson_id: lid, lesson_title: lesson.title, lesson_summary: lesson.summary, chapter: chapter, textbook: classTextbooks(cls) });
          panel.innerHTML = "";
          var sum = el("p", "lp-summary", lesson.summary); panel.appendChild(sum); StudyMath.render(sum);
          // Difficulty is chosen inside Practice / Quiz / Test — not on the lesson card.
          // Learn is guided and needs no difficulty.
          var acts = el("div", "lp-actions");
          var learn = ib("btn primary", "bookOpen", "Learn");
          learn.onclick = function () { startLearn(cls, lid, lesson); };
          var practiceLbl = grade.solved > 0 && grade.solved < grade.target ? "Practice · Continue" : (grade.target && grade.solved >= grade.target ? "Practice again" : "Practice");
          var practice = ib("btn ghost", "play", practiceLbl);
          practice.onclick = function () { practiceIntro(cls, lid, lesson); };
          var quiz = ib("btn ghost", "target", "Quiz");
          quiz.onclick = function () { startQuiz(cls, lid, lesson); };
          acts.append(learn, practice, quiz);
          panel.appendChild(acts);
        }).catch(function (e) { panel.innerHTML = "<p class='lp-summary'>Couldn't load lesson: " + esc(e.message) + "</p>"; });
      }
    };
    return row;
  }

  // ---------- concept reader (sequential reveal + per-concept diagrams,
  //            keyword definitions, expandable real-world examples) ----------
  function conceptReader(lesson) {
    setTutorContext(Object.assign({}, tutorContext, { page: "concept reader", lesson_title: lesson.title, lesson_summary: lesson.summary }));
    var gloss = lesson.glossary || null;
    // full-screen reader: concepts on the left, a dockable definition panel on
    // the right, and its own X to close the whole thing.
    var overlay = el("div", "reader-overlay");
    var reader = el("div", "reader");
    var head = el("div", "reader-head");
    var htitle = el("div", "reader-title");
    htitle.appendChild(el("h2", null, lesson.title));
    htitle.appendChild(el("p", "reader-sub", "A guided lesson — reveal each level in turn. Underlined words are clickable definitions."));
    var xBtn = el("button", "reader-x"); xBtn.innerHTML = icon("x"); xBtn.title = "Close";
    head.append(htitle, xBtn); reader.appendChild(head);

    var cols = el("div", "reader-cols");
    var scroll = el("div", "reader-scroll");
    var defPanel = el("div", "reader-def"); defPanel.hidden = true;
    cols.append(scroll, defPanel); reader.appendChild(cols);
    overlay.appendChild(reader); document.body.appendChild(overlay);

    function closeReader() { currentDefSink = null; overlay.remove(); }
    xBtn.onclick = closeReader;
    overlay.addEventListener("keydown", function (e) { if (e.key === "Escape") closeReader(); });

    // clicking a keyword fills (or replaces) the right-side definition dock
    currentDefSink = function (term, def) {
      defPanel.hidden = false; defPanel.innerHTML = "";
      var dh = el("div", "rdef-head");
      dh.appendChild(el("h3", null, term));
      var dx = el("button", "rdef-x"); dx.innerHTML = icon("x"); dx.title = "Close definition";
      dx.onclick = function () { defPanel.hidden = true; defPanel.innerHTML = ""; };
      dh.appendChild(dx); defPanel.appendChild(dh);
      var b1 = el("div", "rdef-block"); b1.appendChild(el("span", "rdef-label", "In plain terms"));
      var p1 = el("p"); richText(p1, def.plain, null); b1.appendChild(p1);
      var b2 = el("div", "rdef-block inclass"); b2.appendChild(el("span", "rdef-label", "In this class"));
      var p2 = el("p"); richText(p2, def.in_class, null); b2.appendChild(p2);
      defPanel.append(b1, b2);
      defPanel.scrollTop = 0;
    };

    scroll.appendChild(mkEl("div", "sign-legend", "<span class='sl'><span class='sl-dot pos'>+</span> positive</span>" +
      "<span class='sl'><span class='sl-dot neg'>−</span> negative</span>" +
      "<span class='sl'><span class='sl-line'></span> field / force</span>"));

    var sections = (lesson.concept_sections || []).slice().sort(function (a, b) { return a.level - b.level; });
    var listWrap = el("div", "concept-list"); scroll.appendChild(listWrap);
    var shown = 0, revealBtn = null;
    function showNext() {
      if (shown >= sections.length) return;
      var s = sections[shown];
      var c = el("div", "concept");
      c.appendChild(el("span", "level-tag", "Level " + s.level));
      c.appendChild(el("h3", null, s.heading));
      var p = el("p"); c.appendChild(p); richText(p, s.explanation, gloss);
      if (s.figure) c.appendChild(Figures.element(s.figure));
      // step-by-step in relation to the math — makes the level feel like a lesson
      if (s.math_steps && s.math_steps.length) {
        var mb = el("div", "concept-math");
        mb.appendChild(el("span", "cm-label", "Step by step"));
        var ol = document.createElement("ol"); ol.className = "cm-steps";
        s.math_steps.forEach(function (st) { var li = el("li"); richText(li, st, gloss); ol.appendChild(li); });
        mb.appendChild(ol); c.appendChild(mb);
      }
      listWrap.appendChild(c);
      shown++; renderReveal();
    }
    function renderReveal() {
      if (revealBtn) revealBtn.remove();
      if (shown < sections.length) {
        revealBtn = el("button", "reveal-more", "Reveal next level (" + (sections.length - shown) + " more) →");
        revealBtn.onclick = showNext; listWrap.appendChild(revealBtn);
      }
    }
    showNext();

    // real-world examples — cards that expand to detail + diagram
    if ((lesson.real_world_examples || []).length) {
      scroll.appendChild(el("h3", "step-block", "Real-world examples"));
      var list = el("div", "example-list");
      lesson.real_world_examples.forEach(function (ex) {
        var card = el("div", "ex-card"); card.setAttribute("aria-expanded", "false");
        var ehead = el("button", "ex-head");
        var htext = el("div", "ex-head-text");
        htext.appendChild(el("h4", null, ex.title));
        var sc = el("p", "ex-scenario"); richText(sc, ex.scenario, gloss); htext.appendChild(sc);
        ehead.appendChild(htext);
        var car = el("span", "ex-caret"); car.innerHTML = icon("chevronRight"); ehead.appendChild(car);
        card.appendChild(ehead);

        var panel = el("div", "ex-panel"); panel.hidden = true;
        var ap = el("div", "ex-applies");
        ap.appendChild(el("span", "ex-tag", "How the math applies"));
        var apt = el("p"); richText(apt, ex.how_the_math_applies, gloss); ap.appendChild(apt);
        panel.appendChild(ap);
        if (ex.detail) { var dt = el("p", "ex-detail"); richText(dt, ex.detail, gloss); panel.appendChild(dt); }
        if (ex.figure) panel.appendChild(Figures.element(ex.figure));
        card.appendChild(panel);

        ehead.onclick = function () {
          var open = card.getAttribute("aria-expanded") === "true";
          card.setAttribute("aria-expanded", String(!open)); panel.hidden = open;
        };
        list.appendChild(card);
      });
      scroll.appendChild(list);
    }
  }
  // small helper: element with raw innerHTML
  function mkEl(tag, cls, html) { var n = el(tag, cls); n.innerHTML = html; return n; }

  // ====================================================================
  // LEARN MODE — guided, sequential: one concept, then a practice check on
  // it, then the next concept, ending with the real-world examples. Keeps
  // hints / step-by-step / tutorial / unlimited tries; you may skip; concepts
  // and correct checks earn XP + completion. (Offline; the online/AI-guided
  // variant reuses this same structure.)
  // ====================================================================
  function learnDiffForLevel(level, total, diffs) {
    var order = ["easy", "medium", "hard", "extreme", "stretch"];
    var avail = order.filter(function (d) { return diffs.indexOf(d) >= 0; });
    if (!avail.length) avail = (diffs || []).slice();
    if (!avail.length) return "easy";
    var idx = Math.min(avail.length - 1, Math.floor((level - 1) / Math.max(1, total) * avail.length));
    return avail[idx];
  }

  function startLearn(cls, lid, lesson) {
    var gloss = lesson.glossary || null;
    var sections = (lesson.concept_sections || []).slice().sort(function (a, b) { return a.level - b.level; });
    var diffs = lessonDifficulties(lid, lesson);
    var hasGen = !!(window.Generators && Generators.has(lid));
    setTutorContext(Object.assign({}, tutorContext, { page: "learn mode", class_id: cls.id, lesson_id: lid, lesson_title: lesson.title, lesson_summary: lesson.summary }));

    // linear walk: concept, its check, concept, check, …, examples, done
    var steps = [];
    sections.forEach(function (s) {
      steps.push({ type: "concept", section: s });
      steps.push({ type: "practice", level: s.level, diff: learnDiffForLevel(s.level, sections.length, diffs) });
    });
    if ((lesson.real_world_examples || []).length) steps.push({ type: "examples" });
    steps.push({ type: "done" });
    var i = 0, streak = 0, xpTotal = 0;

    var session = el("div", "session learn-session");
    var top = el("div", "session-top");
    var closeX = el("button", "close-x"); closeX.innerHTML = icon("x"); closeX.onclick = function () { session.remove(); renderClass(cls.id); };
    var track = el("div", "session-progress"); var fill = el("div", "fill"); track.appendChild(fill);
    var xpEl = el("div", "session-xp"), streakEl = el("div", "session-streak");
    function setStats() { streakEl.innerHTML = icon("flame") + "<span>" + streak + "</span>"; xpEl.textContent = xpTotal.toLocaleString() + " XP"; }
    setStats();
    top.append(closeX, track, xpEl, streakEl); session.appendChild(top);
    var body = el("div", "session-body"); var inner = el("div", "session-inner"); body.appendChild(inner); session.appendChild(body);
    var foot = el("div", "session-foot"); var footInner = el("div", "session-foot-inner");
    var verdict = el("div", "verdict"); var skipBtn = el("button", "btn subtle lg", "Skip"); var nextBtn = el("button", "btn primary lg", "Continue →");
    footInner.append(verdict, skipBtn, nextBtn); foot.appendChild(footInner); session.appendChild(foot);
    document.body.appendChild(session);

    function setProgress() { fill.style.width = Math.round(i / Math.max(1, steps.length - 1) * 100) + "%"; }
    function advance() { i = Math.min(steps.length - 1, i + 1); render(); }

    function render() {
      setProgress();
      inner.innerHTML = ""; verdict.textContent = ""; verdict.className = "verdict";
      nextBtn.style.display = ""; skipBtn.style.display = "none";
      var step = steps[i];
      if (step.type === "concept") return renderConcept(step.section);
      if (step.type === "practice") return renderPractice(step);
      if (step.type === "examples") return renderExamples();
      return renderDone();
    }

    function renderConcept(s) {
      var c = el("div", "concept learn-concept");
      c.appendChild(el("span", "level-tag", "Concept " + s.level + " of " + sections.length));
      c.appendChild(el("h3", null, s.heading));
      var p = el("p"); c.appendChild(p); richText(p, s.explanation, gloss);
      if (s.figure) c.appendChild(Figures.element(s.figure));
      if (s.math_steps && s.math_steps.length) {
        var mb = el("div", "concept-math"); mb.appendChild(el("span", "cm-label", "Step by step"));
        var ol = document.createElement("ol"); ol.className = "cm-steps";
        s.math_steps.forEach(function (st) { var li = el("li"); richText(li, st, gloss); ol.appendChild(li); });
        mb.appendChild(ol); c.appendChild(mb);
      }
      inner.appendChild(c);
      // ONLINE: Rho guides the concept — personalized explanation + back-and-forth.
      if (isOnline(cls)) {
        tutorPanel(inner, {
          context: { page: "learn concept", concept_heading: s.heading },
          intro: "I'll walk you through this. Ask me anything, or tap Continue when it clicks.",
          auto: "Explain this concept simply for a student learning it now, then ask me one quick check question. Concept: " + s.heading + " — " + s.explanation,
          autoLabel: "Explain: " + s.heading,
          quick: [
            { label: "Explain more", prompt: "Go deeper on \"" + s.heading + "\" with a worked example." },
            { label: "Make it simpler", prompt: "Explain \"" + s.heading + "\" as simply as you can, like I'm new to it." },
            { label: "Real-world example", prompt: "Give a concrete real-world example of \"" + s.heading + "\"." },
            { label: "Why it matters", prompt: "Why does \"" + s.heading + "\" matter in this class and beyond?" }
          ],
          onContinue: advance
        });
      }
      Store.markConceptLearned(cls.id, lid, s.level, 5); // completion + a little XP, once
      nextBtn.textContent = "Continue →"; nextBtn.onclick = advance;
    }

    function renderPractice(step) {
      if (!hasGen) { advance(); return; }
      var inst = Generators.make(lid, step.diff);
      if (!inst) { advance(); return; }
      setTutorContext(Object.assign({}, tutorContext, { page: "learn practice", question_prompt: inst.prompt, hint: inst.hint || "", difficulty: inst.difficulty || "" }));
      var wrap = el("div", "learn-check");
      wrap.appendChild(el("span", "cm-label", "Check your understanding"));
      var badgeRow = el("div", "q-badge-row"); badgeRow.appendChild(el("span", "q-badge " + inst.difficulty, inst.difficulty));
      if (inst.source) badgeRow.appendChild(el("span", "q-source", inst.source)); wrap.appendChild(badgeRow);
      var prompt = el("div", "q-prompt"); prompt.textContent = inst.prompt; wrap.appendChild(prompt); StudyMath.render(prompt);
      var inputs = [];
      if (inst.type === "numeric") inputs.push(numericField(wrap, inst));
      else if (inst.type === "mc") renderChoices(wrap, inst, function () {});
      else if (inst.type === "multi") inst.parts.forEach(function (part, pi) { inputs.push(partField(wrap, part, pi)); });
      var tools = el("div", "q-tools");
      var hintBtn = ib("btn subtle", "bulb", "Hint");
      var tutBtn = ib("btn subtle", "bookOpen", "Tutorial");
      var padBtn = ib("btn subtle", "edit", "Scratch work");
      var calcBtn = ib("btn subtle", "calculator", "Calculator");
      tools.append(hintBtn, tutBtn, padBtn, calcBtn); wrap.appendChild(tools);
      var hintPanel = el("div", "hint-panel"); hintPanel.hidden = true;
      hintPanel.appendChild(el("p", "panel-label", "Hint")); var ht = el("p"); richText(ht, inst.hint || "Work it step by step.", null); hintPanel.appendChild(ht); wrap.appendChild(hintPanel);
      var steppanel = el("div", "steps-panel"); steppanel.hidden = true;
      steppanel.appendChild(el("p", "panel-label", "Solution")); var sol = document.createElement("ol");
      (inst.steps || []).forEach(function (st) { var li = el("li"); richText(li, st, null); sol.appendChild(li); });
      steppanel.appendChild(sol); wrap.appendChild(steppanel);
      hintBtn.onclick = function () { hintPanel.hidden = !hintPanel.hidden; StudyMath.render(hintPanel); };
      tutBtn.onclick = function () { startTutorial(cls, lid, lesson, inst.difficulty); };
      padBtn.onclick = function () { Notebook.openScratch({ classId: cls.id, lessonId: lid, lessonName: lesson.title, problemId: "learn-" + step.level, problemLabel: "Concept " + step.level + " check", prompt: inst.prompt, hasSession: true }); };
      calcBtn.onclick = function () { Calculator.open(); };
      inner.appendChild(wrap);
      // ONLINE: Rho coaches the check — hints first, never the bare answer.
      if (isOnline(cls)) {
        tutorPanel(inner, {
          context: { page: "learn practice", question_prompt: inst.prompt },
          intro: "Stuck? I'll nudge you with hints before giving anything away.",
          quick: [
            { label: "Give me a hint", prompt: "Give ONE small hint for this problem — do not give the answer. Problem: " + inst.prompt },
            { label: "Explain the method", prompt: "Explain the general method to solve this type of problem, without the final number. Problem: " + inst.prompt },
            { label: "Make it easier", prompt: "Restate this problem in an easier way and walk me toward it step by step. Problem: " + inst.prompt }
          ]
        });
      }

      var checked = false;
      skipBtn.style.display = ""; skipBtn.textContent = "Skip"; skipBtn.onclick = advance;
      nextBtn.textContent = "Check";
      nextBtn.onclick = function () {
        if (!checked) {
          var ok = evaluate(inst, inputs);
          checked = true; steppanel.hidden = false; StudyMath.render(steppanel);
          if (ok) {
            verdict.textContent = "Correct!"; verdict.className = "verdict right";
            var xp = { easy: 8, medium: 12, hard: 18, extreme: 30, stretch: 24 }[inst.difficulty] || 10;
            streak++; xpTotal += xp; setStats();
            Store.markProblemDone(cls.id, lid, "learn-" + step.level + "-" + Date.now(), xp);
            reward(xp, streak >= 3 ? "flame" : "check", streak >= 3 ? streak + " in a row!" : "Nice!");
            nextBtn.textContent = "Continue →"; skipBtn.style.display = "none";
          } else {
            verdict.textContent = "Not quite — read the solution, then try a fresh one."; verdict.className = "verdict wrong";
            streak = 0; setStats();
            nextBtn.textContent = "Try another →";
          }
        } else if (verdict.classList.contains("right")) { advance(); }
        else { renderPractice(step); } // unlimited tries: same difficulty, new numbers
      };
    }

    function renderExamples() {
      var c = el("div", "concept learn-concept");
      c.appendChild(el("span", "level-tag", "Real-world examples"));
      c.appendChild(el("h3", null, "See it in the real world"));
      var list = el("div", "example-list");
      (lesson.real_world_examples || []).forEach(function (ex) {
        var card = el("div", "ex-card"); card.setAttribute("aria-expanded", "false");
        var ehead = el("button", "ex-head"); var htext = el("div", "ex-head-text");
        htext.appendChild(el("h4", null, ex.title));
        var scp = el("p", "ex-scenario"); richText(scp, ex.scenario, gloss); htext.appendChild(scp);
        ehead.appendChild(htext); var car = el("span", "ex-caret"); car.innerHTML = icon("chevronRight"); ehead.appendChild(car);
        card.appendChild(ehead);
        var panel = el("div", "ex-panel"); panel.hidden = true;
        var ap = el("div", "ex-applies"); ap.appendChild(el("span", "ex-tag", "How the math applies"));
        var apt = el("p"); richText(apt, ex.how_the_math_applies, gloss); ap.appendChild(apt); panel.appendChild(ap);
        if (ex.detail) { var dt = el("p", "ex-detail"); richText(dt, ex.detail, gloss); panel.appendChild(dt); }
        if (ex.figure) panel.appendChild(Figures.element(ex.figure));
        card.appendChild(panel);
        ehead.onclick = function () { var open = card.getAttribute("aria-expanded") === "true"; card.setAttribute("aria-expanded", String(!open)); panel.hidden = open; };
        list.appendChild(card);
      });
      c.appendChild(list); inner.appendChild(c);
      nextBtn.textContent = "Finish →"; nextBtn.onclick = advance;
    }

    function renderDone() {
      var comp = Store.learnCompletion(cls.id, lid, sections.length);
      var done = el("div"); done.style.textAlign = "center"; done.style.paddingTop = "36px";
      var tro = el("div"); tro.innerHTML = icon("award"); tro.style.color = "var(--accent)";
      var tsvg = tro.querySelector("svg"); if (tsvg) { tsvg.style.width = "3.5rem"; tsvg.style.height = "3.5rem"; }
      done.appendChild(tro);
      done.appendChild(el("h2", null, "Lesson learned!"));
      done.appendChild(el("p", null, "You worked through " + comp.done + " of " + comp.total + " concepts. Total XP: " + Store.lessonProgress(cls.id, lid).xp));
      var row = el("div"); row.style.cssText = "display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap";
      var practice = el("button", "btn primary lg", "Practice problems");
      practice.onclick = function () { session.remove(); startSession(cls, lid, lesson, "mixed"); };
      var back = el("button", "btn subtle lg", "Back to class");
      back.onclick = function () { session.remove(); renderClass(cls.id); };
      row.append(practice, back); done.appendChild(row); inner.appendChild(done);
      skipBtn.style.display = "none"; nextBtn.style.display = "none"; fill.style.width = "100%";
    }

    render();
  }

  // ====================================================================
  // QUIZ MODE — timed check: set count / difficulty / timer; NO hints,
  // steps, tutorial or AI. Afterwards an auto Review shows the missed
  // questions with solutions and which concepts to relearn.
  // ====================================================================
  function startQuiz(cls, lid, lesson, presetDiff) {
    var diffs = lessonDifficulties(lid, lesson);
    var hasGen = !!(window.Generators && Generators.has(lid));
    var poolMax = hasGen ? 20 : (lesson.problems || []).length;
    if (!poolMax) { toast("No questions available for this lesson yet."); return; }
    var chosen = presetDiff && diffs.indexOf(presetDiff) >= 0 ? presetDiff : "mixed";
    var pills = [{ v: "mixed", l: "Mixed" }].concat(diffs.map(function (d) { return { v: d, l: diffLabel(d) }; }));
    var pillHtml = pills.map(function (o) { return "<button class='lp-pill" + (o.v === chosen ? " on" : "") + "' data-v='" + o.v + "'>" + o.l + "</button>"; }).join("");
    var m = modal(
      "<h2>Quiz — " + esc(lesson.title) + "</h2>" +
      "<p class='modal-sub'>Timed. No hints, steps, or tutor — this is the real check. Afterwards you'll get a review of what to relearn.</p>" +
      "<div class='row2'>" +
      "<div class='field'><label>Number of questions</label><input id='q-n' type='number' min='1' max='" + poolMax + "' value='" + Math.min(8, poolMax) + "'></div>" +
      "<div class='field'><label>Time limit (minutes)</label><input id='q-min' type='number' min='1' max='180' value='12'></div>" +
      "</div>" +
      "<div class='field'><label>Difficulty</label><div class='lp-diff' id='q-diff'>" + pillHtml + "</div></div>" +
      "<div class='modal-actions'><button class='btn subtle' data-close>Cancel</button><button class='btn primary' id='q-go'>Start quiz</button></div>"
    );
    m.querySelectorAll("#q-diff .lp-pill").forEach(function (b) {
      b.onclick = function () { chosen = b.getAttribute("data-v"); m.querySelectorAll("#q-diff .lp-pill").forEach(function (x) { x.classList.toggle("on", x === b); }); };
    });
    m.querySelector("#q-go").onclick = function () {
      var n = Math.max(1, Math.min(poolMax, +m.querySelector("#q-n").value || 8));
      var mins = Math.max(1, +m.querySelector("#q-min").value || 12);
      closeModal();
      var qs = buildQuizQuestions(lid, lesson, n, chosen, diffs, hasGen);
      runQuiz(cls, lid, lesson, qs, mins);
    };
  }

  function buildQuizQuestions(lid, lesson, n, diff, diffs, hasGen) {
    var out = [];
    if (hasGen) {
      var plan = [], seen = {};
      for (var k = 0; k < n; k++) plan.push(diff === "mixed" ? (diffs[k % diffs.length] || "medium") : diff);
      plan.forEach(function (d) {
        var inst = null;
        for (var t = 0; t < 12; t++) { var cand = Generators.make(lid, d); if (cand && !seen[cand.prompt]) { inst = cand; break; } inst = cand; }
        if (inst) { seen[inst.prompt] = true; out.push(inst); }
      });
    } else {
      out = shuffle((lesson.problems || []).slice()).slice(0, n).map(function (p) {
        return { type: "numeric", isStatic: true, prompt: p.prompt, correct_answer: p.correct_answer, steps: p.solution_steps || [], difficulty: p.difficulty || "medium" };
      });
    }
    return out;
  }

  function runQuiz(cls, lid, lesson, questions, minutes) {
    if (!questions.length) { toast("No questions available."); return; }
    var session = el("div", "session quiz-session");
    var top = el("div", "session-top");
    var closeX = el("button", "close-x"); closeX.innerHTML = icon("x"); closeX.onclick = function () { clearInterval(timer); session.remove(); renderClass(cls.id); };
    var title = el("div"); title.style.flex = "1"; title.style.fontWeight = "700"; title.textContent = "Quiz · " + questions.length + " questions";
    var clock = el("div", "session-streak", minutes + ":00");
    top.append(closeX, title, clock); session.appendChild(top);
    var body = el("div", "session-body"); var inner = el("div", "session-inner"); inner.style.maxWidth = "760px"; body.appendChild(inner); session.appendChild(body);

    // Quiz allows scratch work + the full calculator (but no hints / steps / tutor).
    var qtools = el("div", "q-tools"); qtools.style.margin = "0 0 16px";
    var padBtn = ib("btn subtle", "edit", "Scratch work");
    var calcBtn = ib("btn subtle", "calculator", "Calculator");
    padBtn.onclick = function () { Notebook.openScratch({ classId: cls.id, lessonId: lid, lessonName: lesson.title, problemId: "quiz", problemLabel: "Quiz scratch", prompt: "Quiz — " + lesson.title, hasSession: true }); };
    calcBtn.onclick = function () { Calculator.open(); };
    qtools.append(padBtn, calcBtn); inner.appendChild(qtools);

    var entries = [];
    questions.forEach(function (q, i) {
      var card = el("div", "steps-panel quiz-q"); card.hidden = false; card.style.marginBottom = "18px";
      card.appendChild(el("span", "q-badge " + (q.difficulty || "medium"), "Q" + (i + 1) + " · " + (q.difficulty || "")));
      var pr = el("div", "q-prompt"); pr.textContent = q.prompt; card.appendChild(pr);
      var inputs = [];
      if (q.isStatic) { var ab = el("div", "answer-box"); var input = document.createElement("input"); input.type = "text"; input.placeholder = "Answer…"; ab.appendChild(input); card.appendChild(ab); inputs.push({ kind: "static", el: input }); }
      else if (q.type === "numeric") inputs.push(numericField(card, q));
      else if (q.type === "mc") renderChoices(card, q, function () {});
      else if (q.type === "multi") q.parts.forEach(function (part, pi) { inputs.push(partField(card, part, pi)); });
      inner.appendChild(card); StudyMath.render(card);
      entries.push({ q: q, inputs: inputs, card: card });
    });
    var submit = el("button", "btn primary lg", "Submit quiz"); submit.style.margin = "10px 0 60px"; submit.onclick = grade; inner.appendChild(submit);
    document.body.appendChild(session);

    var remaining = minutes * 60;
    var timer = setInterval(function () {
      remaining--; var mm = Math.floor(remaining / 60), ss = remaining % 60;
      clock.textContent = mm + ":" + (ss < 10 ? "0" : "") + ss;
      if (remaining <= 0) { clearInterval(timer); grade(); }
    }, 1000);

    function checkEntry(e) { return e.q.isStatic ? isCorrect(e.inputs[0].el.value, e.q.correct_answer) : evaluate(e.q, e.inputs); }
    function grade() {
      clearInterval(timer);
      var correct = 0, wrong = [];
      entries.forEach(function (e) {
        var ok = checkEntry(e);
        e.card.style.borderColor = ok ? "var(--easy)" : "var(--hard)"; e.card.style.borderWidth = "2px";
        if (ok) correct++; else wrong.push(e.q);
      });
      var xp = correct * 6 + (correct === entries.length ? 20 : 0);
      if (xp) Store.addXp(cls.id, lid, xp);
      session.remove();
      quizReview(cls, lid, lesson, correct, entries.length, wrong);
    }
  }

  function quizReview(cls, lid, lesson, correct, total, wrong) {
    var sections = (lesson.concept_sections || []).slice().sort(function (a, b) { return a.level - b.level; });
    var diffs = lessonDifficulties(lid, lesson);
    var online = isOnline(cls);
    var pct = Math.round(correct / total * 100), perfect = correct === total;
    var m = modal(
      "<h2>" + (perfect ? "Perfect!" : "Quiz review — " + correct + " / " + total + " (" + pct + "%)") + "</h2>" +
      (perfect
        ? "<div class='notice'><strong>Nailed it.</strong>You cleared every question. You've got this lesson down.</div>"
        : "<div class='notice'><strong>Here's what to relearn.</strong>Review the questions you missed, then revisit these concepts in Learn mode.</div>") +
      "<div id='qr-wrong'></div>" + (perfect ? "" : "<div id='qr-concepts'></div>") +
      (online ? "<div id='qr-grade'></div>" : "") +
      "<div class='modal-actions'><button class='btn subtle' data-close>Close</button>" +
      (perfect ? "" : "<button class='btn ghost' id='qr-learn'>Relearn in Learn mode</button>") +
      "<button class='btn primary' id='qr-retry'>Retake quiz</button></div>",
      { wide: true }
    );
    // ONLINE: upload your scratch work and get AI feedback / step-by-step grading.
    var gradeHost = m.querySelector("#qr-grade");
    if (gradeHost) {
      gradeHost.appendChild(el("p", "panel-label", "Get step-by-step feedback"));
      var gi = el("p", "modal-sub"); gi.textContent = "Upload a photo of your worked solution — Rho reviews your steps and gives credit for each correct one, not just the final answer.";
      gi.style.margin = "0 0 8px"; gradeHost.appendChild(gi);
      var row = el("div"); row.style.cssText = "display:flex;gap:8px;align-items:center;flex-wrap:wrap";
      var file = document.createElement("input"); file.type = "file"; file.accept = "image/*";
      var go = el("button", "btn primary sm", "Grade my work");
      row.append(file, go); gradeHost.appendChild(row);
      var out = el("div"); out.style.marginTop = "10px"; gradeHost.appendChild(out);
      var missedText = wrong.map(function (q, i) { return (i + 1) + ". " + q.prompt + " (answer: " + (q.correct_answer || "") + ")"; }).join("\n");
      go.onclick = function () {
        var f = file.files[0]; if (!f) { out.textContent = "Choose an image of your work first."; return; }
        out.textContent = "Reviewing your work…"; go.disabled = true;
        compressTutorImage(f).then(function (dataURL) {
          return askRho("Here is a photo of my worked solutions to the quiz questions I missed. Grade each step: say which steps are correct and award partial credit per correct step, then show how to fix the wrong steps. Questions I missed:\n" + missedText, { image: dataURL, context: { page: "quiz step grading", lesson_id: lid } });
        }).then(function (text) { out.innerHTML = ""; renderRhoResponse(out, text); })
          .catch(function (e) { out.textContent = "Couldn't grade your work right now. " + e.message; })
          .finally(function () { go.disabled = false; });
      };
    }
    var wl = m.querySelector("#qr-wrong");
    wrong.forEach(function (q) {
      var c = el("div", "steps-panel"); c.hidden = false; c.style.marginBottom = "12px";
      var pr = el("div"); pr.style.fontWeight = "700"; pr.style.marginBottom = "6px"; pr.textContent = q.prompt; c.appendChild(pr);
      var ans = q.correct_answer || (q.type === "mc" && q.choices ? q.choices[q.answerIndex] : "");
      if (ans) c.appendChild(el("p", null, "Correct answer: " + ans));
      var ol = document.createElement("ol"); (q.steps || q.solution_steps || []).forEach(function (s) { ol.appendChild(el("li", null, s)); });
      c.appendChild(ol); wl.appendChild(c); StudyMath.render(c);
    });
    var cc = m.querySelector("#qr-concepts");
    if (cc) {
      cc.appendChild(el("p", "panel-label", "Concepts to relearn"));
      var ul = document.createElement("ul"); ul.className = "qr-concept-list";
      var missedDiffs = {}; wrong.forEach(function (q) { if (q.difficulty) missedDiffs[q.difficulty] = true; });
      var picked = sections.filter(function (s) {
        if (!Object.keys(missedDiffs).length) return true;
        return missedDiffs[learnDiffForLevel(s.level, sections.length, diffs)];
      });
      if (!picked.length) picked = sections;
      picked.forEach(function (s) { var li = el("li"); richText(li, "Concept " + s.level + ": " + s.heading, null); ul.appendChild(li); });
      cc.appendChild(ul);
      m.querySelector("#qr-learn").onclick = function () { closeModal(); startLearn(cls, lid, lesson); };
    }
    m.querySelector("#qr-retry").onclick = function () { closeModal(); startQuiz(cls, lid, lesson); };
  }

  // ====================================================================
  // ONLINE MODE — AI-tutor-integrated Learn / Practice / Quiz. The pre-generated
  // content still drives the flow; Rho layers on personalized, back-and-forth
  // guidance. Uses the existing tutor endpoint (studymaf.com only) with graceful
  // degradation when it can't be reached (e.g. local dev / offline).
  //
  // FORWARD-COMPATIBLE DIRECTIVE CONTRACT (for the backend prompt to emit): the
  // AI reply MAY include, on their own, any of —
  //   [[CONTINUE]]                         → renders a Continue button
  //   [[CHOICES] a | b | *c | d]           → multiple choice (* marks correct)
  //   [[INPUT] prompt | answer]            → a checked answer field
  // Absent these, the reply renders as normal ANSWER/STEPS/FINAL text.
  // ====================================================================
  function isOnline(cls) { return !!(Store.getMode(cls.id) || {}).online; }

  function askRho(question, opts) {
    opts = opts || {};
    var body = { question: question, context: Object.assign({}, tutorContext, opts.context || {}), history: opts.history || [] };
    if (opts.image) body.image_data = opts.image;
    return fetch(TUTOR_API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Tutor unavailable."); return j.answer || ""; }); });
  }

  function parseRhoDirectives(text) {
    var controls = [], clean = String(text || "");
    clean = clean.replace(/\[\[CONTINUE\]\]/gi, function () { controls.push({ type: "continue" }); return ""; });
    clean = clean.replace(/\[\[CHOICES\]([^\]]*)\]/gi, function (_, b) {
      var opts = b.split("|").map(function (s) { return s.trim(); }).filter(Boolean);
      var answer = -1; opts.forEach(function (o, i) { if (/^\*/.test(o)) answer = i; });
      controls.push({ type: "mc", choices: opts.map(function (o) { return o.replace(/^\*/, ""); }), answer: answer });
      return "";
    });
    clean = clean.replace(/\[\[INPUT\]([^\]]*)\]/gi, function (_, b) {
      var parts = b.split("|"); controls.push({ type: "input", label: (parts[0] || "").trim(), answer: (parts[1] || "").trim() }); return "";
    });
    return { text: clean.trim(), controls: controls };
  }

  function renderControlledResponse(bubble, text, controlHost, opts) {
    opts = opts || {};
    var parsed = parseRhoDirectives(text);
    renderRhoResponse(bubble, parsed.text || "…");
    if (!controlHost) return;
    controlHost.innerHTML = "";
    parsed.controls.forEach(function (ctl) {
      if (ctl.type === "continue") {
        var b = el("button", "btn primary sm", "Continue →");
        b.onclick = function () { if (opts.onContinue) opts.onContinue(); };
        controlHost.appendChild(b);
      } else if (ctl.type === "mc") {
        var box = el("div", "choice-box");
        ctl.choices.forEach(function (c, i) {
          var cb = el("button", "choice"); var t = el("span"); renderTutorText(t, c); cb.appendChild(t);
          cb.onclick = function () {
            var right = i === ctl.answer; cb.classList.add("sel");
            var fb = el("div", "verdict " + (right ? "right" : "wrong")); fb.textContent = right ? "Correct!" : "Not quite — try again.";
            controlHost.appendChild(fb);
          };
          box.appendChild(cb);
        });
        controlHost.appendChild(box);
      } else if (ctl.type === "input") {
        var wrap = el("div", "answer-box"); var inp = document.createElement("input"); inp.type = "text"; inp.placeholder = ctl.label || "Answer…";
        var chk = el("button", "btn subtle sm", "Check");
        chk.onclick = function () { var ok = isCorrect(inp.value, ctl.answer); var fb = el("div", "verdict " + (ok ? "right" : "wrong")); fb.textContent = ok ? "Correct!" : "Not quite."; controlHost.appendChild(fb); };
        wrap.append(inp, chk); controlHost.appendChild(wrap);
      }
    });
  }

  // Reusable AI guidance panel. opts: { context, auto, quick:[{label,prompt}], onContinue, intro }
  function tutorPanel(hostEl, opts) {
    opts = opts || {};
    var panel = el("div", "tutor-panel");
    panel.style.cssText = "margin-top:16px;border:1px solid var(--line,#e5e7eb);border-radius:12px;padding:12px;background:var(--card,#fff)";
    var head = el("div"); head.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:8px";
    var av = el("span"); av.innerHTML = icon("bookOpen"); av.style.color = "var(--accent)";
    head.append(av, el("span", "tutor-panel-label", "Rho — AI tutor")); panel.appendChild(head);
    if (opts.intro) { var pi = el("p", "modal-sub"); pi.textContent = opts.intro; pi.style.margin = "0 0 8px"; panel.appendChild(pi); }
    var log = el("div", "tutor-panel-log"); log.style.cssText = "display:flex;flex-direction:column;gap:10px;max-height:340px;overflow:auto"; panel.appendChild(log);
    var controls = el("div", "tutor-panel-controls"); controls.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"; panel.appendChild(controls);
    var quick = el("div", "tutor-quick"); quick.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-top:10px";
    (opts.quick || []).forEach(function (q) { var b = el("button", "btn subtle sm", q.label); b.onclick = function () { ask(q.prompt, q.label); }; quick.appendChild(b); });
    panel.appendChild(quick);
    var askRow = el("div", "tutor-ask"); askRow.style.cssText = "display:flex;gap:6px;margin-top:10px";
    var input = document.createElement("input"); input.type = "text"; input.placeholder = "Ask Rho about this…"; input.style.cssText = "flex:1;padding:8px 10px;border:1px solid var(--line,#e5e7eb);border-radius:8px";
    var send = el("button", "btn primary sm", "Ask"); askRow.append(input, send); panel.appendChild(askRow);

    function bubble(role) { var b = el("div", "tutor-bubble " + role); b.style.cssText = "padding:8px 10px;border-radius:10px;background:" + (role === "student" ? "var(--accent-weak,#fdece3)" : "var(--surface,#f6f7f9)"); log.appendChild(b); log.scrollTop = log.scrollHeight; return b; }
    function ask(question, shownAs) {
      if (!question) return;
      var sb = bubble("student"); sb.textContent = shownAs || question;
      var thinking = bubble("assistant"); thinking.textContent = "Thinking…";
      askRho(question, { context: opts.context }).then(function (text) {
        thinking.innerHTML = "";
        renderControlledResponse(thinking, text, controls, { onContinue: opts.onContinue });
      }).catch(function (e) { thinking.textContent = "I couldn't reach the tutor right now — you can keep going with the lesson. (" + e.message + ")"; });
    }
    send.onclick = function () { var q = input.value.trim(); input.value = ""; ask(q); };
    input.onkeydown = function (e) { if (e.key === "Enter") send.click(); };
    hostEl.appendChild(panel);
    if (opts.auto) ask(opts.auto, opts.autoLabel || "Guide me through this");
    return { ask: ask };
  }

  // ====================================================================
  // STUDY SESSION — one problem at a time, Duolingo-style rewards
  // ====================================================================
  // Dispatcher: use the generation engine when the lesson has generators,
  // otherwise fall back to the lesson's static problems.
  // Practice difficulty is chosen here (not on the lesson card): a small picker,
  // then the practice session starts at the selected level.
  function practiceIntro(cls, lid, lesson) {
    var diffs = lessonDifficulties(lid, lesson);
    var pills = [{ v: "mixed", l: "Mixed" }].concat(diffs.map(function (d) { return { v: d, l: diffLabel(d) }; }));
    var pillHtml = pills.map(function (o, i) { return "<button type='button' class='lp-pill" + (i === 0 ? " on" : "") + "' data-v='" + o.v + "'>" + o.l + "</button>"; }).join("");
    var m = modal(
      "<h2>Practice — " + esc(lesson.title) + "</h2>" +
      "<p class='modal-sub'>Choose a difficulty. Practice is untimed with hints, worked steps, and the tutor.</p>" +
      "<div class='field'><label>Difficulty</label><div class='lp-diff' id='p-diff'>" + pillHtml + "</div></div>" +
      "<div class='modal-actions'><button class='btn subtle' data-close>Cancel</button><button class='btn primary' id='p-go'>Start practice</button></div>"
    );
    var chosen = "mixed";
    m.querySelectorAll("#p-diff .lp-pill").forEach(function (b) { b.onclick = function () { chosen = b.getAttribute("data-v"); m.querySelectorAll("#p-diff .lp-pill").forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
    m.querySelector("#p-go").onclick = function () { closeModal(); startSession(cls, lid, lesson, chosen); };
  }

  function startSession(cls, lid, lesson, difficulty, problemId) {
    if (window.Generators && Generators.has(lid)) return startGenSession(cls, lid, lesson, difficulty);
    return startStaticSession(cls, lid, lesson, difficulty, problemId);
  }

  // Which difficulty levels this lesson can offer (generative or static).
  function diffLabel(d) { return d === "stretch" ? "Stretch" : d.charAt(0).toUpperCase() + d.slice(1); }
  function lessonDifficulties(lid, lesson) {
    if (window.Generators && Generators.has(lid)) {
      var d = Generators.difficulties ? Generators.difficulties(lid) : [];
      return d.length ? d : ["easy", "medium", "hard", "extreme"];
    }
    var order = ["easy", "medium", "hard", "stretch"], have = {};
    (lesson.problems || []).forEach(function (p) { have[p.difficulty] = true; });
    var out = order.filter(function (k) { return have[k]; });
    return out.length ? out : ["medium"];
  }

  function startStaticSession(cls, lid, lesson, difficulty, problemId) {
    var problems = lesson.problems || [];
    if (difficulty && difficulty !== "mixed") {
      var want = difficulty === "extreme" ? "stretch" : difficulty;
      var filtered = problems.filter(function (p) { return p.difficulty === want; });
      if (filtered.length) problems = filtered;
    }
    var idx = 0, streak = 0, xpTotal = 0;
    var prog = Store.lessonProgress(cls.id, lid);
    // resume at first not-done
    for (var k = 0; k < problems.length; k++) { if (!prog.done[problems[k].id]) { idx = k; break; } }
    if (problemId) {
      var specific = problems.map(function (p) { return p.id; }).indexOf(problemId);
      if (specific >= 0) idx = specific;
    }

    var session = el("div", "session");
    var top = el("div", "session-top");
    var closeX = el("button", "close-x"); closeX.innerHTML = icon("x"); closeX.onclick = function () { session.remove(); renderClass(cls.id); };
    var track = el("div", "session-progress"); var fill = el("div", "fill"); track.appendChild(fill);
    var xpEl = el("div", "session-xp"); function setXp() { xpEl.textContent = xpTotal.toLocaleString() + " XP"; } setXp();
    var streakEl = el("div", "session-streak"); function setStreak(n) { streakEl.innerHTML = icon("flame") + "<span>" + n + "</span>"; } setStreak(0);
    top.append(closeX, track, xpEl, streakEl); session.appendChild(top);

    var body = el("div", "session-body"); var inner = el("div", "session-inner"); body.appendChild(inner); session.appendChild(body);

    var foot = el("div", "session-foot"); var footInner = el("div", "session-foot-inner");
    var verdict = el("div", "verdict"); var nextBtn = el("button", "btn primary lg", "Check");
    footInner.append(verdict, nextBtn); foot.appendChild(footInner); session.appendChild(foot);

    document.body.appendChild(session);

    var state = { checked: false };
    function render() {
      if (idx >= problems.length) return finish();
      fill.style.width = Math.round(idx / problems.length * 100) + "%";
      setStreak(streak);
      var p = problems[idx];
      setTutorContext({ page: "practice problem", class_id: cls.id, class_name: cls.name, lesson_id: lid, lesson_title: lesson.title, lesson_summary: lesson.summary, chapter: (cls.chapters && cls.chapters[lid]) || "", textbook: classTextbooks(cls), question_id: p.id, question_prompt: p.prompt, hint: p.hint || "", difficulty: p.difficulty || "" });
      inner.innerHTML = "";
      inner.appendChild(el("span", "q-badge " + p.difficulty, p.difficulty));
      var count = el("p"); count.style.color = "var(--ink-soft)"; count.style.fontSize = ".85rem"; count.style.margin = "0 0 4px";
      count.textContent = "Problem " + (idx + 1) + " of " + problems.length;
      inner.appendChild(count);
      var prompt = el("div", "q-prompt"); prompt.textContent = p.prompt; inner.appendChild(prompt); StudyMath.render(prompt);

      var ab = el("div", "answer-box");
      var input = document.createElement("input"); input.type = "text"; input.placeholder = "Your answer…"; input.id = "ans";
      ab.appendChild(input); inner.appendChild(ab);

      var tools = el("div", "q-tools");
      var hintBtn = ib("btn subtle", "bulb", "Hint");
      var tutBtn = ib("btn subtle", "bookOpen", "Tutorial");
      tutBtn.title = "Walk through a worked example like this one";
      var padBtn = ib("btn subtle", "edit", "Scratch work");
      var calcBtn = ib("btn subtle", "calculator", "Calculator");
      tools.append(hintBtn, tutBtn, padBtn, calcBtn); inner.appendChild(tools);
      tutBtn.onclick = function () { startTutorial(cls, lid, lesson, p.difficulty); };

      var hintPanel = el("div", "hint-panel"); hintPanel.hidden = true;
      hintPanel.appendChild(el("p", "panel-label", "Hint"));
      var ht = el("p", null, p.hint); hintPanel.appendChild(ht); inner.appendChild(hintPanel);

      var steps = el("div", "steps-panel"); steps.hidden = true;
      steps.appendChild(el("p", "panel-label", "Solution"));
      var ol = document.createElement("ol");
      (p.solution_steps || []).forEach(function (s) { ol.appendChild(el("li", null, s)); });
      steps.appendChild(ol);
      var fa = el("p", "final-answer"); fa.textContent = "Answer: " + p.correct_answer; steps.appendChild(fa);
      inner.appendChild(steps);

      hintBtn.onclick = function () { hintPanel.hidden = !hintPanel.hidden; StudyMath.render(hintPanel); };
      padBtn.onclick = function () { Notebook.openScratch({ classId: cls.id, lessonId: lid, lessonName: lesson.title, problemId: p.id, problemLabel: "Problem " + (idx + 1), prompt: p.prompt, hasSession: true }); };
      calcBtn.onclick = function () { Calculator.open(); };
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") nextBtn.click(); });

      state.checked = false; verdict.textContent = ""; verdict.className = "verdict"; nextBtn.textContent = "Check";
      input.focus();

      nextBtn.onclick = function () {
        if (!state.checked) {
          var val = input.value;
          var ok = isCorrect(val, p.correct_answer);
          state.checked = true; steps.hidden = false; StudyMath.render(steps);
          if (ok) {
            verdict.textContent = "Correct!"; verdict.className = "verdict right";
            recordTutorAttempt("correct");
            streak++; var xp = 10 + (p.difficulty === "hard" ? 5 : 0) + (p.difficulty === "stretch" ? 10 : 0);
            xpTotal += xp;
            Store.markProblemDone(cls.id, lid, p.id, xp);
            reward(xp, streak >= 3 ? "flame" : "check", streak >= 3 ? streak + " in a row!" : "Nice!");
          } else {
            verdict.textContent = "Not quite — check the solution."; verdict.className = "verdict wrong";
            recordTutorAttempt("wrong");
            streak = 0; xpTotal += 2;
            Store.markProblemDone(cls.id, lid, p.id, 2); // small XP for the attempt
          }
          setStreak(streak); setXp();
          nextBtn.textContent = idx + 1 >= problems.length ? "Finish" : "Next →";
        } else {
          idx++; render();
        }
      };
    }
    function finish() {
      fill.style.width = "100%";
      inner.innerHTML = "";
      var done = el("div"); done.style.textAlign = "center"; done.style.paddingTop = "40px";
      var tro = el("div"); tro.innerHTML = icon("award"); tro.style.color = "var(--accent)";
      var tsvg = tro.querySelector("svg"); if (tsvg) { tsvg.style.width = "3.5rem"; tsvg.style.height = "3.5rem"; }
      done.appendChild(tro);
      done.appendChild(el("h2", null, "Lesson complete!"));
      var p2 = Store.lessonProgress(cls.id, lid);
      done.appendChild(el("p", null, "Total XP for this lesson: " + p2.xp));
      var back = el("button", "btn primary lg", "Back to class"); back.style.marginTop = "16px";
      back.onclick = function () { session.remove(); renderClass(cls.id); };
      done.appendChild(back);
      inner.appendChild(done);
      verdict.textContent = ""; nextBtn.style.display = "none";
    }
    render();
  }

  // ---------- generative session: 2 easy / 2 medium / 2 hard / 1 extreme,
  //            stay on a slot (new numbers each try) until you get it right ----------
  function startGenSession(cls, lid, lesson, difficulty) {
    var single = difficulty && difficulty !== "mixed";
    var plan;
    if (single) {
      var n = difficulty === "extreme" ? 3 : 6; plan = [];
      for (var pi = 0; pi < n; pi++) plan.push([difficulty, difficulty === "extreme"]);
    } else {
      plan = [["easy", false], ["easy", false], ["medium", false], ["medium", false], ["hard", false], ["hard", false], ["extreme", true]];
    }
    // resume where you left off in the full (mixed) lesson; single-difficulty runs start fresh
    function saveSlot(s) { if (!single) Store.setGenSlot(cls.id, lid, s); }
    var slot = single ? 0 : (Store.getGenSlot(cls.id, lid) || 0); if (slot >= plan.length) slot = 0;
    var streak = 0, solved = slot, inst = null, checked = false, chosen = null, seen = {}, xpTotal = 0;

    var session = el("div", "session");
    var top = el("div", "session-top");
    var closeX = el("button", "close-x"); closeX.innerHTML = icon("x"); closeX.onclick = function () { session.remove(); renderClass(cls.id); };
    var track = el("div", "session-progress"); var fill = el("div", "fill"); track.appendChild(fill);
    var xpEl = el("div", "session-xp"); function setXp() { xpEl.textContent = xpTotal.toLocaleString() + " XP"; } setXp();
    var streakEl = el("div", "session-streak"); function setStreak(n) { streakEl.innerHTML = icon("flame") + "<span>" + n + "</span>"; } setStreak(0);
    top.append(closeX, track, xpEl, streakEl); session.appendChild(top);

    var body = el("div", "session-body"); var inner = el("div", "session-inner"); body.appendChild(inner); session.appendChild(body);
    var foot = el("div", "session-foot"); var footInner = el("div", "session-foot-inner");
    var verdict = el("div", "verdict"); var actionBtn = el("button", "btn primary lg", "Check"); var skipBtn = el("button", "btn subtle lg", "Skip");
    footInner.append(verdict, skipBtn, actionBtn); foot.appendChild(footInner); session.appendChild(foot);
    document.body.appendChild(session);

    function loadSlot() {
      if (slot >= plan.length) { saveSlot(plan.length); return finish(); }
      var diff = plan[slot][0];
      // don't repeat a question you've already been shown this session
      inst = null;
      for (var t = 0; t < 14; t++) { var cand = Generators.make(lid, diff); if (cand && !seen[cand.prompt]) { inst = cand; break; } inst = cand; }
      if (inst) seen[inst.prompt] = true;
      checked = false; chosen = null;
      renderInstance(plan[slot][1]);
    }

    function renderInstance(skippable) {
      setTutorContext({ page: "generated practice problem", class_id: cls.id, class_name: cls.name, lesson_id: lid, lesson_title: lesson.title, lesson_summary: lesson.summary, chapter: (cls.chapters && cls.chapters[lid]) || "", textbook: classTextbooks(cls), question_id: lid + ":slot-" + slot, question_prompt: inst.prompt, hint: inst.hint || "", difficulty: inst.difficulty || "", source: inst.source || "" });
      fill.style.width = Math.round(solved / plan.length * 100) + "%"; setStreak(streak);
      inner.innerHTML = "";
      var badgeRow = el("div", "q-badge-row");
      badgeRow.appendChild(el("span", "q-badge " + inst.difficulty, inst.difficulty));
      if (inst.source) badgeRow.appendChild(el("span", "q-source", inst.source));
      inner.appendChild(badgeRow);
      var count = el("p"); count.style.color = "var(--ink-soft)"; count.style.fontSize = ".85rem"; count.style.margin = "0 0 4px";
      count.textContent = "Question " + (slot + 1) + " of " + plan.length + (skippable ? " · bonus" : "");
      inner.appendChild(count);
      var prompt = el("div", "q-prompt"); prompt.textContent = inst.prompt; inner.appendChild(prompt); StudyMath.render(prompt);

      // answer area depends on type
      var inputs = [];
      if (inst.type === "numeric") { inputs.push(numericField(inner, inst)); }
      else if (inst.type === "mc") { renderChoices(inner, inst, function (i) { chosen = i; }); }
      else if (inst.type === "multi") { inst.parts.forEach(function (part, pi) { inputs.push(partField(inner, part, pi)); }); }

      // tools
      var tools = el("div", "q-tools");
      var hintBtn = ib("btn subtle", "bulb", "Hint");
      var tutBtn = ib("btn subtle", "bookOpen", "Tutorial");
      tutBtn.title = "Walk through a worked example like this one";
      var padBtn = ib("btn subtle", "edit", "Scratch work");
      var calcBtn = ib("btn subtle", "calculator", "Calculator");
      tools.append(hintBtn, tutBtn, padBtn, calcBtn); inner.appendChild(tools);
      tutBtn.onclick = function () { startTutorial(cls, lid, lesson, inst.difficulty); };
      var hintPanel = el("div", "hint-panel"); hintPanel.hidden = true;
      hintPanel.appendChild(el("p", "panel-label", "Hint")); var ht = el("p"); richText(ht, inst.hint, null); hintPanel.appendChild(ht); inner.appendChild(hintPanel);
      var steps = el("div", "steps-panel"); steps.hidden = true;
      steps.appendChild(el("p", "panel-label", "Solution")); var ol = document.createElement("ol");
      (inst.steps || []).forEach(function (s) { var li = el("li"); richText(li, s, null); ol.appendChild(li); });
      steps.appendChild(ol); inner.appendChild(steps);

      hintBtn.onclick = function () { hintPanel.hidden = !hintPanel.hidden; StudyMath.render(hintPanel); };
      padBtn.onclick = function () { Notebook.openScratch({ classId: cls.id, lessonId: lid, lessonName: lesson.title, problemId: "slot" + slot, problemLabel: "Question " + (slot + 1), prompt: inst.prompt, hasSession: true }); };
      calcBtn.onclick = function () { Calculator.open(); };
      // ONLINE: AI-enhanced practice — hints prioritized over answers; adjust on request.
      if (isOnline(cls)) {
        tutorPanel(inner, {
          context: { page: "online practice", question_prompt: inst.prompt, difficulty: inst.difficulty || "" },
          intro: "Practice with me — I lead with hints and adapt to you. Ask for harder, easier, or more detail.",
          quick: [
            { label: "Hint", prompt: "Give ONE hint for this problem, not the answer. Keep it to the syllabus/textbook method. Problem: " + inst.prompt },
            { label: "Explain in detail", prompt: "Explain how to approach this problem step by step (method, not the final number). Problem: " + inst.prompt },
            { label: "Make it harder", prompt: "Give me a harder variation of this problem to try, on the same topic. Problem: " + inst.prompt },
            { label: "Make it easier", prompt: "Give me an easier warm-up version of this problem. Problem: " + inst.prompt },
            { label: "Be straightforward", prompt: "Just explain this clearly and directly, then show the final answer. Problem: " + inst.prompt }
          ]
        });
      }

      verdict.textContent = ""; verdict.className = "verdict"; checked = false;
      actionBtn.textContent = "Check";
      skipBtn.style.display = skippable ? "" : "none";

      actionBtn.onclick = function () {
        if (!checked) {
          var ok = evaluate(inst, inputs);
          checked = true; steps.hidden = false; StudyMath.render(steps);
          if (ok) {
            verdict.textContent = "Correct!"; verdict.className = "verdict right";
            recordTutorAttempt("correct");
            streak++; var xp = { easy: 8, medium: 12, hard: 18, extreme: 30 }[inst.difficulty] || 10;
            xpTotal += xp;
            Store.markProblemDone(cls.id, lid, "slot" + slot + "-" + Date.now(), xp);
            reward(xp, streak >= 3 ? "flame" : "check", streak >= 3 ? streak + " in a row!" : "Nice!");
            actionBtn.textContent = "Next →"; skipBtn.style.display = "none";
          } else {
            verdict.textContent = "Not quite. Read the solution, then try a fresh one."; verdict.className = "verdict wrong";
            recordTutorAttempt("wrong");
            streak = 0; actionBtn.textContent = "Try another →";
          }
          setStreak(streak); setXp();
        } else {
          if (verdict.classList.contains("right")) { solved++; slot++; saveSlot(slot); loadSlot(); }
          else { loadSlot(); } // same difficulty, new numbers
        }
      };
      skipBtn.onclick = function () { slot++; saveSlot(slot); loadSlot(); };
    }

    function finish() {
      fill.style.width = "100%"; inner.innerHTML = "";
      var done = el("div"); done.style.textAlign = "center"; done.style.paddingTop = "40px";
      var tro = el("div"); tro.innerHTML = icon("award"); tro.style.color = "var(--accent)";
      var tsvg = tro.querySelector("svg"); if (tsvg) { tsvg.style.width = "3.5rem"; tsvg.style.height = "3.5rem"; }
      done.appendChild(tro);
      done.appendChild(el("h2", null, "Lesson complete!"));
      done.appendChild(el("p", null, "You solved " + solved + " questions. Total XP: " + Store.lessonProgress(cls.id, lid).xp));
      var back = el("button", "btn primary lg", "Back to class"); back.style.marginTop = "16px";
      back.onclick = function () { session.remove(); renderClass(cls.id); };
      done.appendChild(back); inner.appendChild(done);
      verdict.textContent = ""; actionBtn.style.display = "none"; skipBtn.style.display = "none";
    }

    loadSlot();
  }

  // ====================================================================
  // TUTORIAL MODE — a fully worked example with sample numbers, revealed
  // one step at a time so the student sees what each part means and why.
  // ====================================================================
  function tutorialAnswer(inst) {
    function one(o) {
      if (o.type === "mc") return o.choices ? o.choices[o.answerIndex] : "";
      var t = (o.answerText != null && o.answerText !== "") ? o.answerText : o.answerValue;
      return t + (o.unit ? (" " + o.unit) : "");
    }
    if (inst.type === "multi") {
      return (inst.parts || []).map(function (pt, i) { return String.fromCharCode(97 + i) + ") " + one(pt); }).join("    ");
    }
    return one(inst);
  }
  function tutorialInstance(lid, lesson, difficulty) {
    if (window.Generators && Generators.has(lid)) {
      var inst = Generators.make(lid, difficulty) || Generators.make(lid, "medium");
      if (!inst) return null;
      inst.answerText = tutorialAnswer(inst);
      return inst;
    }
    var want = difficulty === "extreme" ? "stretch" : difficulty;
    var probs = lesson.problems || [];
    var pool = probs.filter(function (p) { return p.difficulty === want; });
    if (!pool.length) pool = probs;
    if (!pool.length) return null;
    var p = pool[Math.floor(Math.random() * pool.length)];
    return { difficulty: p.difficulty, prompt: p.prompt, steps: p.solution_steps || [], answerText: p.correct_answer, hint: p.hint };
  }
  function startTutorial(cls, lid, lesson, difficulty) {
    var inst = tutorialInstance(lid, lesson, difficulty);
    if (!inst) { toast("No example available for this lesson yet."); return; }
    var body = "<h2>Tutorial · " + esc(lesson.title) + "</h2>" +
      "<p class='modal-sub'>A worked example with real sample numbers. We go one step at a time and explain what each piece means and why — then you'll be ready to try your own.</p>" +
      "<div id='tut-body'></div>";
    var m = modal(body + "<div class='modal-actions'><button class='btn ghost' id='tut-new'>New example</button><button class='btn primary' data-close>Done</button></div>", { wide: true });
    var host = m.querySelector("#tut-body");
    renderTutorial(host, inst, lesson);
    m.querySelector("#tut-new").onclick = function () {
      var ni = tutorialInstance(lid, lesson, difficulty); if (ni) renderTutorial(host, ni, lesson);
    };
  }
  function renderTutorial(host, inst, lesson) {
    var gloss = lesson.glossary || null;
    host.innerHTML = "";
    host.appendChild(el("span", "q-badge " + inst.difficulty, inst.difficulty));
    var qtag = el("div", "tut-block");
    qtag.appendChild(el("span", "tut-tag", "The question"));
    var qp = el("div", "q-prompt"); qp.textContent = inst.prompt; qtag.appendChild(qp);
    host.appendChild(qtag); StudyMath.render(qp);

    if (inst.hint) {
      var hb = el("div", "tut-hintline");
      hb.appendChild(el("span", "tut-tag", "Where to start"));
      var hp = el("p"); richText(hp, inst.hint, gloss); hb.appendChild(hp);
      host.appendChild(hb); StudyMath.render(hb);
    }

    var stepsWrap = el("div", "tut-steps"); host.appendChild(stepsWrap);
    var steps = inst.steps || [];
    var shown = 0, moreBtn = null, answered = false;
    function renderMore() {
      if (moreBtn) moreBtn.remove();
      moreBtn = el("button", "reveal-more", shown < steps.length ? ("Next step (" + (steps.length - shown) + " left) →") : "Show the answer →");
      moreBtn.onclick = advance; stepsWrap.appendChild(moreBtn);
    }
    function advance() {
      if (shown < steps.length) {
        var row = el("div", "tut-step");
        row.appendChild(el("span", "tut-step-n", "Step " + (shown + 1)));
        var pp = el("p"); richText(pp, steps[shown], gloss); row.appendChild(pp);
        stepsWrap.appendChild(row); StudyMath.render(row);
        shown++; renderMore();
      } else { revealAnswer(); }
    }
    function revealAnswer() {
      if (answered) return; answered = true;
      if (moreBtn) moreBtn.remove();
      var fa = el("div", "tut-answer");
      fa.appendChild(el("span", "tut-tag", "Answer"));
      var fp = el("p", "final-answer"); fp.textContent = inst.answerText; fa.appendChild(fp);
      stepsWrap.appendChild(fa); StudyMath.render(fa);
      var tip = el("p", "tut-tip", "The numbers change from problem to problem, but these steps stay the same. Try one yourself now.");
      stepsWrap.appendChild(tip);
    }
    if (steps.length) renderMore(); else revealAnswer();
  }

  // ---- generative-question field builders + checker ----
  function numericField(container, inst) {
    var ab = el("div", "answer-box");
    var input = document.createElement("input"); input.type = "text"; input.inputMode = "text";
    input.placeholder = "Your answer" + (inst.unit ? " (" + inst.unit + ")" : "") + "…";
    ab.appendChild(input);
    if (inst.unit) ab.appendChild(el("span", "answer-unit", inst.unit));
    container.appendChild(ab);
    setTimeout(function () { input.focus(); }, 30);
    return { kind: "numeric", el: input, spec: inst };
  }
  function partField(container, part, pi) {
    var wrap = el("div", "part-block");
    wrap.appendChild(el("p", "part-label", String.fromCharCode(97 + pi) + ") " + part.label));
    StudyMath.render(wrap);
    if (part.type === "mc") {
      var sel = { idx: null };
      renderChoices(wrap, part, function (i) { sel.idx = i; });
      container.appendChild(wrap); return { kind: "mc", sel: sel, spec: part };
    }
    var ab = el("div", "answer-box"); var input = document.createElement("input"); input.type = "text";
    input.placeholder = "Answer…"; ab.appendChild(input); wrap.appendChild(ab); container.appendChild(wrap);
    return { kind: "numeric", el: input, spec: part };
  }
  function renderChoices(container, spec, onpick) {
    var box = el("div", "choice-box"); var picked = { i: null }; var btns = [];
    (spec.choices || []).forEach(function (c, i) {
      var b = el("button", "choice"); var t = el("span"); richText(t, c, null); b.appendChild(t);
      b.onclick = function () { picked.i = i; onpick(i); btns.forEach(function (x) { x.classList.remove("sel"); }); b.classList.add("sel"); };
      btns.push(b); box.appendChild(b);
    });
    container.appendChild(box); spec._picked = picked;
    return picked;
  }
  function numMatch(user, value, tol) {
    var u = parseFloat(String(user).replace(/,/g, "").replace(/×10\^?/gi, "e").replace(/\s/g, ""));
    if (isNaN(u)) return false;
    if (value === 0) return Math.abs(u) < 1e-9;
    return Math.abs(u - value) / Math.abs(value) <= (tol || 0.03) + 1e-9;
  }
  function evaluate(inst, inputs) {
    if (inst.type === "mc") { return inst._picked && inst._picked.i === inst.answerIndex; }
    if (inst.type === "numeric") { return numMatch(inputs[0].el.value, inst.answerValue, inst.tol); }
    if (inst.type === "multi") {
      return inst.parts.every(function (part, i) {
        var f = inputs[i];
        if (part.type === "mc") return f.sel.idx === part.answerIndex;
        return numMatch(f.el.value, part.answerValue, part.tol);
      });
    }
    return false;
  }

  // ====================================================================
  // TEST MODE — practice exam (timer, N questions, per-question hint,
  //             all visible + verify one at a time, scoring, XP if perfect)
  // ====================================================================
  function testModeIntro(id) {
    modal(
      "<h2>Test mode</h2>" +
      "<div class='notice'><strong>How it works.</strong>Test mode drills you until your mistakes are cleared, then lets you take a timed practice exam. " +
      "In the full AI stage it will target your specific weak spots; for now it builds the exam from your lesson's problem bank.</div>" +
      "<p class='modal-sub'>Open a lesson below and choose <strong>Practice test</strong> to configure a timed exam.</p>" +
      "<div class='modal-actions'><button class='btn primary' data-close>Got it</button></div>"
    );
  }

  function startTest(cls, lid, lesson) {
    var allProblems = (lesson.problems || []).slice();
    var maxN = allProblems.length;
    var diffs = lessonDifficulties(lid, lesson);
    var pills = [{ v: "mixed", l: "Mixed" }].concat(diffs.map(function (d) { return { v: d, l: diffLabel(d) }; }));
    var pillHtml = pills.map(function (o, i) { return "<button type='button' class='lp-pill" + (i === 0 ? " on" : "") + "' data-v='" + o.v + "'>" + o.l + "</button>"; }).join("");
    var m = modal(
      "<h2>Practice exam — " + esc(lesson.title) + "</h2>" +
      "<p class='modal-sub'>Set your parameters. Each question has a hint. You'll see all questions but verify one at a time.</p>" +
      "<div class='row2'>" +
      "<div class='field'><label>Number of questions</label><input id='t-n' type='number' min='1' max='" + maxN + "' value='" + Math.min(10, maxN) + "'></div>" +
      "<div class='field'><label>Time limit (minutes)</label><input id='t-min' type='number' min='1' max='180' value='15'></div>" +
      "</div>" +
      "<div class='field'><label>Difficulty</label><div class='lp-diff' id='t-diff'>" + pillHtml + "</div></div>" +
      "<div class='modal-actions'><button class='btn subtle' data-close>Cancel</button><button class='btn primary' id='t-go'>Start exam</button></div>"
    );
    var chosen = "mixed";
    m.querySelectorAll("#t-diff .lp-pill").forEach(function (b) { b.onclick = function () { chosen = b.getAttribute("data-v"); m.querySelectorAll("#t-diff .lp-pill").forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
    m.querySelector("#t-go").onclick = function () {
      var pool = allProblems;
      if (chosen !== "mixed") { var want = chosen === "extreme" ? "stretch" : chosen; var filtered = allProblems.filter(function (p) { return p.difficulty === want; }); if (filtered.length) pool = filtered; }
      var n = Math.max(1, Math.min(pool.length, +m.querySelector("#t-n").value || 10));
      var mins = Math.max(1, +m.querySelector("#t-min").value || 15);
      closeModal();
      runExam(cls, lid, shuffle(pool).slice(0, n), mins);
    };
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function runExam(cls, lid, problems, minutes) {
    var session = el("div", "session");
    var top = el("div", "session-top");
    var closeX = el("button", "close-x"); closeX.innerHTML = icon("x"); closeX.onclick = function () { clearInterval(timer); session.remove(); renderClass(cls.id); };
    var title = el("div"); title.style.flex = "1"; title.style.fontWeight = "700"; title.textContent = "Practice exam · " + problems.length + " questions";
    var clock = el("div", "session-streak", minutes + ":00");
    top.append(closeX, title, clock); session.appendChild(top);

    var body = el("div", "session-body"); var inner = el("div", "session-inner"); inner.style.maxWidth = "760px";
    body.appendChild(inner); session.appendChild(body);

    var inputs = [];
    problems.forEach(function (p, i) {
      var card = el("div", "steps-panel"); card.hidden = false; card.style.marginBottom = "18px";
      card.appendChild(el("span", "q-badge " + p.difficulty, "Q" + (i + 1) + " · " + p.difficulty));
      var pr = el("div", "q-prompt"); pr.style.fontSize = "1.1rem"; pr.textContent = p.prompt; card.appendChild(pr);
      var ab = el("div", "answer-box"); var input = document.createElement("input"); input.type = "text"; input.placeholder = "Answer…";
      ab.appendChild(input); card.appendChild(ab); inputs.push({ input: input, p: p, card: card });
      var tools = el("div", "q-tools");
      var hintBtn = ib("btn subtle", "bulb", "Hint");
      var hp = el("p"); hp.hidden = true; hp.style.fontStyle = "italic"; hp.style.color = "var(--ink-soft)"; hp.textContent = p.hint;
      hintBtn.onclick = function () { hp.hidden = !hp.hidden; StudyMath.render(hp); };
      tools.appendChild(hintBtn); card.appendChild(tools); card.appendChild(hp);
      inner.appendChild(card); StudyMath.render(card);
    });

    var submit = el("button", "btn primary lg", "Submit exam"); submit.style.margin = "10px 0 60px";
    submit.onclick = grade; inner.appendChild(submit);
    document.body.appendChild(session);

    var remaining = minutes * 60;
    var timer = setInterval(function () {
      remaining--; var m = Math.floor(remaining / 60), s = remaining % 60;
      clock.textContent = m + ":" + (s < 10 ? "0" : "") + s;
      if (remaining <= 0) { clearInterval(timer); grade(); }
    }, 1000);

    function grade() {
      clearInterval(timer);
      var correct = 0, wrong = [];
      inputs.forEach(function (o) {
        var ok = isCorrect(o.input.value, o.p.correct_answer);
        o.card.style.borderColor = ok ? "var(--easy)" : "var(--hard)";
        o.card.style.borderWidth = "2px";
        if (ok) correct++; else wrong.push(o.p);
      });
      var perfect = correct === inputs.length;
      var xp = perfect ? 50 : correct * 5;
      if (perfect) reward(50, "award", "Perfect score!");

      var fb = "<h2>" + (perfect ? "Perfect!" : "Score: " + correct + " / " + inputs.length) + "</h2>";
      if (perfect) {
        fb += "<div class='notice'><strong>+50 XP</strong>You nailed every question. You're ready for the real thing.</div>";
      } else {
        fb += "<div class='notice'><strong>Review these before retrying.</strong>Test mode wants every mistake cleared before you're ready.</div>";
        fb += "<div id='fb-list'></div>";
      }
      fb += "<div class='modal-actions'><button class='btn subtle' data-close>Close</button><button class='btn primary' id='fb-retry'>Retry exam</button></div>";
      var m = modal(fb, { wide: true });
      var list = m.querySelector("#fb-list");
      if (list) wrong.forEach(function (p) {
        var c = el("div", "steps-panel"); c.hidden = false; c.style.marginBottom = "12px";
        var pr = el("div"); pr.style.fontWeight = "700"; pr.style.marginBottom = "6px"; pr.textContent = p.prompt; c.appendChild(pr);
        var ans = el("p", null, "Correct answer: " + p.correct_answer); c.appendChild(ans);
        var ol = document.createElement("ol"); (p.solution_steps || []).forEach(function (s) { ol.appendChild(el("li", null, s)); });
        c.appendChild(ol); list.appendChild(c); StudyMath.render(c);
      });
      m.querySelector("#fb-retry").onclick = function () { closeModal(); clearInterval(timer); session.remove(); startTest(cls, lid, { title: "Retry", problems: problems }); };
    }
  }

  // ====================================================================
  // UPLOADS + STUBBED AI MODES
  // ====================================================================
  function uploadDialog(id, kind) {
    var label = kind === "syllabus" ? "syllabus" : "textbook";
    var m = modal(
      "<h2>Upload " + label + "</h2>" +
      "<div class='notice'><strong>Static MVP.</strong>The file stays on your device (its name is remembered). Turning a " + label +
      " into generated lessons needs the AI + backend stage — not part of this static build.</div>" +
      "<div class='field'><label>Choose a file</label><input id='up-file' type='file' accept='.pdf,.doc,.docx,.txt,.png,.jpg'></div>" +
      "<div class='modal-actions'><button class='btn subtle' data-close>Cancel</button><button class='btn primary' id='up-save'>Save reference</button></div>"
    );
    m.querySelector("#up-save").onclick = function () {
      var f = m.querySelector("#up-file").files[0];
      if (f) { Store.setUpload(id, kind, f.name); toast(label + " noted ✓"); }
      closeModal(); renderClass(id);
    };
  }

  // City Tech MVP: materials are set by the professor's class, not the student.
  // Students only view the textbooks in use (and download any course files the
  // administrator attached). No uploading or editing.
  function materialsDialog(id) {
    var cls = Store.getClass(id) || {};
    var books = classTextbookList(cls);
    var privateFiles = (window.StudyMAFPrivateCourseDocuments || {})[id] || [];
    var booksHtml = books.length
      ? "<ul class='materials-books'>" + books.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>"
      : "<p class='modal-sub'>No textbook has been listed for this class yet.</p>";
    var filesHtml = privateFiles.length
      ? "<div class='field'><label>Course files</label><p class='modal-sub'>A download link is created only when you open a file.</p><div class='source-download-grid'>" + privateFiles.map(function (file) {
          return "<a class='source-download' href='" + esc(file.download_url || '#') + "' target='_blank' rel='noopener'><span class='source-kind'>" + esc(file.kind === 'syllabus' ? 'Syllabus' : 'Textbook') + "</span><strong>" + esc(file.original_name || 'Course PDF') + "</strong><b>Download PDF <span aria-hidden='true'>↓</span></b></a>";
        }).join("") + "</div></div>"
      : "";
    modal(
      "<h2>Course materials</h2>" +
      "<p class='modal-sub'>The textbooks your professor uses for this class.</p>" +
      "<div class='field'><label>Textbooks</label>" + booksHtml + "</div>" +
      filesHtml +
      "<div class='modal-actions'><button class='btn primary' data-close>Done</button></div>",
      { wide: !!privateFiles.length }
    );
  }

  function homeworkMode(id) {
    var m = modal(
      "<h2>Homework mode</h2>" +
      "<div class='notice'><strong>Study for a specific assignment.</strong>Upload a homework file and the AI stage will build " +
      "practice around exactly those question types. For now you can attach it and practice from your lesson bank.</div>" +
      "<div class='field'><label>Homework file</label><input id='hw-file' type='file' accept='.pdf,.doc,.docx,.txt,.png,.jpg'></div>" +
      "<div class='modal-actions'><button class='btn subtle' data-close>Cancel</button><button class='btn primary' id='hw-save'>Attach</button></div>"
    );
    m.querySelector("#hw-save").onclick = function () {
      var f = m.querySelector("#hw-file").files[0];
      if (f) { Store.setUpload(id, "homework", f.name); toast("Homework attached ✓"); }
      closeModal();
    };
  }

  function onlineTutorNotice() {
    var configured = TUTOR_URL && TUTOR_URL.indexOf("REPLACE_WITH") !== 0;
    modal(
      "<h2>Online tutor</h2>" +
      "<div class='notice'><strong>Agent Tutor.</strong>This links out to your external AI tutor (Custom GPT / Claude Project) that you preload with these lessons. " +
      (configured ? "" : "Paste your tutor URL into <code>TUTOR_URL</code> in <code>js/app.js</code> to enable the button.") + "</div>" +
      "<div class='modal-actions'><button class='btn subtle' data-close>Close</button>" +
      (configured ? "<a class='btn primary' href='" + esc(TUTOR_URL) + "' target='_blank' rel='noopener'>Open my tutor ↗</a>" : "<button class='btn primary' disabled>Open my tutor ↗</button>") +
      "</div>"
    );
  }

  // ====================================================================
  // ROUTER + BOOT
  // ====================================================================
  function route() {
    var hash = location.hash || "#/";
    var m = hash.match(/^#\/class\/([^?]+)(?:\?lesson=([^&]+))?$/);
    if (m) renderClass(m[1], m[2] ? decodeURIComponent(m[2]) : "");
    else if (hash === "#/notebook") renderNotebook();
    else if (hash === "#/professor") {
      if (AccountUI) AccountUI.renderProfessor(appEl);
      else renderDashboard();
    }
    else if (hash === "#/admin") {
      if (AccountUI) AccountUI.renderAdmin(appEl);
      else renderDashboard();
    }
    else renderDashboard();
  }

  function bindHeader() {
    var ai = document.getElementById("open-ai");
    ai.innerHTML = icon("chat") + "<span>Ask AI</span>";
    ai.onclick = openStudymafAI;
    document.getElementById("open-ai-fab").onclick = openStudymafAI;
    var c = document.getElementById("open-calc");
    c.innerHTML = icon("calculator") + "<span>Calculator</span>";
    c.onclick = function () { Calculator.open(); };
    var fs = document.getElementById("open-fs");
    fs.innerHTML = icon("fullscreen") + "<span>Full screen</span>";
    fs.onclick = toggleFullscreen;
    document.getElementById("open-accent").onclick = openAccentPicker;
  }

  // The OpenRouter key lives only in the Vercel function. This page sends lesson
  // context plus the student's question; it never receives or stores that key.
  function openLegacyStudymafAI() {
    var configuredGPT = TUTOR_URL && TUTOR_URL.indexOf("REPLACE_WITH") !== 0;
    var m = modal(
      "<h2>Ask StudyMAF AI</h2>" +
      "<p class='modal-sub'>Ask about the lesson you are studying. It gives short, clear help and starts with a hint.</p>" +
      "<div class='ai-chat-log' id='ai-log'><div class='ai-msg assistant'>What are you working on?</div></div>" +
      "<label class='field'><span>Your question</span><textarea id='ai-question' rows='3' placeholder='I do not understand why the electric field points away from a positive charge.'></textarea></label>" +
      "<p class='modal-sub ai-note'>Free test model. It can be unavailable or slower at busy times.</p>" +
      "<div class='modal-actions'><button class='btn subtle' data-close>Close</button>" +
      (configuredGPT ? "<a class='btn ghost' href='" + esc(TUTOR_URL) + "' target='_blank' rel='noopener'>Open my Custom GPT ↗</a>" : "") +
      "<button class='btn primary' id='ai-send'>Send</button></div>", { wide: true });
    var input = m.querySelector("#ai-question"), log = m.querySelector("#ai-log"), send = m.querySelector("#ai-send");
    function add(role, text) { var row = el("div", "ai-msg " + role); row.textContent = text; log.appendChild(row); log.scrollTop = log.scrollHeight; }
    function submit() {
      var question = input.value.trim(); if (!question) return;
      add("student", question); input.value = ""; send.disabled = true; send.textContent = "Thinking…";
      var hash = String(location.hash || ""), lessonId = (hash.match(/lesson=([^&/]+)/) || [])[1] || "";
      fetch(TUTOR_API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: question, lesson_id: lessonId, page: hash }) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Tutor unavailable."); return j; }); })
        .then(function (j) { add("assistant", j.answer || "I could not make an answer. Please try again."); })
        .catch(function (e) { add("assistant", "I could not reach the tutor right now. " + e.message); })
        .finally(function () { send.disabled = false; send.textContent = "Send"; input.focus(); });
    }
    send.onclick = submit;
    input.onkeydown = function (e) { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit(); };
    setTimeout(function () { input.focus(); }, 0);
  }

  // The floating tutor stays beside the work, rather than taking over the screen.
  function renderTutorText(bubble, text) {
    // Rho returns plain language plus $...$ / $$...$$ formulas. Setting textContent
    // first keeps model output safe; StudyMath then uses our vendored KaTeX renderer.
    bubble.textContent = text;
    StudyMath.render(bubble);
  }
  function parseRhoResponse(text) {
    var source = String(text || "").trim(), answer = source, steps = [], finalAnswer = "";
    var stepsAt = source.search(/(?:^|\n)STEPS:\s*/i), finalAt = source.search(/(?:^|\n)FINAL:\s*/i);
    if (stepsAt >= 0) answer = source.slice(0, stepsAt).replace(/^ANSWER:\s*/i, "").trim();
    else if (finalAt >= 0) answer = source.slice(0, finalAt).replace(/^ANSWER:\s*/i, "").trim();
    else answer = answer.replace(/^ANSWER:\s*/i, "").trim();
    if (stepsAt >= 0) {
      var end = finalAt > stepsAt ? finalAt : source.length;
      steps = source.slice(stepsAt, end).replace(/^\s*STEPS:\s*/i, "").split(/\n+/).map(function (line) { return line.replace(/^\s*(?:\d+[.)]|[-•])\s*/, "").trim(); }).filter(Boolean);
    }
    if (finalAt >= 0) finalAnswer = source.slice(finalAt).replace(/^\s*FINAL:\s*/i, "").trim();
    return { answer: answer, steps: steps.slice(0, 8), finalAnswer: finalAnswer };
  }
  function renderRhoResponse(bubble, text) {
    var parsed = parseRhoResponse(text), main = el("div", "tutor-answer-text"); renderTutorText(main, parsed.answer); bubble.appendChild(main);
    if (parsed.steps.length) {
      var details = document.createElement("details"); details.className = "tutor-steps";
      var summary = document.createElement("summary"); summary.textContent = "Show steps"; details.appendChild(summary);
      var list = document.createElement("ol"); parsed.steps.forEach(function (step) { var item = document.createElement("li"); renderTutorText(item, step); list.appendChild(item); }); details.appendChild(list); bubble.appendChild(details);
    }
    if (parsed.finalAnswer) { var finalBox = el("div", "tutor-final-answer"); finalBox.appendChild(el("span", "tutor-final-label", "Final answer")); var finalText = el("div"); renderTutorText(finalText, parsed.finalAnswer); finalBox.appendChild(finalText); bubble.appendChild(finalBox); }
  }
  function rhoSpeechText(text) {
    var parsed = parseRhoResponse(text), speech = parsed.answer;
    if (parsed.steps.length) speech += ". " + parsed.steps.join(". ");
    if (parsed.finalAnswer) speech += ". Final answer: " + parsed.finalAnswer;
    return speech.replace(/\$\$?/g, "").replace(/\s+/g, " ").trim();
  }
  function calculatorExpression(question) {
    var raw = String(question || "").trim().replace(/[?=]+$/, "");
    raw = raw.replace(/^(?:what\s+is|calculate|evaluate|compute|solve)\s+/i, "").trim();
    // Send only a standalone expression to the calculator, never a sentence.
    if (!raw || raw.length > 140 || !/^[0-9+\-*/^().,%\sπ\\a-zA-Z{}]+$/.test(raw)) return "";
    if (!/[0-9π]/.test(raw)) return "";
    var words = raw.match(/[a-zA-Z]+/g) || [];
    var allowed = /^(pi|sqrt|cbrt|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|ln|log|log2|log10|abs|floor|ceil|round|exp|e)$/i;
    return words.every(function (word) { return allowed.test(word); }) ? raw : "";
  }
  function calculatorReply(expression) {
    try {
      var calculation = Calculator.evaluate(expression);
      return "ANSWER: I used the StudyMAF calculator for this exact expression.\nSTEPS:\n1. Enter $" + calculation.expression + "$ into the calculator.\n2. Evaluate the expression.\nFINAL: $$" + calculation.expression + " = " + calculation.result + "$$";
    } catch (error) { return ""; }
  }
  function openTutorLesson(ctx) {
    if (!ctx.class_id || !ctx.lesson_id) return;
    location.hash = "#/class/" + encodeURIComponent(ctx.class_id) + "?lesson=" + encodeURIComponent(ctx.lesson_id);
  }
  function openTutorProblem(ctx) {
    if (!ctx.class_id || !ctx.lesson_id || !ctx.question_id || /:slot-/.test(ctx.question_id)) return openTutorLesson(ctx);
    var cls = Store.getClass(ctx.class_id); if (!cls) return;
    loadLesson(ctx.lesson_id).then(function (lesson) { startStaticSession(cls, ctx.lesson_id, lesson, "mixed", ctx.question_id); }).catch(function () { openTutorLesson(ctx); });
  }
  function tutorReferences(ctx) {
    var refs = el("div", "tutor-references");
    function chip(label, action) { var b = el("button", "tutor-reference", label); b.onclick = action; refs.appendChild(b); }
    if (ctx.lesson_id) chip("Lesson: " + (ctx.lesson_title || ctx.lesson_id), function () { openTutorLesson(ctx); });
    if (ctx.chapter) chip("Chapter: " + ctx.chapter, function () { openTutorLesson(ctx); });
    if (ctx.question_id) chip("Problem: " + ctx.question_id, function () { openTutorProblem(ctx); });
    return refs.childNodes.length ? refs : null;
  }
  function tutorAvatar() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "-32 -34 64 78"); svg.setAttribute("aria-hidden", "true");
    var group = document.createElementNS("http://www.w3.org/2000/svg", "g"); svg.appendChild(group);
    if (window.Figures && Figures.LIB && Figures.LIB.person) Figures.LIB.person(group, { color: "accent", hair: "up" });
    return svg;
  }
  function compressTutorImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return reject(new Error("Choose a PNG, JPG, WEBP, or GIF image."));
      if (file.size > 8 * 1024 * 1024) return reject(new Error("Choose an image smaller than 8 MB."));
      var reader = new FileReader(); reader.onerror = function () { reject(new Error("Could not read that image.")); };
      reader.onload = function () { var image = new Image(); image.onerror = function () { reject(new Error("Could not open that image.")); };
        image.onload = function () { var scale = Math.min(1, 1440 / Math.max(image.width, image.height)); var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL("image/jpeg", .82)); };
        image.src = String(reader.result); };
      reader.readAsDataURL(file);
    });
  }
  function buildTutorDock() {
    var dock = document.getElementById("ai-tutor-dock"), launcher = document.getElementById("open-ai-fab");
    if (window.__studymafTutor) return window.__studymafTutor;
    var state = { image: "", maximized: false, minimized: false, context: tutorContext, history: [], talkMode: false, listening: false, waiting: false, speaking: false, recognition: null, restartTimer: 0, speechQueue: [], speechPlaying: false, speechDone: null, voiceWarmAttempted: false };
    dock.innerHTML = "";
    var head = el("div", "tutor-head"), identity = el("div", "tutor-identity"), avatar = el("span", "tutor-avatar"); avatar.appendChild(tutorAvatar()); identity.appendChild(avatar);
    var copy = el("div"); copy.appendChild(el("strong", null, "Rho (ρ), your study tutor")); copy.appendChild(el("span", "tutor-context", "Ready to help")); identity.appendChild(copy);
    var controls = el("div", "tutor-controls"), min = el("button", "tutor-icon"), max = el("button", "tutor-icon"), close = el("button", "tutor-icon");
    min.innerHTML = icon("minus"); min.title = "Minimize"; max.innerHTML = icon("maximize"); max.title = "Maximize"; close.innerHTML = icon("x"); close.title = "Close";
    controls.append(min, max, close); head.append(identity, controls); dock.appendChild(head);
    var body = el("div", "tutor-body"), messages = el("div", "tutor-messages"), welcome = el("div", "tutor-message assistant");
    welcome.appendChild(tutorAvatar()); welcome.appendChild(el("div", "tutor-bubble", "Hi, I’m Rho. I know the lesson or problem you are on. What should we work through?")); messages.appendChild(welcome); body.appendChild(messages);
    var talkBar = el("div", "tutor-talkbar"), talk = el("button", "tutor-talk"), voiceStatus = el("span", "tutor-voice-status", "Start Talk for a hands-free conversation.");
    talk.type = "button"; talk.innerHTML = icon("mic") + "<span>Start Talk</span>"; talk.title = "Start a hands-free conversation with Rho"; talkBar.append(talk, voiceStatus); body.appendChild(talkBar);
    var preview = el("div", "tutor-photo-preview"); preview.hidden = true; body.appendChild(preview);
    var composer = el("div", "tutor-composer"), file = document.createElement("input"); file.type = "file"; file.accept = "image/png,image/jpeg,image/webp,image/gif"; file.hidden = true;
    var photo = el("button", "tutor-compose-action"), input = document.createElement("textarea"), voice = el("button", "tutor-compose-action"), send = el("button", "tutor-send");
    photo.innerHTML = icon("image"); photo.title = "Add a photo of your work"; input.className = "tutor-input"; input.rows = 1; input.placeholder = "Ask about this problem…";
    voice.innerHTML = icon("mic"); voice.title = "Speak your question"; send.innerHTML = icon("send"); send.title = "Send";
    composer.append(file, photo, input, voice, send); body.appendChild(composer); body.appendChild(el("p", "tutor-note", "Free tutor test. It may be slow when free models are busy."));
    if (TUTOR_URL && TUTOR_URL.indexOf("REPLACE_WITH") !== 0) { var premium = document.createElement("a"); premium.className = "tutor-premium-link"; premium.href = TUTOR_URL; premium.target = "_blank"; premium.rel = "noopener"; premium.textContent = "Open my Custom GPT ↗"; body.appendChild(premium); }
    dock.appendChild(body);
    function label(ctx) { return ctx.question_id ? "Problem " + ctx.question_id + (ctx.lesson_title ? " · " + ctx.lesson_title : "") : (ctx.lesson_title ? ctx.lesson_title + (ctx.chapter ? " · " + ctx.chapter : "") : "Ready to help"); }
    function setVoiceStatus(text) { voiceStatus.textContent = text; }
    function updateTalkButton() {
      talk.classList.toggle("on", state.talkMode);
      talk.classList.toggle("listening", state.listening);
      talk.innerHTML = icon("mic") + "<span>" + (state.talkMode ? (state.listening ? "Listening..." : "End Talk") : "Start Talk") + "</span>";
      talk.setAttribute("aria-pressed", String(state.talkMode));
    }
    function stopSpeech() {
      state.speechQueue = []; state.speechDone = null; state.speechPlaying = false;
      if (window.RhoVoice) window.RhoVoice.stop();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      state.speaking = false;
    }
    function fallbackSpeak(words, done) {
      if (!("speechSynthesis" in window) || !words) return done();
      var utterance = new SpeechSynthesisUtterance(words); utterance.rate = .98;
      utterance.onend = done; utterance.onerror = done;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
    }
    function speakSegment(words, done) {
      state.speaking = true; setVoiceStatus("Rho is speaking...");
      function complete() { state.speaking = false; if (!state.talkMode) setVoiceStatus("Ready to help"); if (done) done(); }
      if (window.RhoVoice) {
        window.RhoVoice.speak(words, { onStatus: setVoiceStatus }).then(complete).catch(function () {
          setVoiceStatus("Using your device voice for this reply."); fallbackSpeak(words, complete);
        });
      } else fallbackSpeak(words, complete);
    }
    function playQueuedSpeech() {
      if (state.speechPlaying) return;
      var next = state.speechQueue.shift();
      if (!next) { var onDone = state.speechDone; state.speechDone = null; if (onDone) onDone(); return; }
      state.speechPlaying = true;
      speakSegment(next, function () { state.speechPlaying = false; playQueuedSpeech(); });
    }
    function queueRhoSpeech(text) {
      var words = rhoSpeechText(text); if (!words) return;
      state.speechQueue.push(words); playQueuedSpeech();
    }
    function finishQueuedSpeech(done) { state.speechDone = done; playQueuedSpeech(); }
    function speakRho(text, done) {
      stopSpeech(); speakSegment(rhoSpeechText(text), done);
    }
    function add(role, text, imageData, references) {
      var row = el("div", "tutor-message " + role); if (role === "assistant") row.appendChild(tutorAvatar());
      var bubble = el("div", "tutor-bubble");
      if (role === "assistant") renderRhoResponse(bubble, text); else renderTutorText(bubble, text);
      row.appendChild(bubble);
      if (imageData) { var thumb = document.createElement("img"); thumb.className = "tutor-image-message"; thumb.src = imageData; thumb.alt = "Uploaded work"; row.appendChild(thumb); }
      if (role === "assistant" && references) { var related = tutorReferences(references); if (related) row.appendChild(related); }
      if (role === "assistant" && (window.RhoVoice || "speechSynthesis" in window)) { var speak = el("button", "tutor-speak"); speak.innerHTML = icon("volume"); speak.title = "Read this answer aloud"; speak.onclick = function () { speakRho(text); }; row.appendChild(speak); }
      messages.appendChild(row); messages.scrollTop = messages.scrollHeight;
    }
    function beginStreamingAnswer() {
      var row = el("div", "tutor-message assistant"), bubble = el("div", "tutor-bubble", "Rho is thinking...");
      row.appendChild(tutorAvatar()); row.appendChild(bubble); messages.appendChild(row); messages.scrollTop = messages.scrollHeight;
      return { row: row, bubble: bubble };
    }
    function finishStreamingAnswer(live, text, references) {
      live.bubble.innerHTML = ""; renderRhoResponse(live.bubble, text);
      if (references) { var related = tutorReferences(references); if (related) live.row.appendChild(related); }
      if (window.RhoVoice || "speechSynthesis" in window) { var speak = el("button", "tutor-speak"); speak.innerHTML = icon("volume"); speak.title = "Read this answer aloud"; speak.onclick = function () { speakRho(text); }; live.row.appendChild(speak); }
      messages.scrollTop = messages.scrollHeight;
    }
    function splitSpeech(buffer, final) {
      var pieces = [], match;
      while ((match = buffer.match(/^([\s\S]*?[.!?])(?:\s+|$)/))) { pieces.push(match[1]); buffer = buffer.slice(match[0].length); }
      if (final && buffer.trim()) { pieces.push(buffer); buffer = ""; }
      return { pieces: pieces, rest: buffer };
    }
    function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 118) + "px"; }
    function clearImage() { state.image = ""; preview.hidden = true; preview.innerHTML = ""; file.value = ""; }
    function showImage(data) { state.image = data; preview.hidden = false; preview.innerHTML = ""; var img = document.createElement("img"); img.src = data; img.alt = "Photo ready to send"; var remove = el("button", "tutor-photo-remove", "Remove photo"); remove.onclick = clearImage; preview.append(img, remove); }
    function remember(role, content) {
      state.history.push({ role: role, content: String(content || "").slice(0, 650) });
      if (state.history.length > 6) state.history = state.history.slice(-6);
    }
    function resumeTalk() {
      if (!state.talkMode || state.waiting || state.speaking) return;
      window.clearTimeout(state.restartTimer);
      state.restartTimer = window.setTimeout(function () { startListening(true); }, 350);
    }
    function completeAnswer(question, answer) {
      remember("user", question); remember("assistant", answer); add("assistant", answer, "", state.context);
      state.waiting = false; send.disabled = false; send.classList.remove("thinking");
      if (state.talkMode) speakRho(answer, resumeTalk); else { setVoiceStatus("Ready to help"); input.focus(); }
    }
    function streamAnswer(question, sentImage, history) {
      var live = beginStreamingAnswer(), answer = "", speechBuffer = "", started = false;
      fetch(TUTOR_API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: question, context: state.context, image_data: sentImage, history: history, stream: true }) })
        .then(function (response) {
          if (!response.ok) return response.json().then(function (body) { throw new Error(body.error || "Tutor unavailable."); });
          if (!response.body) throw new Error("Streaming is not supported in this browser.");
          var reader = response.body.getReader(), decoder = new TextDecoder(), buffer = "";
          function read() {
            return reader.read().then(function (part) {
              if (part.done) return;
              buffer += decoder.decode(part.value, { stream: true }).replace(/\r/g, "");
              var frames = buffer.split("\n\n"); buffer = frames.pop();
              frames.forEach(function (frame) {
                var event = (frame.match(/^event:\s*(.+)$/m) || [])[1], raw = (frame.match(/^data:\s*(.+)$/m) || [])[1];
                if (!raw || event === "done") return;
                try {
                  var data = JSON.parse(raw); if (event !== "delta" || !data.text) return;
                  answer += data.text; live.bubble.textContent = answer.replace(/^ANSWER:\s*/i, ""); messages.scrollTop = messages.scrollHeight;
                  if (!started) { started = true; setVoiceStatus("Rho is writing an answer..."); }
                  if (state.talkMode) { speechBuffer += data.text; var split = splitSpeech(speechBuffer, false); speechBuffer = split.rest; split.pieces.forEach(queueRhoSpeech); }
                } catch (error) {}
              });
              return read();
            });
          }
          return read();
        })
        .then(function () {
          if (!answer.trim()) throw new Error("The tutor did not return an answer.");
          if (state.talkMode) { var split = splitSpeech(speechBuffer, true); split.pieces.forEach(queueRhoSpeech); }
          remember("user", question); remember("assistant", answer); finishStreamingAnswer(live, answer, state.context);
          state.waiting = false; send.disabled = false; send.classList.remove("thinking");
          if (state.talkMode) finishQueuedSpeech(resumeTalk); else { setVoiceStatus("Ready to help"); input.focus(); }
        })
        .catch(function (error) {
          var message = "I could not reach the tutor right now. " + error.message;
          finishStreamingAnswer(live, message, state.context); remember("user", question); remember("assistant", message);
          state.waiting = false; send.disabled = false; send.classList.remove("thinking");
          if (state.talkMode) { queueRhoSpeech(message); finishQueuedSpeech(resumeTalk); } else { setVoiceStatus("Ready to help"); input.focus(); }
        });
    }
    function submit() {
      var question = input.value.trim(); if (!question && !state.image) return; if (!question) question = "Please look at this photo and help me with the problem.";
      var sentImage = state.image, history = state.history.slice(-4); add("student", question, sentImage); input.value = ""; autosize(); clearImage(); state.waiting = true; send.disabled = true; send.classList.add("thinking"); setVoiceStatus("Rho is thinking...");
      var expression = sentImage ? "" : calculatorExpression(question), calculated = expression ? calculatorReply(expression) : "";
      if (calculated) { completeAnswer(question, calculated); return; }
      streamAnswer(question, sentImage, history);
    }
    function stopListening() {
      window.clearTimeout(state.restartTimer); state.listening = false;
      if (state.recognition) { try { state.recognition.abort(); } catch (e) {} }
      state.recognition = null; updateTalkButton();
    }
    function endTalk() {
      state.talkMode = false; stopListening(); stopSpeech(); updateTalkButton(); setVoiceStatus("Talk ended. You can keep typing or start Talk again.");
    }
    function startListening(talkSession) {
      var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        setVoiceStatus("Voice input is not available in this browser.");
        if (talkSession) { state.talkMode = false; updateTalkButton(); }
        return;
      }
      if (state.listening || state.waiting || state.speaking) return;
      var recognition = new Recognition(), gotFinal = false;
      state.recognition = recognition; state.listening = true; updateTalkButton(); setVoiceStatus("Listening... say your question when you are ready.");
      recognition.lang = navigator.language || "en-US"; recognition.interimResults = true; recognition.continuous = false;
      recognition.onresult = function (event) {
        var words = "";
        for (var i = event.resultIndex; i < event.results.length; i++) { words += event.results[i][0].transcript; if (event.results[i].isFinal) gotFinal = true; }
        input.value = words.trim(); autosize();
        if (gotFinal && input.value.trim()) {
          state.listening = false; updateTalkButton();
          if (talkSession) { state.waiting = true; try { recognition.stop(); } catch (e) {} submit(); }
        }
      };
      recognition.onerror = function (event) {
        state.listening = false; updateTalkButton();
        if (event.error === "not-allowed" || event.error === "service-not-allowed") { state.talkMode = false; updateTalkButton(); setVoiceStatus("Microphone permission is needed for Talk."); return; }
        if (!talkSession) setVoiceStatus("I could not hear that. Please try again or type your question.");
      };
      recognition.onend = function () {
        state.listening = false; state.recognition = null; updateTalkButton();
        if (talkSession && state.talkMode && !state.waiting && !state.speaking && !gotFinal) resumeTalk();
      };
      try { recognition.start(); } catch (e) { state.listening = false; updateTalkButton(); }
    }
    talk.onclick = function () {
      if (state.talkMode) { endTalk(); return; }
      state.talkMode = true; updateTalkButton();
      if (window.RhoVoice) window.RhoVoice.prepare(setVoiceStatus).then(function () { if (state.talkMode) { setVoiceStatus("Rho's voice is ready. Start speaking."); startListening(true); } }).catch(function () { if (state.talkMode) { setVoiceStatus("Open-source voice could not load. Your device voice will be used instead."); startListening(true); } });
      else startListening(true);
    };
    photo.onclick = function () { file.click(); };
    file.onchange = function () { var chosen = file.files && file.files[0]; if (chosen) compressTutorImage(chosen).then(showImage).catch(function (error) { add("assistant", error.message); }); };
    input.oninput = autosize; input.onkeydown = function (event) { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }; send.onclick = submit;
    voice.onclick = function () { startListening(false); };
    min.onclick = function () { state.minimized = !state.minimized; dock.classList.toggle("min", state.minimized); min.innerHTML = icon(state.minimized ? "maximize" : "minus"); };
    max.onclick = function () { state.maximized = !state.maximized; dock.classList.toggle("max", state.maximized); if (state.maximized) dock.style.left = ""; };
    close.onclick = function () { endTalk(); dock.hidden = true; dock.setAttribute("aria-hidden", "true"); launcher.hidden = false; };
    launcher.innerHTML = icon("chat") + "<span>Ask Rho</span>";
    head.addEventListener("pointerdown", function (event) { if (event.target.closest("button, a")) return; var box = dock.getBoundingClientRect(), sx = event.clientX, sy = event.clientY, left = box.left, top = box.top; dock.classList.add("dragging"); dock.setPointerCapture(event.pointerId);
      function move(e) { dock.style.left = Math.max(8, Math.min(window.innerWidth - dock.offsetWidth - 8, left + e.clientX - sx)) + "px"; dock.style.top = Math.max(8, Math.min(window.innerHeight - dock.offsetHeight - 8, top + e.clientY - sy)) + "px"; dock.style.right = "auto"; dock.style.bottom = "auto"; }
      function up() { dock.classList.remove("dragging"); dock.removeEventListener("pointermove", move); dock.removeEventListener("pointerup", up); } dock.addEventListener("pointermove", move); dock.addEventListener("pointerup", up); });
    function warmVoice() {
      if (state.voiceWarmAttempted || !window.RhoVoice) return;
      state.voiceWarmAttempted = true; setVoiceStatus("Preparing Rho's voice in the background...");
      window.RhoVoice.prepare(setVoiceStatus).then(function () { if (!state.talkMode && !state.waiting) setVoiceStatus("Rho's voice is ready."); }).catch(function () { if (!state.talkMode) setVoiceStatus("Your device voice will be used if needed."); });
    }
    return window.__studymafTutor = { open: function () { dock.hidden = false; dock.setAttribute("aria-hidden", "false"); launcher.hidden = true; warmVoice(); requestAnimationFrame(function () { input.focus(); }); }, updateContext: function (ctx) { var oldKey = state.context.lesson_id + ":" + state.context.question_id, newKey = ctx.lesson_id + ":" + ctx.question_id; state.context = ctx; if (oldKey !== newKey) state.history = []; copy.querySelector(".tutor-context").textContent = label(ctx); } };
  }
  function openStudymafAI() { buildTutorDock().open(); }

  // In-app immersive mode. iOS Safari has no reliable element fullscreen, and the
  // browser chrome comes back on scroll — so we hide our own header/footer and fill
  // the screen. It NEVER exits on scroll; only the floating top-right button exits.
  var fsExitBtn = null, fsHideTimer = null;
  function toggleFullscreen() {
    if (document.body.classList.contains("immersive")) exitImmersive(); else enterImmersive();
  }
  function enterImmersive() {
    document.body.classList.add("immersive");
    var d = document.documentElement; if (d.requestFullscreen) d.requestFullscreen().catch(function () {}); // desktop bonus
    ensureExitBtn();
    flashExitBtn();                       // show briefly on enter so exit is discoverable
    window.addEventListener("scroll", onImmersiveScroll, { passive: true });
    document.addEventListener("scroll", onImmersiveScroll, { passive: true, capture: true }); // inner scrollers too
  }
  function exitImmersive() {
    document.body.classList.remove("immersive");
    if (fsExitBtn) fsExitBtn.classList.remove("visible");
    window.removeEventListener("scroll", onImmersiveScroll, { passive: true });
    document.removeEventListener("scroll", onImmersiveScroll, { passive: true, capture: true });
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
  }
  function ensureExitBtn() {
    if (fsExitBtn) return;
    fsExitBtn = el("button", "fs-exit"); fsExitBtn.innerHTML = icon("collapse"); fsExitBtn.title = "Exit full screen"; fsExitBtn.setAttribute("aria-label", "Exit full screen");
    fsExitBtn.onclick = exitImmersive; document.body.appendChild(fsExitBtn);
  }
  function onImmersiveScroll() { if (fsExitBtn) { fsExitBtn.classList.add("visible"); clearTimeout(fsHideTimer); } }
  function flashExitBtn() {
    if (!fsExitBtn) return; fsExitBtn.classList.add("visible");
    clearTimeout(fsHideTimer); fsHideTimer = setTimeout(function () { fsExitBtn.classList.remove("visible"); }, 3500);
  }
  function openAccentPicker() {
    var presets = ["#EF8354", "#e64980", "#7048e8", "#1971c2", "#0ca678", "#f59f00", "#e03131", "#4F5D75"];
    var cur = Store.getAccent();
    var sw = presets.map(function (c) { return "<button class='swatch' style='background:" + c + "' data-c='" + c + "' aria-pressed='" + (c.toLowerCase() === cur.toLowerCase()) + "'></button>"; }).join("");
    var m = modal(
      "<h2>Accent color</h2><p class='modal-sub'>Make math yours. This tints buttons, graphs, and highlights.</p>" +
      "<div class='swatches'>" + sw + "</div>" +
      "<div class='custom-accent'><label style='font-weight:600'>Custom</label><input type='color' id='ac-color' value='" + cur + "'></div>" +
      "<div class='modal-actions'><button class='btn primary' data-close>Done</button></div>"
    );
    m.querySelectorAll(".swatch").forEach(function (b) {
      b.onclick = function () {
        var c = b.getAttribute("data-c"); Store.setAccent(c); applyAccent(c);
        m.querySelectorAll(".swatch").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true"); m.querySelector("#ac-color").value = c;
        refreshCurrentView();
      };
    });
    m.querySelector("#ac-color").oninput = function (e) { Store.setAccent(e.target.value); applyAccent(e.target.value); refreshCurrentView(); };
  }
  function refreshCurrentView() { if (!document.querySelector(".session")) route(); }

  function seedIfEmpty() {
    // One-time migration: make sure the PHYS 1442 class (from the uploaded syllabus)
    // exists, even for users who already had the earlier demo seed. Runs once.
    if (Store.flag("phys1442-seed")) return;
    Store.setFlag("phys1442-seed");

    // Remove the old auto-seeded "Algebra I" demo (only if untouched).
    Store.classes().slice().forEach(function (c) {
      if (c.name === "Algebra I" && (c.lessonIds || []).join() === "sample") Store.removeClass(c.id);
    });

    var already = Store.classes().some(function (c) { return c.name.indexOf("PHYS 1442") === 0; });
    var cat = catalogClassByCode("PHYS1442");
    var physIds = lessonIndex.filter(function (l) { return l.id.indexOf("phys1442") === 0; }).map(function (l) { return l.id; });
    if (!already && (cat || physIds.length)) {
      var meta = cat ? catalogMeta(cat) : { lessonIds: physIds, lessonTargets: {}, chapters: {} };
      var c = Store.addClass({ name: (cat && cat.name) || "PHYS 1442 — General Physics II", semester: "Fall", year: String(new Date().getFullYear()), lessonIds: meta.lessonIds, code: cat ? cat.code : "", lessonTargets: meta.lessonTargets, chapters: meta.chapters });
      Store.setUpload(c.id, "syllabus", "PHYS1442.pdf");
      ((cat && cat.textbooks) || ["University Physics Volume 2, OpenStax", "University Physics Volume 3, OpenStax"]).forEach(function (t) { Store.addTextbook(c.id, "name", t); });
    }
  }

  // Keep the PHYS class in sync with all authored phys lessons (so lessons added
  // to the index show up in the already-seeded class), preserving order.
  function reconcilePhysLessons() {
    var order = lessonIndex.filter(function (l) { return l.id.indexOf("phys1442") === 0; }).map(function (l) { return l.id; });
    if (!order.length) return;
    var cat = catalogClassByCode("PHYS1442"), meta = cat ? catalogMeta(cat) : null;
    Store.classes().forEach(function (c) {
      if (c.name.indexOf("PHYS 1442") !== 0) return;
      var have = c.lessonIds || [];
      var missing = order.some(function (id) { return have.indexOf(id) < 0; });
      if (missing || have.length !== order.length) Store.setClassLessons(c.id, order);
      // backfill catalog metadata (grade targets, chapters, code) for pre-existing installs
      if (meta && (!c.lessonTargets || !Object.keys(c.lessonTargets).length)) {
        Store.setClassCatalog(c.id, { code: cat.code, lessonTargets: meta.lessonTargets, chapters: meta.chapters });
      }
    });
  }

  // Server-enrolled classes (added by a professor) arrive with only catalog metadata —
  // the DB course row carries no inline lessons. Resolve their lessons, grade targets,
  // and chapters from the static catalog by course code so they are fully studyable.
  function reconcileEnrolledClasses() {
    Store.classes().forEach(function (c) {
      if (!c.serverSectionId) return;                 // server-synced classes only
      if (c.lessonIds && c.lessonIds.length) return;  // already resolved
      var cat = catalogClassByCode(c.code);
      if (!cat) return;
      var meta = catalogMeta(cat);
      if (meta.lessonIds && meta.lessonIds.length) Store.setClassLessons(c.id, meta.lessonIds);
      Store.setClassCatalog(c.id, { code: cat.code, lessonTargets: meta.lessonTargets, chapters: meta.chapters });
    });
  }

  function applyIpadMode() { document.body.classList.toggle("ipad-mode", Store.getIpadMode()); }

  function init() {
    appEl = document.getElementById("app");
    applyAccent(Store.getAccent());
    applyIpadMode();
    bindHeader();
    // Accounts are isolated in a small ES module so the static app can still
    // load even if an auth provider is temporarily unavailable.
    import("./account-ui.js?v=18").then(function (mod) {
      AccountUI = mod.createAccountUI({ modal: modal, closeModal: closeModal, reroute: route });
      AccountUI.mountHeader();
      return AccountUI.ready();
    }).then(function () {
      return import("./progress-sync.js?v=6");
    }).then(function (mod) {
      mod.startProgressSync();
    }).then(function () {
      if (location.hash === "#/admin" || location.hash === "#/professor") route();
    }).catch(function () { /* Sign-in is optional until it is configured. */ });
    Promise.all([
      fetchJSON("data/index.json"),
      fetchJSON("data/classes.json").catch(function () { return { classes: [] }; })
    ]).then(function (res) {
      lessonIndex = (res[0].lessons || []);
      catalog = res[1] || { classes: [] };
      // learn problem counts for progress math
      return Promise.all(lessonIndex.map(function (l) {
        return loadLesson(l.id).then(function (js) { l.problemCount = (js.problems || []).length; }).catch(function () { l.problemCount = 20; });
      }));
    }).then(function () {
      seedIfEmpty();
      reconcilePhysLessons();
      reconcileEnrolledClasses();
      window.addEventListener("studymaf-account-ready", function () { reconcilePhysLessons(); reconcileEnrolledClasses(); route(); });
      window.addEventListener("hashchange", route);
      route();
    }).catch(function (e) {
      appEl.innerHTML = "<div class='page wrap'><div class='notice'><strong>Couldn't load data/index.json</strong>" + esc(e.message) +
        ". If you opened the file directly, serve it over http instead.</div></div>";
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  // public
  return { toast: toast, modal: modal, reward: reward, closeModal: closeModal, rerender: route };
})();
