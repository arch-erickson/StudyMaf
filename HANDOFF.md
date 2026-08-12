# StudyMAF — Engineering Handoff

> Read top-to-bottom before touching code. This reflects the app **as of the DGE
> work** (latest commit `33a5232`). It supersedes the earlier handoff.

---

## 1. What this is

**StudyMAF** is a private, static math/physics study web app a student is building
for this semester, served by **GitHub Pages at `studymaf.com`** (custom domain +
`CNAME`; HTTPS live).

- **Repo:** `https://github.com/arch-erickson/StudyMaf.git` · **Local:** `C:\Users\erick\StudyMaf`
- **Commit as:** `git -c user.name="arch-erickson" -c user.email="ericksoncabrera39@gmail.com" commit -m "..."`
  (end commit messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)
- **Platform:** Windows 11, PowerShell + Git Bash. Node available. `pdftotext` (poppler) available. **No `pip`.**

### Governing principle (do not violate)
**The AI/code fills in data; the code owns the structure.** Lessons are JSON under
`/data/lessons/` conforming to `/data/lesson.schema.json`. The page reads JSON and
renders it. **Never bake lesson text into HTML.**

### Hard MVP constraints (the served site)
- **No backend, APIs, keys, or database.** Everything client-side (`localStorage`).
- **No external requests.** Everything **vendored** under `/vendor/` (KaTeX, MathLive, Inter). `.nojekyll` present.
- Soft access gate only (password `studymaf`; not real security).

### Working agreement
- Commit in **small, verified chunks; push after each.** The student watches commits land.
- **Verify in the browser before claiming done.** They test on a real **iPad** (Safari) — many bugs are iPad-specific.
- Be honest about what's stubbed vs working. Vendor anything new; never add a CDN/fetch.
- Big work ships in **committed stages**, not one giant unverified change.

---

## 2. Repo layout (committed vs local)

```
index.html  styles.css  CNAME  .nojekyll        served app (one CSS file, appended over time)
data/
  lesson.schema.json   index.json   classes.json   README.md
  lessons/phys1442-01..14-*.json   sample.json
js/  gate icons store math figures calculator notebook generators app   (load order matters)
vendor/  fonts katex mathlive
DIAGRAM_RULES.md                                  rules the figure engine + authors follow
tools/                                            BACKEND / AUTHORING (Node) — committed
  build-class-corpus.js        PDF -> per-chapter text chunks + manifest (AI-tutor ingest)
  build-visual-library.js      downloads icon libs + writes authored SVGs + builds asset-index
  visual-library/authored*.js  152 StudyMAF-authored STEM SVGs (source of truth, as data)
  dge/  palette assets geometry dge (+README)     Diagram Generation Engine
  build-dge-examples.js         renders demo diagrams
Classes/                                          GITIGNORED — local class source material
  PHYS 1442/  PHYS1442.pdf, University-Physics-Vol2/3.pdf, corpus/   (read locally by the AI)
studymaf-visual-library/                          GITIGNORED — the built asset library (22k SVGs)
```

Two big trees are **gitignored + reproducible** so they never bloat the Pages repo:
`Classes/` (syllabus + textbook PDFs + generated corpus) and `studymaf-visual-library/`
(the icon/graphic library + `asset-index.json`). Their *tooling* is committed under
`tools/`. **The textbook PDFs were purged from git history** (force-push) after being
accidentally committed — keep them out of git.

`index.html` script order: `gate → icons → store → math → figures → calculator →
notebook → generators → app`. KaTeX/MathLive load `defer`; MathLive fonts dir set on
DOMContentLoaded.

---

## 3. Classes, join codes & grading  (NEW this session)

The app moved from "students upload a syllabus" to a **professor-publishes / student-joins-by-code** model.

- **`data/classes.json`** — a catalog of joinable classes keyed by a **join code**
  (`PHYS1442`). Each class lists its lessons with the **textbook chapter reference**
  and the **exact OpenStax problem numbers** the syllabus assigns that week. The
  *length* of each lesson's `problems` array is that lesson's **grade target**.
- **Student dashboard "Add class"** is now **"Enter a class code"** (live preview +
  validation) — `openJoinClass()` in `app.js`. The professor dashboard that *publishes*
  classes is future work.
- **Grading** (`js/store.js` + `app.js`): each lesson shows a **grade out of its
  syllabus count** (e.g. `3/6`); **EXP keeps growing past the target** so repeating for
  practice is unlimited. The class page shows **Total XP** and **overall completion**;
  dashboard cards show completion + XP. Classes carry `code / lessonTargets / chapters`;
  existing installs **backfill** catalog metadata on load (`reconcilePhysLessons`).
- Store methods: `lessonGrade`, `lessonSolved`, `classExp`, `classCompletion`, `setClassCatalog`.
  `markProblemDone` increments a `solved` counter (grade) + `xp` (unbounded).

---

## 4. THE QUESTION ENGINE (`js/generators.js`) — all 14 lessons authored

