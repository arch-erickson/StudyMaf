/* StudyMAF — app shell: routing, dashboard, class page, sequential study session,
 * test/homework modes, accent theming, uploads. Content comes from /data JSON.
 *
 * AI-dependent features (tutor, syllabus/homework -> generated lessons) are
 * scaffolded with clear "next stage" notices: this MVP is static, no backend/keys.
 */
window.App = (function () {
  "use strict";

  var appEl, lessonIndex = [], lessonCache = {}, catalog = { classes: [] };
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
  var TUTOR_URL = "REPLACE_WITH_YOUR_TUTOR_URL"; // <-- paste your Custom GPT / Claude Project URL
  var TUTOR_API_URL = "https://studymaf-tutor.vercel.app/api/tutor/chat";
  // This is updated as a student moves through StudyMAF. The API receives the
  // exact lesson/problem text; the tutor does not have to guess from the URL.
  var tutorContext = { page: "dashboard", lesson_id: "", lesson_title: "", chapter: "", textbook: "", question_id: "", question_prompt: "", hint: "" };
  function tutorLearnerId() {
    var key = "studymaf-tutor-learner", id = localStorage.getItem(key);
    if (!id) { id = "learner-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); localStorage.setItem(key, id); }
    return id;
  }
  function setTutorContext(next) {
    tutorContext = Object.assign({ page: String(location.hash || "#/"), learner_id: tutorLearnerId(), lesson_id: "", lesson_title: "", chapter: "", textbook: "", question_id: "", question_prompt: "", hint: "" }, next || {});
    if (window.__studymafTutor && window.__studymafTutor.updateContext) window.__studymafTutor.updateContext(tutorContext);
  }
  function classTextbooks(cls) {
    var books = (Store.getUploads(cls.id).textbooks || []).map(function (b) { return b.value; });
    return books.join("; ");
  }
  function recordTutorAttempt(outcome) {
    if (!tutorContext.lesson_id || !tutorContext.question_id) return;
    fetch(TUTOR_API_URL.replace(/\/chat$/, "/track"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ context: tutorContext, outcome: outcome }) }).catch(function () {});
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
    var addBtn = el("button", "btn primary", "+ Add class"); addBtn.onclick = openJoinClass;
    head.appendChild(addBtn);
    page.appendChild(head);

    var grid = el("div", "class-grid");

    Store.classes().forEach(function (c) {
      var card = el("button", "class-card");
      var thumb = el("div", "class-thumb"); thumb.setAttribute("style", thumbStyle(c.thumbSeed));
      var badge = el("span", "thumb-badge", (c.lessonIds.length) + " lesson" + (c.lessonIds.length === 1 ? "" : "s"));
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

    var add = el("button", "add-card");
    add.appendChild(el("span", "plus", "+")); add.appendChild(el("span", null, "Enter a class code"));
    add.onclick = openJoinClass;
    grid.appendChild(add);

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
    var crumbs = el("div", "crumbs"); crumbs.innerHTML = "<a href='#/'>← All classes</a>"; page.appendChild(crumbs);
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
  function renderClass(id) {
    var cls = Store.getClass(id);
    if (!cls) { location.hash = "#/"; return; }
    setTutorContext({ page: "class", class_name: cls.name, textbook: classTextbooks(cls) });
    appEl.innerHTML = "";
    var page = el("div", "page wrap");

    var crumbs = el("div", "crumbs"); crumbs.innerHTML = "<a href='#/'>← All classes</a>"; page.appendChild(crumbs);

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
    inp.onchange = function () { Store.setOnline(id, inp.checked); if (inp.checked) onlineTutorNotice(); };
    tb.appendChild(sw);
    page.appendChild(tb);

    var upl = Store.getUploads(id);
    if (upl.syllabus || (upl.textbooks && upl.textbooks.length)) {
      var books = (upl.textbooks || []).map(function (b) { return esc(b.value) + (b.kind === "cover" ? " (cover)" : ""); }).join(", ");
      var info = el("div", "notice");
      info.innerHTML = "<strong>Course materials</strong>" +
        (upl.syllabus ? "Syllabus: " + esc(upl.syllabus) + ". " : "") +
        (books ? "Textbooks: " + books + ". " : "") +
        "Auto-generating lessons from these needs the AI stage — for now lessons come from your data files.";
      page.appendChild(info);
    }

    // lessons
    page.appendChild(el("h2", "step-block", "Lessons"));
    var list = el("div", "lesson-list");
    if (!cls.lessonIds.length) list.appendChild(el("p", "empty-hint", "No lessons yet. Add lessons via data/index.json (or upload a syllabus in a later stage)."));
    cls.lessonIds.forEach(function (lid, i) {
      list.appendChild(buildLessonRow(cls, lid, i));
    });
    page.appendChild(list);
    appEl.appendChild(page);
  }

  function buildLessonRow(cls, lid, i) {
    var entry = lessonIndex.filter(function (l) { return l.id === lid; })[0] || { title: lid, problemCount: 20 };
    var prog = Store.lessonProgress(cls.id, lid);
    var target = lessonTargetsFor(cls)[lid] || entry.problemCount || 0;
    var grade = Store.lessonGrade(cls.id, lid, target);
    var chapter = (cls.chapters && cls.chapters[lid]) || "";

    var row = el("div", "lesson"); row.setAttribute("aria-expanded", "false");
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
          setTutorContext({ page: "lesson", class_name: cls.name, lesson_id: lid, lesson_title: lesson.title, lesson_summary: lesson.summary, chapter: chapter, textbook: classTextbooks(cls) });
          panel.innerHTML = "";
          var sum = el("p", "lp-summary", lesson.summary); panel.appendChild(sum); StudyMath.render(sum);
          // difficulty chooser — pick the level of problems you want to practice
          var diffs = lessonDifficulties(lid, lesson);
          var chosenDiff = "mixed";
          var diffRow = el("div", "lp-diff");
          diffRow.appendChild(el("span", "lp-diff-label", "Difficulty"));
          var pills = [];
          function setDiff(v) { chosenDiff = v; pills.forEach(function (p) { p.classList.toggle("on", p.getAttribute("data-v") === v); }); }
          [{ v: "mixed", l: "Mixed" }].concat(diffs.map(function (d) { return { v: d, l: diffLabel(d) }; })).forEach(function (o) {
            var pill = el("button", "lp-pill", o.l); pill.setAttribute("data-v", o.v);
            pill.onclick = function () { setDiff(o.v); }; pills.push(pill); diffRow.appendChild(pill);
          });
          setDiff("mixed");
          panel.appendChild(diffRow);

          var acts = el("div", "lp-actions");
          var startLbl = grade.solved > 0 && grade.solved < grade.target ? "Continue" : (grade.target && grade.solved >= grade.target ? "Practice again" : "Start lesson");
          var start = ib("btn primary", "play", startLbl);
          start.onclick = function () { startSession(cls, lid, lesson, chosenDiff); };
          var concepts = ib("btn ghost", "bookOpen", "Read concepts");
          concepts.onclick = function () { conceptReader(lesson); };
          var test = ib("btn ghost", "target", "Practice test");
          test.onclick = function () { startTest(cls, lid, lesson); };
          acts.append(start, concepts, test);
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
  // STUDY SESSION — one problem at a time, Duolingo-style rewards
  // ====================================================================
  // Dispatcher: use the generation engine when the lesson has generators,
  // otherwise fall back to the lesson's static problems.
  function startSession(cls, lid, lesson, difficulty) {
    if (window.Generators && Generators.has(lid)) return startGenSession(cls, lid, lesson, difficulty);
    return startStaticSession(cls, lid, lesson, difficulty);
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

  function startStaticSession(cls, lid, lesson, difficulty) {
    var problems = lesson.problems || [];
    if (difficulty && difficulty !== "mixed") {
      var want = difficulty === "extreme" ? "stretch" : difficulty;
      var filtered = problems.filter(function (p) { return p.difficulty === want; });
      if (filtered.length) problems = filtered;
    }
    var idx = 0, streak = 0;
    var prog = Store.lessonProgress(cls.id, lid);
    // resume at first not-done
    for (var k = 0; k < problems.length; k++) { if (!prog.done[problems[k].id]) { idx = k; break; } }

    var session = el("div", "session");
    var top = el("div", "session-top");
    var closeX = el("button", "close-x"); closeX.innerHTML = icon("x"); closeX.onclick = function () { session.remove(); renderClass(cls.id); };
    var track = el("div", "session-progress"); var fill = el("div", "fill"); track.appendChild(fill);
    var streakEl = el("div", "session-streak"); function setStreak(n) { streakEl.innerHTML = icon("flame") + "<span>" + n + "</span>"; } setStreak(0);
    top.append(closeX, track, streakEl); session.appendChild(top);

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
      setTutorContext({ page: "practice problem", class_name: cls.name, lesson_id: lid, lesson_title: lesson.title, lesson_summary: lesson.summary, chapter: (cls.chapters && cls.chapters[lid]) || "", textbook: classTextbooks(cls), question_id: p.id, question_prompt: p.prompt, hint: p.hint || "", difficulty: p.difficulty || "" });
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
            Store.markProblemDone(cls.id, lid, p.id, xp);
            reward(xp, streak >= 3 ? "flame" : "check", streak >= 3 ? streak + " in a row!" : "Nice!");
          } else {
            verdict.textContent = "Not quite — check the solution."; verdict.className = "verdict wrong";
            recordTutorAttempt("wrong");
            streak = 0;
            Store.markProblemDone(cls.id, lid, p.id, 2); // small XP for the attempt
          }
          setStreak(streak);
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
    var streak = 0, solved = slot, inst = null, checked = false, chosen = null, seen = {};

    var session = el("div", "session");
    var top = el("div", "session-top");
    var closeX = el("button", "close-x"); closeX.innerHTML = icon("x"); closeX.onclick = function () { session.remove(); renderClass(cls.id); };
    var track = el("div", "session-progress"); var fill = el("div", "fill"); track.appendChild(fill);
    var streakEl = el("div", "session-streak"); function setStreak(n) { streakEl.innerHTML = icon("flame") + "<span>" + n + "</span>"; } setStreak(0);
    top.append(closeX, track, streakEl); session.appendChild(top);

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
      setTutorContext({ page: "generated practice problem", class_name: cls.name, lesson_id: lid, lesson_title: lesson.title, lesson_summary: lesson.summary, chapter: (cls.chapters && cls.chapters[lid]) || "", textbook: classTextbooks(cls), question_id: lid + ":slot-" + slot, question_prompt: inst.prompt, hint: inst.hint || "", difficulty: inst.difficulty || "", source: inst.source || "" });
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
            Store.markProblemDone(cls.id, lid, "slot" + slot + "-" + Date.now(), xp);
            reward(xp, streak >= 3 ? "flame" : "check", streak >= 3 ? streak + " in a row!" : "Nice!");
            actionBtn.textContent = "Next →"; skipBtn.style.display = "none";
          } else {
            verdict.textContent = "Not quite. Read the solution, then try a fresh one."; verdict.className = "verdict wrong";
            recordTutorAttempt("wrong");
            streak = 0; actionBtn.textContent = "Try another →";
          }
          setStreak(streak);
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
    var pool = (lesson.problems || []).slice();
    var maxN = pool.length;
    modal(
      "<h2>Practice exam — " + esc(lesson.title) + "</h2>" +
      "<p class='modal-sub'>Set your parameters. Each question has a hint. You'll see all questions but verify one at a time.</p>" +
      "<div class='row2'>" +
      "<div class='field'><label>Number of questions</label><input id='t-n' type='number' min='1' max='" + maxN + "' value='" + Math.min(10, maxN) + "'></div>" +
      "<div class='field'><label>Time limit (minutes)</label><input id='t-min' type='number' min='1' max='180' value='15'></div>" +
      "</div>" +
      "<div class='modal-actions'><button class='btn subtle' data-close>Cancel</button><button class='btn primary' id='t-go'>Start exam</button></div>"
    ).querySelector("#t-go").onclick = function () {
      var host = document.getElementById("modal-host");
      var n = Math.max(1, Math.min(maxN, +host.querySelector("#t-n").value || 10));
      var mins = Math.max(1, +host.querySelector("#t-min").value || 15);
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

  function materialsDialog(id) {
    var u = Store.getUploads(id);
    var m = modal(
      "<h2>Course materials</h2>" +
      "<p class='modal-sub'>Attached when you created the class. Update them any time.</p>" +
      "<div class='field'><label>Syllabus</label><div style='display:flex;gap:8px;align-items:center'>" +
      "<span style='flex:1;color:" + (u.syllabus ? "var(--ink)" : "var(--ink-soft)") + "'>" + esc(u.syllabus || "None attached") + "</span>" +
      "<button class='btn subtle' id='m-syl'>" + (u.syllabus ? "Replace" : "Add") + "</button></div></div>" +
      "<div class='field'><label>Textbooks</label><div id='m-books'></div>" +
      "<div style='display:flex;gap:8px;margin-top:8px'>" +
      "<button type='button' class='btn subtle' id='m-addname'>+ By name</button>" +
      "<button type='button' class='btn subtle' id='m-addcover'>+ Cover photo</button></div></div>" +
      "<div class='modal-actions'><button class='btn primary' data-close>Done</button></div>"
    );
    var host = m.querySelector("#m-books");
    function draw() {
      var books = Store.getUploads(id).textbooks;
      host.innerHTML = "";
      if (!books.length) host.appendChild(el("p", "modal-sub", "None yet."));
      books.forEach(function (b, i) {
        var row = el("div", "eq-row"); row.style.marginBottom = "6px";
        var span = el("span"); span.style.flex = "1"; span.textContent = b.value + (b.kind === "cover" ? "  (cover)" : "");
        var rm = el("button", "eq-rm"); rm.innerHTML = icon("trash");
        rm.onclick = function () { Store.removeTextbook(id, i); draw(); };
        row.append(span, rm); host.appendChild(row);
      });
    }
    draw();
    m.querySelector("#m-syl").onclick = function () { uploadDialog(id, "syllabus"); };
    m.querySelector("#m-addname").onclick = function () {
      var name = prompt("Textbook name (title, author, edition):");
      if (name && name.trim()) { Store.addTextbook(id, "name", name.trim()); draw(); }
    };
    m.querySelector("#m-addcover").onclick = function () {
      var f = document.createElement("input"); f.type = "file"; f.accept = "image/*";
      f.onchange = function () { if (f.files[0]) { Store.addTextbook(id, "cover", f.files[0].name); draw(); } };
      f.click();
    };
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
    var m = hash.match(/^#\/class\/(.+)$/);
    if (m) renderClass(m[1]);
    else if (hash === "#/notebook") renderNotebook();
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
    var state = { image: "", maximized: false, minimized: false, context: tutorContext };
    dock.innerHTML = "";
    var head = el("div", "tutor-head"), identity = el("div", "tutor-identity"), avatar = el("span", "tutor-avatar"); avatar.appendChild(tutorAvatar()); identity.appendChild(avatar);
    var copy = el("div"); copy.appendChild(el("strong", null, "Maf, your study tutor")); copy.appendChild(el("span", "tutor-context", "Ready to help")); identity.appendChild(copy);
    var controls = el("div", "tutor-controls"), min = el("button", "tutor-icon"), max = el("button", "tutor-icon"), close = el("button", "tutor-icon");
    min.innerHTML = icon("minus"); min.title = "Minimize"; max.innerHTML = icon("maximize"); max.title = "Maximize"; close.innerHTML = icon("x"); close.title = "Close";
    controls.append(min, max, close); head.append(identity, controls); dock.appendChild(head);
    var body = el("div", "tutor-body"), messages = el("div", "tutor-messages"), welcome = el("div", "tutor-message assistant");
    welcome.appendChild(tutorAvatar()); welcome.appendChild(el("div", "tutor-bubble", "Hi, I’m Maf. I know the lesson or problem you are on. What should we work through?")); messages.appendChild(welcome); body.appendChild(messages);
    var preview = el("div", "tutor-photo-preview"); preview.hidden = true; body.appendChild(preview);
    var composer = el("div", "tutor-composer"), file = document.createElement("input"); file.type = "file"; file.accept = "image/png,image/jpeg,image/webp,image/gif"; file.hidden = true;
    var photo = el("button", "tutor-compose-action"), input = document.createElement("textarea"), voice = el("button", "tutor-compose-action"), send = el("button", "tutor-send");
    photo.innerHTML = icon("image"); photo.title = "Add a photo of your work"; input.className = "tutor-input"; input.rows = 1; input.placeholder = "Ask about this problem…";
    voice.innerHTML = icon("mic"); voice.title = "Speak your question"; send.innerHTML = icon("send"); send.title = "Send";
    composer.append(file, photo, input, voice, send); body.appendChild(composer); body.appendChild(el("p", "tutor-note", "Free tutor test. It may be slow when free models are busy."));
    if (TUTOR_URL && TUTOR_URL.indexOf("REPLACE_WITH") !== 0) { var premium = document.createElement("a"); premium.className = "tutor-premium-link"; premium.href = TUTOR_URL; premium.target = "_blank"; premium.rel = "noopener"; premium.textContent = "Open my Custom GPT ↗"; body.appendChild(premium); }
    dock.appendChild(body);
    function label(ctx) { return ctx.question_id ? "Problem " + ctx.question_id + (ctx.lesson_title ? " · " + ctx.lesson_title : "") : (ctx.lesson_title ? ctx.lesson_title + (ctx.chapter ? " · " + ctx.chapter : "") : "Ready to help"); }
    function add(role, text, imageData) {
      var row = el("div", "tutor-message " + role); if (role === "assistant") row.appendChild(tutorAvatar());
      row.appendChild(el("div", "tutor-bubble", text));
      if (imageData) { var thumb = document.createElement("img"); thumb.className = "tutor-image-message"; thumb.src = imageData; thumb.alt = "Uploaded work"; row.appendChild(thumb); }
      if (role === "assistant" && "speechSynthesis" in window) { var speak = el("button", "tutor-speak"); speak.innerHTML = icon("volume"); speak.title = "Read this answer aloud"; speak.onclick = function () { var utterance = new SpeechSynthesisUtterance(text); utterance.rate = .95; window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance); }; row.appendChild(speak); }
      messages.appendChild(row); messages.scrollTop = messages.scrollHeight;
    }
    function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 118) + "px"; }
    function clearImage() { state.image = ""; preview.hidden = true; preview.innerHTML = ""; file.value = ""; }
    function showImage(data) { state.image = data; preview.hidden = false; preview.innerHTML = ""; var img = document.createElement("img"); img.src = data; img.alt = "Photo ready to send"; var remove = el("button", "tutor-photo-remove", "Remove photo"); remove.onclick = clearImage; preview.append(img, remove); }
    function submit() {
      var question = input.value.trim(); if (!question && !state.image) return; if (!question) question = "Please look at this photo and help me with the problem.";
      var sentImage = state.image; add("student", question, sentImage); input.value = ""; autosize(); clearImage(); send.disabled = true; send.classList.add("thinking");
      fetch(TUTOR_API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: question, context: state.context, image_data: sentImage }) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Tutor unavailable."); return j; }); })
        .then(function (j) { add("assistant", j.answer || "I could not make an answer. Please try again."); })
        .catch(function (e) { add("assistant", "I could not reach the tutor right now. " + e.message); })
        .finally(function () { send.disabled = false; send.classList.remove("thinking"); input.focus(); });
    }
    photo.onclick = function () { file.click(); };
    file.onchange = function () { var chosen = file.files && file.files[0]; if (chosen) compressTutorImage(chosen).then(showImage).catch(function (error) { add("assistant", error.message); }); };
    input.oninput = autosize; input.onkeydown = function (event) { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }; send.onclick = submit;
    voice.onclick = function () { var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Recognition) { add("assistant", "Voice typing is not available in this browser yet. You can still type or add a photo."); return; }
      var recognition = new Recognition(); recognition.lang = navigator.language || "en-US"; recognition.interimResults = true; recognition.continuous = false; voice.classList.add("listening");
      recognition.onresult = function (event) { var words = ""; for (var i = event.resultIndex; i < event.results.length; i++) words += event.results[i][0].transcript; input.value = words; autosize(); };
      recognition.onerror = function () { add("assistant", "I could not hear that. Please try again or type your question."); }; recognition.onend = function () { voice.classList.remove("listening"); }; recognition.start(); };
    min.onclick = function () { state.minimized = !state.minimized; dock.classList.toggle("min", state.minimized); min.innerHTML = icon(state.minimized ? "maximize" : "minus"); };
    max.onclick = function () { state.maximized = !state.maximized; dock.classList.toggle("max", state.maximized); if (state.maximized) dock.style.left = ""; };
    close.onclick = function () { dock.hidden = true; dock.setAttribute("aria-hidden", "true"); launcher.hidden = false; };
    launcher.innerHTML = icon("chat") + "<span>Ask Maf</span>";
    head.addEventListener("pointerdown", function (event) { if (event.target.closest("button, a")) return; var box = dock.getBoundingClientRect(), sx = event.clientX, sy = event.clientY, left = box.left, top = box.top; dock.classList.add("dragging"); dock.setPointerCapture(event.pointerId);
      function move(e) { dock.style.left = Math.max(8, Math.min(window.innerWidth - dock.offsetWidth - 8, left + e.clientX - sx)) + "px"; dock.style.top = Math.max(8, Math.min(window.innerHeight - dock.offsetHeight - 8, top + e.clientY - sy)) + "px"; dock.style.right = "auto"; dock.style.bottom = "auto"; }
      function up() { dock.classList.remove("dragging"); dock.removeEventListener("pointermove", move); dock.removeEventListener("pointerup", up); } dock.addEventListener("pointermove", move); dock.addEventListener("pointerup", up); });
    return window.__studymafTutor = { open: function () { dock.hidden = false; dock.setAttribute("aria-hidden", "false"); launcher.hidden = true; requestAnimationFrame(function () { input.focus(); }); }, updateContext: function (ctx) { state.context = ctx; copy.querySelector(".tutor-context").textContent = label(ctx); } };
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

  function applyIpadMode() { document.body.classList.toggle("ipad-mode", Store.getIpadMode()); }

  function init() {
    appEl = document.getElementById("app");
    applyAccent(Store.getAccent());
    applyIpadMode();
    bindHeader();
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
