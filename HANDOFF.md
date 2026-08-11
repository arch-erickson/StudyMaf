# StudyMAF — Engineering Handoff

> Handoff for continuing work in a fresh Claude Code tab. Read this top-to-bottom before touching code.

---

## 1. What this is

**StudyMAF** is a private, static math/physics study web app the user (a student) is building for this semester. It is served by **GitHub Pages at `studymaf.com`** (custom domain + `CNAME` already configured; HTTPS live).

- **Repo:** `https://github.com/arch-erickson/StudyMaf.git`
- **Local path:** `C:\Users\erick\StudyMaf`
- **Git author for commits:** name `arch-erickson`, email `ericksoncabrera39@gmail.com`
  (commit with `git -c user.name="arch-erickson" -c user.email="ericksoncabrera39@gmail.com" commit -m "..."`)
- **Platform:** Windows 11, PowerShell + Git Bash. Node is available; **Python is NOT installed**.

### Governing principle (do not violate)
**The AI fills in data; the code owns the structure.** Lessons are JSON files under `/data/lessons/` conforming to `/data/lesson.schema.json`. The page reads JSON and renders it. **Never bake lesson text into HTML.**

### Hard MVP constraints
- **No backend, no APIs, no keys, no database.** Everything is client-side (`localStorage`).
- **No external requests.** Everything is **vendored locally** under `/vendor/` (KaTeX, MathLive, Inter font). GitHub Pages must serve as-is (there's a `.nojekyll`).
- **Soft access gate only** (not real security).

---

## 2. Working agreement (the user's expectations)

- **Commit in small, logical chunks with clear messages; push after each.** The user watches commits land on the site.
- **Verify changes in the browser before claiming done** (see §9). The user tests on a real **iPad** (Safari) — many bugs are iPad-specific.
- **Be honest about what's stubbed vs working.** AI-dependent features are UI stubs with "coming in the AI stage" notices — never pretend they work.
- Vendor anything new; never add a CDN/external fetch.
- When something is large, do it in committed stages rather than one giant unverified change.

---

## 3. File map

```
index.html            Shell: loads vendored CSS/JS + app modules. Order matters.
styles.css            All styles (one file, appended-to over time). Palette vars at top.
.nojekyll  CNAME      Pages config (CNAME = studymaf.com)
data/
  lesson.schema.json  Source-of-truth JSON Schema (draft-07). Has $defs/figure.
  index.json          List of lessons {id,title,file} the app loads.
  README.md           How to author a lesson.
  lessons/
    phys1442-01-coulomb.json ... phys1442-14-*.json   (14 PHYS 1442 lessons)
    sample.json                                        (Algebra demo lesson)
js/
  gate.js         Soft password gate (password = "studymaf"). Runs first.
  icons.js        Inline SVG icon set. Icons.get(name).
  store.js        localStorage state (Store.*). Single source of client state.
  math.js         KaTeX render helper (StudyMath.render(el)).
  figures.js      Diagram engine (Figures.element(fig)): schematic (SVG), coordinate-plane, number-line. Supports animation frames.
  calculator.js   The whole calculator (scientific+graph+notepad). Uses MathLive.
  notebook.js     Scratch-work / drawing surface (canvas). iPad-first.
  generators.js   QUESTION ENGINE — parametric question generators per lesson.
  app.js          Router, dashboard, class page, study session, test/homework modes, accent, iPad mode, fullscreen. Exposes window.App.
vendor/
  fonts/          Inter (woff2) + inter.css
  katex/          KaTeX (css, js, auto-render, fonts)
  mathlive/       MathLive (mathlive.min.js, static+fonts css, fonts, sounds) — ~1.4MB
```

`index.html` script order: `gate → icons → store → math → figures → calculator → notebook → generators → app`. KaTeX + MathLive load with `defer`; MathLive fonts dir is set on DOMContentLoaded (`MathfieldElement.fontsDirectory = "vendor/mathlive/fonts"`).

---

## 4. State model (`js/store.js`, localStorage key `studymaf.v1`)

```
accent            hex color (user-selectable theme accent)
classes[]         {id,name,semester,year,date,thumbSeed,lessonIds[],createdAt}
progress{}        "classId::lessonId" -> {done:{problemId:true}, xp, genSlot}
drawings{}        (legacy per-problem PNG; mostly unused now)
uploads{}         classId -> {syllabus, textbooks:[{kind:"name"|"cover",value}], homework:[]}
modes{}           classId -> {online:bool}
notebook[]        saved scratch pages {id,lessonId,lessonName,title,date,image}
scratch{}         "cid::lid::pid" -> strokes JSON (resume/auto-save)
flags{}           one-time migration flags (e.g. "phys1442-seed")
nbGrid            notebook grid pref {type,size,color,opacity}
ipadMode          bool (iPad Mode)
```

Key methods: `getGenSlot/setGenSlot` (session resume), `getGrid/setGrid`, `getIpadMode/setIpadMode`, `flag/setFlag`, `addTextbook/removeTextbook`, `addNotebookEntry/notebookEntries`, `saveScratch/getScratch`, `setClassLessons`.

**Seeding/migration:** `seedIfEmpty()` in app.js runs once (guarded by flag `phys1442-seed`): removes the old auto-seeded "Algebra I" demo and creates the **PHYS 1442 — General Physics II** class with all `phys1442-*` lessons + syllabus + 3 textbook names. `reconcilePhysLessons()` runs every load to add any newly-authored phys lessons to that class.

> **Gotcha:** bumping the storage key or clearing `localStorage` wipes the user's classes/notebook/accent. When testing, use `localStorage.removeItem('studymaf.v1')` + reload to re-seed, but don't ship a key bump casually.

---

## 5. THE QUESTION ENGINE (`js/generators.js`) — read carefully

This is the user's most-emphasized system. It **replaces static problem lists** for lessons that have generators.

### How it works
- `Generators.register(lessonId, { easy:[fn,...], medium:[...], hard:[...], extreme:[...] })`.
- Each generator **fn** picks random clean numbers, **computes the answer AND the worked steps at the same time**, and returns one *instance*:
  - `numeric`: `{type:"numeric", prompt, answerValue, answerText, unit, tol, steps[], hint}`
  - `mc` (multiple choice): `{type:"mc", prompt, choices[], answerIndex, steps[], hint}`
  - `multi` (multi-part a/b/…): `{type:"multi", prompt, parts:[{label,type:"numeric"|"mc",...}], steps[], hint}`
  - Builder helpers: `num()`, `mc()`, `multi()`, plus `rpick(arr)`, `sig(x)` (sig-fig format).
- `Generators.make(lessonId, difficulty)` → picks a random fn for that difficulty, returns a fresh instance. Infinite variants: same wording, new numbers.
- `Generators.has(lessonId)` → whether generators exist.

### Currently authored
Only **`phys1442-01-coulomb`** and **`phys1442-02-efield`** have generators. All other lessons fall back to their **static** `problems[]` arrays. **TODO: write generators for lessons 3–14** (parametric, same pattern). This is deferred/next per the user.

### Session flow (`startGenSession` in `app.js`)
- Dispatcher `startSession()` → `startGenSession()` if `Generators.has(lid)`, else `startStaticSession()` (iterates the lesson's static `problems`).
- **Plan = 7 slots: 2 easy / 2 medium / 2 hard / 1 extreme (skippable).** Extreme is authored as **multi-part**.
- **Stay-until-correct:** wrong answer shows the solution + "Try another" which **regenerates a NEW instance of the SAME difficulty** (does NOT drop to easier or advance). Advance only on a correct answer.
- **Resume:** `Store.getGenSlot/setGenSlot(cid,lid)` persists the slot; re-entering the lesson resumes where you left off (do NOT reset progress).
- **No repeats:** a `seen{}` set of prompts skips already-shown questions within the session (retries `make()` up to 14×).
- **Non-numeric answers are multiple-choice** (avoids typo errors). Numeric uses tolerance compare (`numMatch`, relative tol ~3–4%, supports scientific notation).
- XP per correct (easy 8/med 12/hard 18/extreme 30). Duolingo-style reward pop + streak.

### FUTURE (AI stage) for the engine
The current engine is **deterministic JS templates**. The intended future: an **AI-backed generator** that, given a lesson/syllabus/homework, produces questions of a requested difficulty on demand (still "solve + generate together"), plus **adaptive difficulty** (harder after correct streaks; targeted regeneration on weaknesses). Keep the same instance shape (`numeric|mc|multi`) so the session UI doesn't change — the AI just becomes another source feeding `make()`.

---

## 6. Lessons & schema

- `data/lesson.schema.json` (draft-07). A lesson has: `title, summary, glossary?, figures?, concept_sections[] (level,heading,explanation,figure?), real_world_examples[] (exactly 3: title,scenario,how_the_math_applies,detail?,figure?), videos{concept_query,math_query,combined_query}, problems[] (min 8; each id,difficulty(easy|medium|hard|stretch),prompt,correct_answer,solution_steps[],hint)`.
- `$defs/figure`: `{type: schematic|coordinate-plane|number-line, caption?, params}`.
- **Concept reader** (`conceptReader` in app.js): sequential level reveal, **per-concept diagrams**, **clickable keyword definitions** (glossary terms auto-outlined; popup shows "In plain terms" + "In this class"), and **horizontal expandable example cards** (dropdown → detail + diagram). A **+ red / − blue** sign-color legend is shown.
- **Content status:** all 14 PHYS 1442 lessons authored (concepts + 3 examples + videos + problems). **Only Lesson 1 (Coulomb) is fully enriched** with animated per-concept diagrams + glossary + example details. Lessons 2–14 still need that enrichment (diagrams/glossary/animation). Lesson 2 has NO diagrams yet.
- Math in JSON uses LaTeX `$...$` (rendered by KaTeX via `StudyMath.render` / `richText`).

### PHYS 1442 course (from the user's real syllabus)
NYC College of Tech, calculus-based Physics II. Books: OpenStax University Physics Vol 2 & 3, optional Giancoli. 14 lessons: Coulomb → E-field → Gauss → Potential → Capacitance → Current → DC circuits/Kirchhoff → Magnetic force → Sources of B → Induction/Faraday → AC circuits → Maxwell/EM waves → Geometric optics → Lenses/Interference/Diffraction.

---

## 7. Diagram engine (`js/figures.js`)

- `Figures.element(fig)` → a `.figure` div (canvas or SVG + caption).
- **`schematic`** type = declarative SVG in one house style. `params.elements[]` of primitives: `charge {x,y,sign,label}`, `vector/arrow/ray`, `line`, `circle`, `plate`, `point`, `lens`, `label`. **Standard colors: + = #E8553A (red), − = #2F6DB5 (blue)**, ink navy, accent for emphasis.
- **Animation:** `params.frames = [[elements],[elements],...]` with `frameMs` cycles frames via rAF (stops when `!svg.isConnected`). Lesson 1's 5 concept figures use this.
- Also `coordinate-plane` and `number-line` (canvas), used by the algebra sample.
- **TODO:** add + animate diagrams for lessons 2–14 (data-only work; engine is ready).

---

## 8. Subsystems quick reference

### Calculator (`js/calculator.js`) — closely matches Desmos, recolored
- Scientific display is a **MathLive `<math-field>`** (`.calc-field`): proper formatting always, **click to place caret & edit**. `mathVirtualKeyboardPolicy='manual'`; our keypad inserts LaTeX via `insertMF()` (uses MathLive `#?` placeholder token). Keypad buttons use `onmousedown=preventBlur` to keep the field focused.
- **Keypad tabs: main / abc / func** with exact Desmos layouts (`keypadLayout()` returns `{cols, rows}` of key objects; `buildKeypad()` renders a CSS grid `.calc-grid2`). `main` has no `x` key (like Desmos — variables come from abc).
- **RAD/DEG** with real degree trig: `compile()` injects `sind/cosd/tand/asind/acosd/atand`; `latexToExpr()` maps trig by `angleMode` and rewrites `\sin^{-1}`→`\arcsin`.
- **Eval path:** MathLive latex → `latexToExpr()` (handles `\frac \sqrt \sqrt[n] ^{} \left| | \cdot \pi` etc., brace-less args via `arg()`) → existing `compile()` (whitelisted `new Function`).
- **History dropup** (`calcHistory`, `.calc-history`): Enter/↵ commits (`commitEntry`), entries stack above the field, tap to reuse.
- **Panels:** `sciOn / graphOn / notepadOn` toggle independently from the head (all attached in one dock); collapses to `.min` title bar when all off. `.calc-seam` (drag) resizes sci vs graph/notepad.
- **Graph:** equation rows are **editable MathLive fields** (`mf._eq`, `triggerEq` converts latex→expr in **radians**). Add-row bar = **Expression / Note / Folder**. **Notes** (`type:'note'`) and **collapsible folders** (`type:'folder'`, `collapsed` hides grouped rows in list AND in `redraw()`). Per-line show/hide dot. Pan/drag + wheel/zoom.
- **Responsive:** `.calc-dock { resize: both }` + ResizeObserver redraws graph; sci pane flexes to fill; keypad scales with width; history grows with height (keypad anchored bottom); `.max` enlarges buttons.
- **Mobile calculator:** `Calculator.openMobile()` = full-screen mobile layout (dashboard "Mobile calculator" button).
- **Remaining:** stats funcs (mean/stdev/nPr/nCr) insert but don't evaluate (no list engine); no drag-to-reorder / drag-into-folder; abc row-2 offset approximate.

### Notebook / scratch work (`js/notebook.js`) — iPad-first
- **Rendering:** offscreen `base` canvas holds committed strokes+grid; `paint()` blits base; **live drawing is incremental on the main canvas** (`drawLiveSegment`) for instant contact; on commit → `render()` rebuilds base (single-path so opacity is consistent). This fixed both the non-continuous strokes AND the opacity-drop-on-rerender bug.
- **iPad stroke reliability (critical, previously very broken):**
  1. Each pen pointer gets its **own** stroke via an `active{}` map (a fast second pen-down can't overwrite the first — that was the "1+2=3" dropped-strokes bug).
  2. `preventDefault` on raw `touchstart/touchmove/gesture*` on the canvas so Safari's double-tap/pinch/Scribble recognizer can't cancel quick strokes.
  3. Cache `curRect` per stroke (no `getBoundingClientRect` per event — that reflow janked fast writing).
- **Tools:** Pencil (thin smooth, default), Brush (pressure via `e.pressure`), Highlighter, Pen (tap anchors → straight polyline; **tap first point to close** a fillable shape), Curvature (tap → Catmull-Rom), Shapes (rect/square/ellipse/circle/triangle/line/cylinder/pyramid drag-out), Select & move (hit-test + drag + properties panel: stroke color/width/opacity, fill), Eraser (object eraser — removes strokes, keeps grid). Sliders: Size / Opacity / **Smooth** (real-time smoothing). Settings tools are a **vertical bar on the right** (`.nb-side`); drawing tools horizontal.
- **Layout:** scratch is a **popup over the dimmed question** (`.nb-overlay` flex-center; `.nb-shell` box) so closing always returns to the question. `.nb-overlay[hidden]{display:none!important}` (class `display:flex` was beating the hidden attr — same trap fixed for `.calc-dock[hidden]`). Side-by-side split mode with the problem. Grid (ruled/graph/dots) + zoom/pan (bounded).
- **Save As** → Notebook (thumbnail+title+date; dashboard `#/notebook` gallery) + share (Photos/WhatsApp via Web Share, ChatGPT opens site). Auto-saves strokes on close/pagehide; resumes. `exportImage()` uses the base layer (do NOT reference the old `drawStroke`; it's `drawStrokeOn(ctx,s)` now).

### App shell (`js/app.js`, `window.App`)
- Hash router: `#/` dashboard, `#/class/:id`, `#/notebook`. `App.rerender = route`.
- Helpers: `richText(container,text,glossary)` (splits `$math$` vs text, outlines glossary keywords → clickable popover, then KaTeX-renders), `ib(cls,icon,label)` icon buttons, `modal()/closeModal()` (modal-host, z 140), `reward()`, `toast()`.
- **Accent theming:** `applyAccent(hex)` sets `--accent` + readable ink; preset swatches + custom picker.
- **iPad Mode** (`body.ipad-mode`): disables text-selection/callouts app-wide so fast pencil input registers.
- **Immersive full screen** (`body.immersive`): hides header/footer, `position:fixed;overflow:hidden` so page scroll can't reveal the browser toolbar; floating top-right exit button appears on scroll (never exits on scroll). True OS fullscreen isn't available in iOS Safari without "Add to Home Screen".
- **Test mode / Homework mode / Online tutor / uploads** = scaffolded UI stubs with "AI stage" notices.

---

## 9. Running & testing locally

```bash
cd "C:/Users/erick/StudyMaf" && npx --yes http-server . -p 8765 -c-1   # run in background
```
Then in the in-app Browser tool: `preview_start {url:"http://localhost:8765/index.html"}` (direct `navigate` to localhost is blocked until a preview opens once).

- **Gate:** set `sessionStorage.setItem('studymaf.gate.ok','1')` to skip the password prompt in tests (password is `studymaf`).
- **Re-seed:** `localStorage.removeItem('studymaf.v1')` + reload.
- **Verify with `javascript_tool`** (DOM assertions) and `read_console_messages {onlyErrors:true}`. Screenshots often fail ("pane not compositing") — prefer `read_page` / `javascript_tool`.
- **Browser tabs pile up** — the tool caps tabs; reuse an existing localhost tab (`tabs_context` → `tabs_select`), don't keep opening new previews.
- Always `node --check js/<file>.js` after edits. For big blocks, write the replacement to the scratchpad and splice with a Node script (shell heredocs mangle `\` and `#` escaping).

### Known gotchas
- **`sed` on JS is dangerous** — a `#0`→`#?` replace once corrupted hex colors in an array. Prefer Edit/Node splices; grep-verify after.
- **`[hidden]` vs a class with `display:flex/grid`** — the class wins; add `.thing[hidden]{display:none!important}`.
- CRLF warnings on commit are harmless (Windows).
- Git pushes sometimes need `git pull --rebase origin main` first (GitHub may have added `CNAME`).

---

## 10. Backlog / next steps (roughly prioritized)

**Content (no AI needed):**
1. **Generators for lessons 3–14** (parametric, like 1–2) — user explicitly wants the whole course generative. Highest-value next content task.
2. **Enrich lessons 2–14** with per-concept diagrams + glossary + expandable example details; **animate** diagrams (frames) — Lesson 2 especially (has none). Standard +/− colors already defined.

**Calculator polish:**
3. Drag-to-reorder equation rows / drag-into-folder.
4. Evaluate stats functions (mean/stdev/nPr/nCr) — needs a small list engine.

**AI stage (all currently UI stubs — the big future work; needs a backend + keys, which the MVP forbids, so these ship as "AI feature coming soon"):**
- **Syllabus → generated lessons** (and textbook-aware): upload syllabus/textbook(name or cover) → AI produces lesson JSON matching the schema. (User uploaded a real PHYS 1442 syllabus; that workflow is the target.)
- **Homework mode:** upload a homework file → AI builds practice around exactly those question types.
- **Test mode:** simulate a real exam (no hints, background timer), then **post-test analysis** that reviews every answer + the student's handwritten work (from the Notebook), gives per-step feedback, generates a **restudy exam** targeting weaknesses, and **increases difficulty after correct answers** (adaptive).
- **Online tutor:** the "Online" toggle links to an external Custom GPT / Claude Project the user preloads with the lessons. `TUTOR_URL` placeholder is in `js/app.js` — user will paste their URL ("coming soon" for now).
- **Lesson-aware AI chat:** a chat box inside lessons; agent aware of the current lesson, adapts to the student's learning style, improves over time.
- **AI question generation** feeding the SAME instance shape (`numeric|mc|multi`) into the session `make()` — keep the session UI unchanged.
- **"Send to tutor"** from the Notebook (upload handwritten work to the AI) — currently stubbed.

Emphasize to the user, when relevant, that all of the above need the backend/API stage that the current static MVP intentionally excludes; keep them as clearly-labeled placeholders so the design intent is on record.

**Task 5 (pending):** full end-to-end workflow test from a real uploaded syllabus (once the AI stage exists).

---

## 11. Persistent memory

There's a project memory file the assistant maintains at
`C:\Users\erick\.claude\projects\C--Users-erick-OneDrive-Documents-Crystalina-Documents-Inventory\memory\studymaf-project.md`
(indexed in `MEMORY.md`). Keep it updated as work progresses; it's the cross-session source of truth alongside this handoff.

---

_Everything through the Desmos-style calculator (MathLive field, main/abc/func tabs, RAD/DEG, history dropup, graph math-fields + notes + folders, responsiveness) is committed and live on `main` / studymaf.com._
