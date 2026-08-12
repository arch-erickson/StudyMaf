#!/usr/bin/env node
/* StudyMAF — visual asset library builder (backend/authoring resource).
 *
 * Builds studymaf-visual-library/: a local, searchable bank of SVG assets the
 * diagram engine composes class diagrams from — then offloads until needed. The
 * whole output dir is gitignored (large + reproducible); THIS script + the
 * tools/visual-library/authored-*.js modules are the committed source of truth.
 *
 * Usage:
 *   node tools/build-visual-library.js            # write authored SVGs + rebuild asset-index.json
 *   node tools/build-visual-library.js --download # also (re)download core icons + chemistry
 *
 * Sources:
 *   core/phosphor  @phosphor-icons/core  (MIT)   — general objects (cars, people, tools…)
 *   core/tabler    @tabler/icons         (MIT)   — technical/diagram primitives
 *   chemistry/*    bioicons (chemistry only)      — per-icon CC/MIT (see _licenses.json)
 *   mathematics/physics/engineering/architecture/diagram-components — StudyMAF-authored
 */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const LIB = path.join(ROOT, "studymaf-visual-library");
const { AUTHORED } = require("./visual-library/authored.js");
const { PHYSICS } = require("./visual-library/authored-physics.js");
const { ENG_ARCH } = require("./visual-library/authored-eng-arch.js");

function log(m) { process.stdout.write(m + "\n"); }
function sh(cmd, args, opts) { return execFileSync(cmd, args, Object.assign({ stdio: "inherit" }, opts)); }

// ---------------------------------------------------------------- authored SVGs
function writeAuthored() {
  const all = Object.assign({}, AUTHORED, PHYSICS, ENG_ARCH);
  let n = 0;
  for (const rel in all) {
    const dest = path.join(LIB, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, all[rel].trim() + "\n");
    n++;
  }
  log("authored: wrote " + n + " StudyMAF SVGs");
  return n;
}

// ---------------------------------------------------------------- core downloads
function downloadCore() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "smaf-vl-"));
  log("downloading core icons into " + tmp + " …");
  sh("npm", ["pack", "@phosphor-icons/core", "@tabler/icons"], { cwd: tmp, stdio: "ignore" });
  for (const f of fs.readdirSync(tmp)) {
    if (f.startsWith("phosphor-icons-core")) { sh("tar", ["xzf", f], { cwd: tmp, stdio: "ignore" }); }
  }
  // phosphor tarball extracts to package/; tabler to package/ too — extract separately
  const phos = path.join(tmp, "package", "assets");
  if (fs.existsSync(phos)) { copyDir(phos, path.join(LIB, "core", "phosphor")); }
  fs.rmSync(path.join(tmp, "package"), { recursive: true, force: true });
  for (const f of fs.readdirSync(tmp)) { if (f.startsWith("tabler-icons")) sh("tar", ["xzf", f], { cwd: tmp, stdio: "ignore" }); }
  const tab = path.join(tmp, "package", "icons");
  if (fs.existsSync(tab)) { copyDir(tab, path.join(LIB, "core", "tabler")); }
  fs.rmSync(tmp, { recursive: true, force: true });
  log("core: phosphor + tabler installed");
}
function downloadChemistry() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "smaf-bio-"));
  log("cloning bioicons (chemistry only) …");
  sh("git", ["clone", "--depth", "1", "https://github.com/duerrsimon/bioicons.git", tmp], { stdio: "ignore" });
  const icons = path.join(tmp, "static", "icons");
  const licDirs = { "cc-0": "CC0-1.0", "cc-by-3.0": "CC-BY-3.0", "cc-by-4.0": "CC-BY-4.0", "cc-by-sa-3.0": "CC-BY-SA-3.0", "cc-by-sa-4.0": "CC-BY-SA-4.0", "mit": "MIT", "bsd": "BSD" };
  const cats = ["Chemistry", "Lab_apparatus", "Molecular_modelling"];   // chemistry only — NO biology
  const outBase = path.join(LIB, "chemistry", "bioicons");
  const manifest = {}; let n = 0;
  const walk = (dir, cb) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, cb); else if (e.name.endsWith(".svg")) cb(p, e.name); } };
  for (const lic in licDirs) for (const cat of cats) {
    const dir = path.join(icons, lic, cat); if (!fs.existsSync(dir)) continue;
    const odir = path.join(outBase, cat); fs.mkdirSync(odir, { recursive: true });
    walk(dir, (p, name) => {
      let dest = path.join(odir, name), i = 1;
      while (fs.existsSync(dest) && fs.readFileSync(dest, "utf8") !== fs.readFileSync(p, "utf8")) dest = path.join(odir, name.replace(/\.svg$/, "-" + (i++) + ".svg"));
      fs.copyFileSync(p, dest); manifest[cat + "/" + path.basename(dest)] = licDirs[lic]; n++;
    });
  }
  fs.writeFileSync(path.join(outBase, "_licenses.json"), JSON.stringify(manifest));
  fs.rmSync(tmp, { recursive: true, force: true });
  log("chemistry: " + n + " bioicons svgs (chemistry categories only)");
}
function copyDir(src, dst) { fs.mkdirSync(dst, { recursive: true }); for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s = path.join(src, e.name), d = path.join(dst, e.name); if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d); } }

