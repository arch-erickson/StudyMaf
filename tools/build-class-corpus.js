#!/usr/bin/env node
/* StudyMAF — class corpus builder (offline / "backend" step).
 *
 * WHY: the AI tutor and AI question-generation stages must NOT load a whole
 * 700-page textbook per request. This tool digests the source PDFs ONCE into
 * small per-chapter (and per-chapter "problems") text sections plus a manifest
 * that maps each lesson to exactly the slice it needs. At runtime the AI fetches
 * only `corpus/<file>` for the current lesson — a few KB — never the full book.
 *
 * The PDFs live under the class folder (later: object storage / a real backend).
 * Output lands in `Classes/<CLASS>/corpus/`, which is gitignored — it is derived,
 * local, and must never bloat the static site.
 *
 * Requires `pdftotext` (poppler) on PATH. Run:  node tools/build-class-corpus.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CLASS_DIR = path.join(ROOT, "Classes", "PHYS 1442");
const OUT_DIR = path.join(CLASS_DIR, "corpus");

// Which PDF backs each volume, and how to find chapter starts in its extracted text.
// v2 uses "CHAPTER N" body headers; v3 uses standalone chapter-title lines.
const VOLUMES = {
  2: {
    pdf: "university-physics-volume-2_-_WEB.pdf",
    txt: "_vol2.txt",
    chapterStarts: (lines) => detectByRegex(lines, /^CHAPTER (\d+)$/, 500) // ignore the table-of-contents copies up top
  },
  3: {
    pdf: "university-physics-volume-3_-_WEB.pdf",
    txt: "_vol3.txt",
    // ch5 ("Relativity") is only a sentinel so chapter 4's slice ends correctly.
    chapterTitles: { 1: "The Nature of Light", 2: "Geometric Optics and Image Formation", 3: "Interference", 4: "Diffraction", 5: "Relativity" },
    chapterStarts: (lines, vol) => detectByTitles(lines, vol.chapterTitles)
  }
};

function log(m) { process.stdout.write(m + "\n"); }

// ---- extraction ----
function ensureText(vol) {
  const pdf = path.join(CLASS_DIR, vol.pdf);
  if (!fs.existsSync(pdf)) throw new Error("Missing PDF: " + pdf);
  const txt = path.join(OUT_DIR, vol.txt);
  if (!fs.existsSync(txt)) {
    log("  extracting " + vol.pdf + " …");
    execFileSync("pdftotext", ["-layout", pdf, txt], { stdio: "ignore" });
  }
  return fs.readFileSync(txt, "utf8").split(/\r?\n/);
}

// ---- chapter boundary detection ----
// Body chapter headers, ignoring the early table-of-contents duplicates.
function detectByRegex(lines, re, minLine) {
  const starts = {};
  // pdftotext prefixes page-break lines with a form-feed (\f); strip it before matching.
  lines.forEach((ln, i) => { const m = ln.replace(/\f/g, "").trim().match(re); if (m && i >= minLine) starts[+m[1]] = i; }); // last (body) wins
  return starts;
}
// Chapter title lines, taken in order so a forward-reference to a later chapter's
// title doesn't get mistaken for that chapter's start.
function detectByTitles(lines, titles) {
  const nums = Object.keys(titles).map(Number).sort((a, b) => a - b);
  const starts = {}; let from = 0;
  for (const n of nums) {
    const t = titles[n];
    let at = -1;
    for (let i = from; i < lines.length; i++) { if (lines[i].trim() === t) { at = i; break; } }
    if (at < 0) throw new Error("v3 chapter title not found: " + t);
    starts[n] = at; from = at + 1;
  }
  return starts;
}

// slice [startLine, endLine) of a chapter, given the ordered start map
function chapterSlice(lines, starts, n) {
  const all = Object.keys(starts).map(Number).sort((a, b) => a - b);
  const s = starts[n]; if (s == null) return null;
  const next = all.find((k) => starts[k] > s);
  const e = next != null ? starts[next] : lines.length;
  return lines.slice(s, e);
}
// the end-of-chapter "Problems" section (from its heading to the chapter end)
function problemsSlice(chapterLines) {
  // the heading is "Problems" alone or, thanks to the two-column layout, followed
  // by a wide gap and bleed-over text from the next column.
  const i = chapterLines.findIndex((l) => /^\s*Problems(\s{2,}|\s*$)/.test(l.replace(/\f/g, "")));
  return i >= 0 ? chapterLines.slice(i) : null;
}

// ---- catalog: expand each lesson's chapter reference into {vol, chapters[]} ----
function parseChapterRef(ref) {
  const vm = ref.match(/Vol\.\s*(\d+)/i); const cm = ref.match(/Ch\.\s*([\d,\s-]+)/i);
  if (!vm || !cm) return null;
  const vol = +vm[1]; const chapters = [];
  cm[1].split(",").forEach((part) => {
    const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
    if (r) { for (let k = +r[1]; k <= +r[2]; k++) chapters.push(k); }
    else if (part.trim()) chapters.push(+part.trim());
  });
  return { vol, chapters };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "classes.json"), "utf8"));
  const cls = (catalog.classes || []).find((c) => c.code === "PHYS1442");
  if (!cls) throw new Error("PHYS1442 not in data/classes.json");

  const cache = {};   // vol number -> lines
  const written = {}; // "vol:ch" -> {chapterFile, problemsFile}
  const manifest = { class: cls.code, name: cls.name, generatedAt: new Date().toISOString(), lessons: {} };

  for (const lesson of cls.lessons) {
    const ref = parseChapterRef(lesson.chapter);
    if (!ref) { log("! could not parse chapter for " + lesson.id + " (" + lesson.chapter + ")"); continue; }
    const vol = VOLUMES[ref.vol];
    if (!cache[ref.vol]) { log("Volume " + ref.vol + ":"); cache[ref.vol] = ensureText(vol); }
    const lines = cache[ref.vol];
    const starts = vol.chapterStarts(lines, vol);

    const files = [], problems = [];
    for (const ch of ref.chapters) {
      const key = ref.vol + ":" + ch;
      if (!written[key]) {
        const chLines = chapterSlice(lines, starts, ch);
        if (!chLines) { log("  ! chapter " + ch + " not found in vol " + ref.vol); continue; }
        const base = "vol" + ref.vol + "-ch" + String(ch).padStart(2, "0");
        const chFile = base + ".txt";
        fs.writeFileSync(path.join(OUT_DIR, chFile), chLines.join("\n"));
        const probLines = problemsSlice(chLines);
        let probFile = null;
        if (probLines) { probFile = base + "-problems.txt"; fs.writeFileSync(path.join(OUT_DIR, probFile), probLines.join("\n")); }
        written[key] = { chapterFile: chFile, problemsFile: probFile, lines: chLines.length };
        log("  wrote " + chFile + (probFile ? " + " + probFile : "") + " (" + chLines.length + " lines)");
      }
      files.push(written[key].chapterFile);
      if (written[key].problemsFile) problems.push(written[key].problemsFile);
    }
    manifest.lessons[lesson.id] = {
      chapter: lesson.chapter,
      assignedProblems: lesson.problems,
      chapterFiles: files,
      problemFiles: problems
    };
  }

  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  log("\nmanifest.json written for " + Object.keys(manifest.lessons).length + " lessons → " + path.relative(ROOT, OUT_DIR));
  log("At runtime the AI reads corpus/<file> for the current lesson only — never the whole book.");
}

try { main(); } catch (e) { console.error("build-class-corpus failed:", e.message); process.exit(1); }
