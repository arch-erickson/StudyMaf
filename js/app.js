/* StudyMAF — app shell: routing, dashboard, class page, sequential study session,
 * test/homework modes, accent theming, uploads. Content comes from /data JSON.
 *
 * AI-dependent features (tutor, syllabus/homework -> generated lessons) are
 * scaffolded with clear "next stage" notices: this MVP is static, no backend/keys.
 */
window.App = (function () {
  "use strict";

  var appEl, lessonIndex = [], lessonCache = {};
  var TUTOR_URL = "REPLACE_WITH_YOUR_TUTOR_URL"; // <-- paste your Custom GPT / Claude Project URL

  // ---------- helpers ----------
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function h(html) { var d = document.createElement("div"); d.innerHTML = html; return d; }
  function icon(name) { return window.Icons ? Icons.get(name) : ""; }
  // button with an SVG icon + text label
  function ib(cls, iconName, label) { var b = el("button", cls); b.innerHTML = icon(iconName) + "<span>" + esc(label) + "</span>"; return b; }
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
    page.appendChild(profile);

    var head = el("div", "section-head");
    head.appendChild(el("h2", null, "Classes"));
    var addBtn = el("button", "btn primary", "+ Add class"); addBtn.onclick = openAddClass;
    head.appendChild(addBtn);
    page.appendChild(head);

    var grid = el("div", "class-grid");
    var counts = {}; lessonIndex.forEach(function (l) { counts[l.id] = l.problemCount || 20; });

    Store.classes().forEach(function (c) {
      var card = el("button", "class-card");
      var thumb = el("div", "class-thumb"); thumb.setAttribute("style", thumbStyle(c.thumbSeed));
      var badge = el("span", "thumb-badge", (c.lessonIds.length) + " lesson" + (c.lessonIds.length === 1 ? "" : "s"));
      thumb.appendChild(badge); card.appendChild(thumb);
      var body = el("div", "class-body");
      body.appendChild(el("h3", null, c.name));
      var meta = [c.semester, c.year].filter(Boolean).join(" · ") || c.date;
      body.appendChild(el("p", "class-meta", meta));
      var pct = Store.classProgressPct(c, counts);
      var row = el("div", "progress-row");
      var track = el("div", "progress-track"); var fill = el("div", "progress-fill"); fill.style.width = pct + "%"; track.appendChild(fill);
      row.appendChild(track); row.appendChild(el("span", "progress-pct", pct + "%"));
      body.appendChild(row); card.appendChild(body);
      card.onclick = function () { location.hash = "#/class/" + c.id; };
      grid.appendChild(card);
    });

    var add = el("button", "add-card");
    add.appendChild(el("span", "plus", "+")); add.appendChild(el("span", null, "Add a class"));
    add.onclick = openAddClass;
    grid.appendChild(add);

    page.appendChild(grid);
    appEl.appendChild(page);
  }

  function openAddClass() {
    var opts = lessonIndex.map(function (l) {
      return "<label style='display:flex;gap:8px;align-items:center;margin-bottom:6px'>" +
        "<input type='checkbox' class='lz' value='" + esc(l.id) + "' checked> " + esc(l.title) + "</label>";
    }).join("");
    var m = modal(
      "<h2>Add a class</h2><p class='modal-sub'>Fill in the basics and attach your course materials up front. Lessons load from your data files.</p>" +
      "<div class='field'><label>Class name</label><input id='ac-name' placeholder='e.g. Algebra I'></div>" +
      "<div class='row2'>" +
      "<div class='field'><label>Semester</label><select id='ac-sem'><option>Fall</option><option>Spring</option><option>Summer</option><option>Winter</option></select></div>" +
      "<div class='field'><label>Year</label><input id='ac-year' value='" + new Date().getFullYear() + "'></div>" +
      "</div>" +
      "<div class='row2'>" +
      "<div class='field'><label>Syllabus <span style='font-weight:400;color:var(--ink-soft)'>(required to tailor lessons)</span></label><input id='ac-syl' type='file' accept='.pdf,.doc,.docx,.txt,.png,.jpg'></div>" +
      "<div class='field'><label>Textbook <span style='font-weight:400;color:var(--ink-soft)'>(optional)</span></label><input id='ac-txt' type='file' accept='.pdf,.doc,.docx,.txt,.png,.jpg'></div>" +
      "</div>" +
      "<div class='notice' style='margin-bottom:16px'><strong>Static MVP.</strong>Files stay on your device (names remembered). Generating lessons from the syllabus/textbook happens in the AI stage.</div>" +
      "<div class='field'><label>Lessons to include</label>" + (opts || "<p class='modal-sub'>No lessons in data/index.json yet.</p>") + "</div>" +
      "<div class='modal-actions'><button class='btn subtle' data-close>Cancel</button><button class='btn primary' id='ac-save'>Create class</button></div>"
    );
    m.querySelector("#ac-save").onclick = function () {
      var name = m.querySelector("#ac-name").value.trim() || "Untitled Class";
      var chosen = Array.prototype.slice.call(m.querySelectorAll(".lz:checked")).map(function (x) { return x.value; });
      var cls = Store.addClass({ name: name, semester: m.querySelector("#ac-sem").value, year: m.querySelector("#ac-year").value, lessonIds: chosen });
      var syl = m.querySelector("#ac-syl").files[0], txt = m.querySelector("#ac-txt").files[0];
      if (syl) Store.setUpload(cls.id, "syllabus", syl.name);
      if (txt) Store.setUpload(cls.id, "textbook", txt.name);
      closeModal(); renderDashboard();
    };
  }

  // ====================================================================
  // CLASS PAGE
  // ====================================================================
  function renderClass(id) {
    var cls = Store.getClass(id);
    if (!cls) { location.hash = "#/"; return; }
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
    if (upl.syllabus || upl.textbook) {
      var info = el("div", "notice");
      info.innerHTML = "<strong>Uploaded</strong>" +
        (upl.syllabus ? "Syllabus: " + esc(upl.syllabus) + ". " : "") +
        (upl.textbook ? "Textbook: " + esc(upl.textbook) + ". " : "") +
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
    var total = entry.problemCount || 20;
    var doneN = Object.keys(prog.done).length;
    var pct = total ? Math.round(doneN / total * 100) : 0;

    var row = el("div", "lesson"); row.setAttribute("aria-expanded", "false");
    var btn = el("button", "lesson-btn");
    btn.appendChild(el("span", "lesson-idx", String(i + 1)));
    var main = el("div", "lesson-main");
    main.appendChild(el("p", "name", "Lesson " + (i + 1) + ": " + entry.title));
    var mp = el("div", "mini-progress");
    var track = el("div", "progress-track"); var fill = el("div", "progress-fill"); fill.style.width = pct + "%"; track.appendChild(fill);
    mp.appendChild(track); mp.appendChild(el("span", "progress-pct", pct + "%"));
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
          panel.innerHTML = "";
          var sum = el("p", "lp-summary", lesson.summary); panel.appendChild(sum); StudyMath.render(sum);
          var acts = el("div", "lp-actions");
          var startLbl = doneN > 0 && doneN < total ? "Continue" : (doneN >= total ? "Practice again" : "Start lesson");
          var start = ib("btn primary", "play", startLbl);
          start.onclick = function () { startSession(cls, lid, lesson); };
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

  // ---------- concept reader (sequential reveal + figures + examples) ----------
  function conceptReader(lesson) {
    var body = "<h2>" + esc(lesson.title) + "</h2><p class='modal-sub'>Concepts build from simple to complex. Reveal the next level when ready.</p><div id='cr-body'></div>";
    var m = modal(body + "<div class='modal-actions'><button class='btn primary' data-close>Done</button></div>", { wide: true });
    var host = m.querySelector("#cr-body");

    // figures first (relevant diagrams)
    (lesson.figures || []).forEach(function (fig) { host.appendChild(Figures.element(fig)); });

    var sections = (lesson.concept_sections || []).slice().sort(function (a, b) { return a.level - b.level; });
    var listWrap = el("div", "concept-list"); host.appendChild(listWrap);
    var shown = 0, revealBtn = null;
    function showNext() {
      if (shown >= sections.length) return;
      var s = sections[shown];
      var c = el("div", "concept");
      c.appendChild(el("span", "level-tag", "Level " + s.level));
      c.appendChild(el("h3", null, s.heading));
      var p = el("p", null, s.explanation); c.appendChild(p);
      listWrap.appendChild(c); StudyMath.render(c);
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

    // examples
    if ((lesson.real_world_examples || []).length) {
      host.appendChild(el("h3", "step-block", "Real-world examples"));
      var cards = el("div", "example-cards");
      lesson.real_world_examples.forEach(function (ex) {
        var card = el("div", "card");
        card.appendChild(el("h4", null, ex.title));
        card.appendChild(el("p", "sc", ex.scenario));
        var ap = el("p", "ap"); ap.innerHTML = "<strong>How the math applies:</strong> " + esc(ex.how_the_math_applies);
        card.appendChild(ap); cards.appendChild(card); StudyMath.render(card);
      });
      host.appendChild(cards);
    }
  }

  // ====================================================================
  // STUDY SESSION — one problem at a time, Duolingo-style rewards
  // ====================================================================
  function startSession(cls, lid, lesson) {
    var problems = lesson.problems || [];
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
      var drawBtn = ib("btn subtle", "edit", "Scratch work");
      var calcBtn = ib("btn subtle", "calculator", "Calculator");
      tools.append(hintBtn, drawBtn, calcBtn); inner.appendChild(tools);

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
      drawBtn.onclick = function () { Drawing.open({ classId: cls.id, lessonId: lid, problemId: p.id, title: "Problem " + (idx + 1) }); };
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
            streak++; var xp = 10 + (p.difficulty === "hard" ? 5 : 0) + (p.difficulty === "stretch" ? 10 : 0);
            Store.markProblemDone(cls.id, lid, p.id, xp);
            reward(xp, streak >= 3 ? "flame" : "check", streak >= 3 ? streak + " in a row!" : "Nice!");
          } else {
            verdict.textContent = "Not quite — check the solution."; verdict.className = "verdict wrong";
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
      "<div class='field'><label>Textbook</label><div style='display:flex;gap:8px;align-items:center'>" +
      "<span style='flex:1;color:" + (u.textbook ? "var(--ink)" : "var(--ink-soft)") + "'>" + esc(u.textbook || "None attached") + "</span>" +
      "<button class='btn subtle' id='m-txt'>" + (u.textbook ? "Replace" : "Add") + "</button></div></div>" +
      "<div class='modal-actions'><button class='btn primary' data-close>Done</button></div>"
    );
    m.querySelector("#m-syl").onclick = function () { uploadDialog(id, "syllabus"); };
    m.querySelector("#m-txt").onclick = function () { uploadDialog(id, "textbook"); };
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
    if (m) renderClass(m[1]); else renderDashboard();
  }

  function bindHeader() {
    var c = document.getElementById("open-calc");
    c.innerHTML = icon("calculator") + "<span>Calculator</span>";
    c.onclick = function () { Calculator.open(); };
    document.getElementById("open-accent").onclick = openAccentPicker;
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
    if (Store.classes().length) return;
    var lids = lessonIndex.map(function (l) { return l.id; });
    if (lids.length) Store.addClass({ name: "Algebra I", semester: "Fall", year: String(new Date().getFullYear()), lessonIds: lids });
  }

  function init() {
    appEl = document.getElementById("app");
    applyAccent(Store.getAccent());
    bindHeader();
    fetchJSON("data/index.json").then(function (index) {
      lessonIndex = (index.lessons || []);
      // learn problem counts for progress math
      return Promise.all(lessonIndex.map(function (l) {
        return loadLesson(l.id).then(function (js) { l.problemCount = (js.problems || []).length; }).catch(function () { l.problemCount = 20; });
      }));
    }).then(function () {
      seedIfEmpty();
      window.addEventListener("hashchange", route);
      route();
    }).catch(function (e) {
      appEl.innerHTML = "<div class='page wrap'><div class='notice'><strong>Couldn't load data/index.json</strong>" + esc(e.message) +
        ". If you opened the file directly, serve it over http instead.</div></div>";
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  // public
  return { toast: toast, modal: modal, reward: reward, closeModal: closeModal };
})();