// ---------------------------------------------------------------- asset index
const STOP = new Set(["icon", "svg", "the", "and", "of"]);
function tagsFrom(id, extra) {
  const parts = String(id).split(/[-_ ]+/).map(s => s.toLowerCase()).filter(s => s && !STOP.has(s) && s.length > 1);
  return Array.from(new Set(parts.concat(extra || [])));
}
function domainSubjects(topDir) {
  return {
    mathematics: ["mathematics", "calculus", "word-problems"], physics: ["physics"],
    engineering: ["engineering"], architecture: ["architecture"], chemistry: ["chemistry"],
    core: ["general"], "diagram-components": ["general", "diagram"]
  }[topDir] || ["general"];
}
function buildIndex() {
  const chemLic = readJSON(path.join(LIB, "chemistry", "bioicons", "_licenses.json")) || {};
  const assets = [];
  const walk = (abs) => {
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      if (e.name.startsWith("_") || e.name === "LICENSE") continue;
      const p = path.join(abs, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith(".svg")) continue;
      const rel = path.relative(LIB, p).split(path.sep).join("/");
      const seg = rel.split("/");
      const top = seg[0];
      const id = e.name.replace(/\.svg$/, "");
      const category = seg.slice(1, -1).join("/") || top;
      let source = top, license = "MIT";
      if (top === "core") { source = seg[1]; license = "MIT"; }
      else if (top === "chemistry") { source = "bioicons"; license = chemLic[seg.slice(2).join("/")] || "CC-BY-4.0"; }
      else { source = "studymaf"; license = "MIT"; }
      const subjects = domainSubjects(top);
      const extra = seg.slice(1, -1).flatMap(s => s.toLowerCase().split(/[-_ ]+/));
      assets.push({ id, file: rel, category, tags: tagsFrom(id, extra).slice(0, 12), subjects, source, license });
    }
  };
  walk(LIB);
  assets.sort((a, b) => a.file.localeCompare(b.file));
  const bySource = {};
  assets.forEach(a => { bySource[a.source] = (bySource[a.source] || 0) + 1; });
  const index = { generatedAt: new Date().toISOString(), count: assets.length, bySource, assets };
  fs.writeFileSync(path.join(LIB, "asset-index.json"), JSON.stringify(index, null, 0) + "\n");
  log("index: " + assets.length + " assets → asset-index.json  " + JSON.stringify(bySource));
}
function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return null; } }

// ---------------------------------------------------------------- main
function main() {
  fs.mkdirSync(LIB, { recursive: true });
  const download = process.argv.includes("--download");
  if (download) { downloadCore(); downloadChemistry(); }
  else if (!fs.existsSync(path.join(LIB, "core", "phosphor"))) {
    log("(core icons not present — run with --download to fetch phosphor/tabler/bioicons)");
  }
  writeAuthored();
  buildIndex();
  log("\nStudyMAF visual library ready at " + path.relative(ROOT, LIB) + "  (gitignored; reproducible via this script)");
}
try { main(); } catch (e) { console.error("build-visual-library failed:", e.message); process.exit(1); }