Replaces static problem lists. `Generators.register(lessonId, {easy:[fn…], medium, hard, extreme})`;
each fn returns a fresh `numeric | mc | multi` instance (same style, new numbers, answer +
worked `steps[]` computed together). `Generators.make(lid, difficulty)`, `.has(lid)`,
`.difficulties(lid)`.

- **Every one of the 14 PHYS 1442 lessons now has generators** modeling the **exact
  OpenStax problems the syllabus assigns** (extracted from the textbook PDFs via
  `pdftotext`). Difficulty follows each problem's real complexity. **Per-lesson generator
  count equals the syllabus problem count** (6,8,9,9,9,9,9,11,11,10,13,9,8,11).
- Each instance carries a **`source` tag** (e.g. `"Vol. 2, Ch. 5 · Problem 43"`), shown
  as a chip in the session via `S(inst, source)`.
- `sig(x)` formats clean 3-sig-fig display. Builders: `num/mc/multi`, `rpick`, `S`.
- **PGE behavior unchanged:** wrong answer → show solution → "Try another" regenerates a
  **new instance of the same difficulty** until correct. Session plan in
  `startGenSession` (`app.js`): 2 easy / 2 med / 2 hard / 1 extreme, resume via `genSlot`;
  single-difficulty runs (from the difficulty picker) don't disturb the mixed-resume slot.
- **Difficulty picker** + per-question **Tutorial** (worked example, step-by-step) live in
  the lesson panel / question tools.

Future (AI stage): an AI generator feeding the **same instance shape** into `make()` so the
session UI never changes; adaptive difficulty. The `tools/build-class-corpus.js` output is
the retrieval source for that (see §7).

---

## 5. Read-concepts reader & the figure engine

- **Concept reader** (`conceptReader` in `app.js`) is a **full-screen guided reader** with
  its own **X**. Definitions open in a **dockable right-side panel** (own X, replaced when
  you click another term) so concept + definition read side-by-side. Keywords are
  dotted-underlined & clickable across **all** lessons (glossary in the JSON). Concept
  levels can carry **`math_steps`** — a step-by-step "in relation to the math" breakdown
  (schema updated to allow it). `openDefinition()` routes to the dock when open, else the
  old overlay.
- **`js/figures.js`** (`window.Figures`) renders declarative figures: `schematic` (SVG),
  `coordinate-plane`, `number-line`. Governed by **`DIAGRAM_RULES.md`**:
  - `Figures.colors` — standard notation colors; `Figures.LIB` — 14 reusable detailed
    components (`kind:"component"`, e.g. balloon, car, dome, gaussian sphere/cylinder…).
  - Arrows/annotations forced to **50% opacity**; **animations validated to 5–10 frames**.
- **Content status:** all 14 lessons authored (concepts + 3 examples + videos + problems).
  Lessons **1–3 enriched** with per-concept diagrams, glossary, `math_steps`, animations.
  **Lessons 4–14 still need that concept enrichment** (diagrams/glossary/math_steps) — their
  *questions* are done, their *reader* content is the older baseline.

---

## 6. Calculator / notebook (unchanged core, recent fixes)

Calculator (`js/calculator.js`) = Desmos-style MathLive dock (sci + graph + notepad).
Recent fixes this session: the in-progress equation **survives main/abc/func tab switches**;
a **"Graphing" target chip** shows when the keypad types into a graph row; **smoother
title-bar dragging** that **collapses to a PiP edge tab** when dragged ~10% off-screen (the
tab can be **dragged along the edge**; a clean click expands it); reopening from the header
**un-snaps** instead of orphaning the tab. Notebook (`js/notebook.js`) is the iPad-first
scratch surface (see old notes in git history if needed).

Immersive full-screen exit is now an **icon-only collapse button**.

---

## 7. Backend/authoring tooling  (`tools/`, committed; outputs gitignored)

All three are Node, run locally, produce **gitignored + reproducible** artifacts.

### `tools/build-class-corpus.js`  — PDF → per-lesson text
Splits the OpenStax PDFs (in `Classes/PHYS 1442/`) into small **per-chapter** and
**per-chapter-problems** `.txt` sections + a **`manifest.json`** mapping each lesson to
its slice. This is the architecture for the future **AI tutor / AI question-gen**: at
runtime the AI fetches `corpus/<file>` for the current lesson (a few KB) instead of a
700-page book. Handles the two-column layout + form-feed page markers. Run: `node tools/build-class-corpus.js`.

### `tools/build-visual-library.js`  — the visual asset library
Builds `studymaf-visual-library/` — a searchable bank of SVG assets the DGE composes from.
`node tools/build-visual-library.js [--download]`.
- **Mono icon sets** (recolorable): Phosphor (9,072, MIT), Tabler (6,184, MIT), Lucide
  (2,025, ISC), Iconoir (1,671, MIT).
- **Colored/shaded** (the "feels-3D" look): icons8 flat-color-icons (MIT) + **Bioicons**
  chemistry + non-biology illustration categories (per-icon CC/MIT — **no biology**).
