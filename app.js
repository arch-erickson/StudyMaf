/* StudyMAF — study page renderer (MVP).
 *
 * Principle: the code owns the structure, the JSON owns the data.
 * This file reads a lesson JSON that conforms to /data/lesson.schema.json and
 * renders it. No lesson text is hardcoded here.
 *
 * Loads over http(s):// (GitHub Pages). Opening index.html from file:// will
 * block fetch() in most browsers.
 */

(function () {
  "use strict";

  var DATA_DIR = "data/";
  var els = {
    picker: document.getElementById("lesson-picker"),
    root: document.getElementById("lesson-root"),
    status: document.getElementById("status")
  };

  var DIFFICULTY_ORDER = ["easy", "medium", "hard", "stretch"];

  // ---- small DOM helpers (all text via textContent — never innerHTML with data) ----
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function setStatus(msg, isError) {
    els.status.textContent = msg;
    els.status.classList.toggle("error", !!isError);
    els.status.hidden = false;
  }

  // ---- boot ----
  function init() {
    fetchJSON(DATA_DIR + "index.json")
      .then(function (index) {
        var lessons = (index && index.lessons) || [];
        if (!lessons.length) { setStatus("No lessons are listed in data/index.json yet.", true); return; }
        populatePicker(lessons);

        var requested = new URLSearchParams(window.location.search).get("lesson");
        var chosen = lessons.filter(function (l) { return l.id === requested; })[0] || lessons[0];
        els.picker.value = chosen.id;
        loadLesson(chosen);

        els.picker.addEventListener("change", function () {
          var next = lessons.filter(function (l) { return l.id === els.picker.value; })[0];
          if (next) {
            var url = new URL(window.location.href);
            url.searchParams.set("lesson", next.id);
            window.history.replaceState({}, "", url);
            loadLesson(next);
          }
        });
      })
      .catch(function (err) {
        setStatus("Could not load data/index.json — " + err.message +
          ". (If you opened the file directly, serve it over http instead.)", true);
      });
  }

  function populatePicker(lessons) {
    clear(els.picker);
    lessons.forEach(function (l) {
      var opt = el("option", null, l.title || l.id);
      opt.value = l.id;
      els.picker.appendChild(opt);
    });
  }

  function loadLesson(entry) {
    setStatus("Loading “" + (entry.title || entry.id) + "”…", false);
    fetchJSON(DATA_DIR + entry.file)
      .then(function (lesson) { renderLesson(lesson); })
      .catch(function (err) {
        setStatus("Could not load lesson “" + entry.file + "” — " + err.message, true);
      });
  }

  function fetchJSON(path) {
    return fetch(path, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  // ---- render ----
  function renderLesson(lesson) {
    els.status.hidden = true;
    clear(els.root);

    els.root.appendChild(el("h2", "lesson-title", lesson.title || "Untitled lesson"));
    if (lesson.summary) els.root.appendChild(el("p", "lesson-summary", lesson.summary));

    els.root.appendChild(renderConceptSections(lesson.concept_sections || []));
    els.root.appendChild(renderExamples(lesson.real_world_examples || []));
    els.root.appendChild(renderVideos(lesson.videos || {}));
    els.root.appendChild(renderProblems(lesson.problems || []));
  }

  // Concept sections: level 1 visible; later levels revealed one at a time as reader continues.
  function renderConceptSections(sections) {
    var block = el("section", "block");
    block.appendChild(el("h2", "section-title", "Concepts"));
    block.appendChild(el("p", "section-sub", "Start simple. Reveal the next level when you're ready."));

    var sorted = sections.slice().sort(function (a, b) { return (a.level || 0) - (b.level || 0); });
    var list = el("div");
    block.appendChild(list);

    var shown = 0;
    function showNext() {
      if (shown >= sorted.length) return;
      var s = sorted[shown];
      var card = el("div", "concept");
      card.appendChild(el("span", "level-tag", "Level " + (s.level != null ? s.level : shown + 1)));
      card.appendChild(el("h3", null, s.heading || ""));
      card.appendChild(el("p", null, s.explanation || ""));
      list.appendChild(card);
      shown++;
      renderRevealButton();
    }
    var revealBtn = null;
    function renderRevealButton() {
      if (revealBtn) { revealBtn.remove(); revealBtn = null; }
      if (shown < sorted.length) {
        var remaining = sorted.length - shown;
        revealBtn = el("button", "reveal-more",
          "Reveal next level (" + remaining + " more) →");
        revealBtn.type = "button";
        revealBtn.addEventListener("click", showNext);
        list.appendChild(revealBtn);
      }
    }
    showNext(); // level 1 visible by default
    return block;
  }

  function renderExamples(examples) {
    var block = el("section", "block");
    block.appendChild(el("h2", "section-title", "Real-world examples"));
    block.appendChild(el("p", "section-sub", "Where this math actually shows up."));
    var grid = el("div", "cards");
    examples.forEach(function (ex) {
      var card = el("div", "card");
      card.appendChild(el("h3", null, ex.title || ""));
      card.appendChild(el("p", "scenario", ex.scenario || ""));
      var applies = el("p", "applies");
      applies.appendChild(el("strong", null, "How the math applies: "));
      applies.appendChild(document.createTextNode(ex.how_the_math_applies || ""));
      card.appendChild(applies);
      grid.appendChild(card);
    });
    block.appendChild(grid);
    return block;
  }

  // Video slots: show the search query + a manual link field (real links pasted by hand later).
  function renderVideos(videos) {
    var block = el("section", "block");
    block.appendChild(el("h2", "section-title", "Videos"));
    block.appendChild(el("p", "section-sub",
      "These are YouTube search queries, not links. Paste a verified link into a slot when you have one."));

    var slots = [
      { label: "Concept overview", query: videos.concept_query },
      { label: "Worked math", query: videos.math_query },
      { label: "Concept + math combined", query: videos.combined_query }
    ];
    slots.forEach(function (slot) {
      if (!slot.query) return;
      var wrap = el("div", "video-slot");
      wrap.appendChild(el("p", "slot-label", slot.label));
      wrap.appendChild(el("p", "query", slot.query));

      var row = el("div", "link-row");
      var input = el("input");
      input.type = "url";
      input.placeholder = "Paste a verified YouTube link here…";

      var searchLink = el("a", "search-link", "Search this on YouTube ↗");
      searchLink.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(slot.query);
      searchLink.target = "_blank";
      searchLink.rel = "noopener";

      var watch = el("a", "watch-link", "Open ↗");
      watch.target = "_blank";
      watch.rel = "noopener";
      watch.hidden = true;

      input.addEventListener("input", function () {
        var v = input.value.trim();
        if (v) { watch.href = v; watch.hidden = false; } else { watch.hidden = true; }
      });

      row.appendChild(input);
      row.appendChild(searchLink);
      row.appendChild(watch);
      wrap.appendChild(row);
      block.appendChild(wrap);
    });
    return block;
  }

  function renderProblems(problems) {
    var block = el("section", "block");
    block.appendChild(el("h2", "section-title", "Practice problems"));
    block.appendChild(el("p", "section-sub", "Filter by difficulty. Reveal hints and solutions when you're stuck."));

    var filterBar = el("div", "filter-bar");
    var listWrap = el("div");
    var countEl = el("span", "count");

    var active = "all";
    var filters = ["all"].concat(DIFFICULTY_ORDER);

    function labelFor(f) {
      if (f === "all") return "All";
      return f.charAt(0).toUpperCase() + f.slice(1);
    }

    var chips = {};
    filters.forEach(function (f) {
      var n = f === "all" ? problems.length : problems.filter(function (p) { return p.difficulty === f; }).length;
      var chip = el("button", "chip", labelFor(f) + " (" + n + ")");
      chip.type = "button";
      chip.setAttribute("aria-pressed", f === "all" ? "true" : "false");
      chip.addEventListener("click", function () {
        active = f;
        Object.keys(chips).forEach(function (k) {
          chips[k].setAttribute("aria-pressed", k === f ? "true" : "false");
        });
        draw();
      });
      chips[f] = chip;
      if (f === "all" || n > 0) filterBar.appendChild(chip);
    });
    filterBar.appendChild(countEl);

    function draw() {
      clear(listWrap);
      var shown = problems.filter(function (p) { return active === "all" || p.difficulty === active; });
      countEl.textContent = shown.length + " shown";
      shown.forEach(function (p) { listWrap.appendChild(renderProblem(p)); });
    }

    block.appendChild(filterBar);
    block.appendChild(listWrap);
    draw();
    return block;
  }

  function renderProblem(p) {
    var card = el("div", "problem");
    var head = el("div", "problem-head");
    var badge = el("span", "badge " + (p.difficulty || ""), (p.difficulty || "").toUpperCase());
    head.appendChild(badge);
    if (p.id) head.appendChild(el("span", "pid", p.id));
    card.appendChild(head);
    card.appendChild(el("p", "prompt", p.prompt || ""));

    var actions = el("div", "actions");
    var hintBtn = el("button", null, "Show hint");
    var solBtn = el("button", null, "Show solution");
    hintBtn.type = "button"; solBtn.type = "button";
    actions.appendChild(hintBtn);
    actions.appendChild(solBtn);
    card.appendChild(actions);

    // Hint panel
    var hintPanel = el("div", "reveal-panel");
    hintPanel.hidden = true;
    hintPanel.appendChild(el("p", "label", "Hint"));
    hintPanel.appendChild(el("p", "hint-text", p.hint || "No hint provided."));
    card.appendChild(hintPanel);

    // Solution panel
    var solPanel = el("div", "reveal-panel");
    solPanel.hidden = true;
    solPanel.appendChild(el("p", "label", "Answer"));
    solPanel.appendChild(el("p", "answer", p.correct_answer || ""));
    solPanel.appendChild(el("p", "label", "Solution steps"));
    var ol = el("ol");
    (p.solution_steps || []).forEach(function (step) { ol.appendChild(el("li", null, step)); });
    solPanel.appendChild(ol);
    card.appendChild(solPanel);

    hintBtn.addEventListener("click", function () {
      hintPanel.hidden = !hintPanel.hidden;
      hintBtn.textContent = hintPanel.hidden ? "Show hint" : "Hide hint";
    });
    solBtn.addEventListener("click", function () {
      solPanel.hidden = !solPanel.hidden;
      solBtn.textContent = solPanel.hidden ? "Show solution" : "Hide solution";
    });

    return card;
  }

  init();
})();