- **152 StudyMAF-authored** mono `currentColor` STEM primitives (math/physics/eng/arch/
  diagram-components) — source of truth lives as data in `tools/visual-library/authored*.js`.
- **Distributor:** every leaf subcategory (`physics/optics`, …) is filled to **≥100**
  relevant graphics by keyword-matching the pool and copying in (named `<id>__<origin>.svg`
  so attribution survives). Tune `SUBCATS`.
- **`asset-index.json`** (~22.9k records): `{id,file,category,tags,subjects,source,license}`.
  `subjects` routing (+ a keyword booster) lifts every top-level subject past 100.

### `tools/dge/`  — Diagram Generation Engine (DGE)  ← current focus
A **spec-driven** Node engine that composes ONE self-contained SVG from the library, so a
class's diagrams are generated then the library is offloaded. Pipeline:
1. **place library graphics** (recolor mono to the diagram's muted palette; keep colored
   illustrations as-is) — skippable for abstract diagrams;
2. **annotations/symbols/text** sized to fit and **collision-avoided** (`geometry.placeNear`);
   fixed/consistent annotation colors (`palette.ANNOT` — generic arrow one neutral; semantic
   vectors keep role color; **charge signs red/blue**, bare `+/−` neutral, circled `⊕/⊖`=charge);
3. **extra marks** (callouts, guides) preserving spacing.
Files: `palette.js` (ANNOT + muted PALETTES), `assets.js` (index search + parse + recolor —
note it **preserves the root `<svg>` presentation attrs** when inlining, else line art fills
black; exact whole-id search match wins), `geometry.js`, `dge.js` (`Diagram` + `render(spec)`).
`render(spec)` turns a JSON spec (what the AI stage will emit) into `<svg…>`. Demos:
`node tools/build-dge-examples.js` → `studymaf-visual-library/_dge-examples/_gallery.html`
(5 diagrams: motion / electrostatics / optics / calculus / chemistry — all verified for no
unintended text↔object intersection). See `tools/dge/README.md` for the spec format.

---

## 8. Running & testing locally

`.claude/launch.json` defines a **static preview** (`studymaf-static`, `autoPort:true`, no
hardcoded port). Start it with `preview_start {name:"studymaf-static"}`; it serves the repo
root (so gitignored preview HTML like the DGE gallery is reachable at
`/studymaf-visual-library/_dge-examples/_gallery.html`).

- **Gate:** `sessionStorage.setItem('studymaf.gate.ok','1')` to skip the password in tests.
- **Re-seed:** `localStorage.removeItem('studymaf.v1')` + reload (re-seeds the PHYS 1442
  class with catalog metadata). The seeded class code is `PHYS1442`; its id is generated —
  find it via `Store.classes()`.
- Verify with `javascript_tool` DOM assertions + `read_console_messages {onlyErrors:true}`.
  Screenshots sometimes fail ("pane not compositing") — retry or fall back to DOM checks /
  `SendUserFile` a rendered gallery.
- Always `node --check js/<file>.js` (and `tools/**`) after edits. For big JS blocks, write
  the replacement to scratchpad and splice with a Node script (heredocs mangle `\` / `#`).

### Known gotchas
- `[hidden]` loses to a class with `display:flex/grid` — add `.thing[hidden]{display:none!important}`.
- Windows CRLF warnings on commit are harmless. `rm -rf` of a fresh git clone can be slow / "device busy" — retry.
- Git pushes sometimes need `git pull --rebase origin main` first.
- Do **not** re-commit `Classes/` or `studymaf-visual-library/` (gitignored on purpose).

---

## 9. Next steps / backlog (roughly prioritized)

1. **DGE animation** — the agreed next feature: keyframe an existing DGE diagram/spec
   (move the velocity arrow, grow the field, sweep the area). The composer already keeps
   **content / annotation / label layers separate** to make this an *added ability*, not a
   rewrite. Likely ties into `figures.js` frame cycling or a new keyframe spec.
2. **DGE hardening while testing:** tighter search ranking for ambiguous queries (prefer the
   right colored/mono register), auto-fit/crop canvas to content, smarter anchoring for long
   labels. Then wire the DGE to actually **generate the PHYS 1442 lesson diagrams**.
3. **Enrich lessons 4–14 reader content** (per-concept diagrams + glossary + `math_steps`),
   as done for 1–3.
4. **Professor dashboard** — publish a class (lessons, chapter refs, problem sets, materials)
   → emits a join code into the catalog. Student side already consumes it.
5. **AI stage** (needs the backend the MVP intentionally excludes — ship as clearly-labeled
   "coming soon"): AI question-gen feeding the same `numeric|mc|multi` shape; lesson-aware
   tutor reading the `corpus/` slices; syllabus/homework → generated lessons; adaptive/test
   analysis using the Notebook's handwritten work; the "Online tutor" `TUTOR_URL` link.

---

## 10. Persistent memory

Cross-session memory lives in the assistant's memory dir (indexed in `MEMORY.md`). Keep it
and this handoff current as work progresses.
