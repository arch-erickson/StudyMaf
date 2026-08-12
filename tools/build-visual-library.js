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
  sh("npm", ["pack", "@phosphor-icons/core", "@tabler/icons", "lucide-static", "iconoir"], { cwd: tmp, stdio: "ignore" });
  const grab = (prefix, innerRel, destRel) => {
    const tgz = fs.readdirSync(tmp).find(f => f.startsWith(prefix) && f.endsWith(".tgz")); if (!tgz) return;
    const pdir = path.join(tmp, "pkg"); fs.rmSync(pdir, { recursive: true, force: true }); fs.mkdirSync(pdir);
    sh("tar", ["xzf", path.join(tmp, tgz), "-C", pdir, "--strip-components=1"], { stdio: "ignore" });
    const inner = path.join(pdir, innerRel); if (fs.existsSync(inner)) copyDir(inner, path.join(LIB, destRel));
  };
  grab("phosphor-icons-core", "assets", "core/phosphor");   // MIT, mono, all weights
  grab("tabler-icons", "icons", "core/tabler");             // MIT, mono, outline + filled
  grab("lucide-static", "icons", "core/lucide");            // ISC, mono
  grab("iconoir", "icons", "core/iconoir");                 // MIT, mono, regular + solid
  const fci = path.join(tmp, "fci");                         // icons8 flat-color-icons — colored (MIT)
  sh("git", ["clone", "--depth", "1", "https://github.com/icons8/flat-color-icons.git", fci], { stdio: "ignore" });
  if (fs.existsSync(path.join(fci, "svg"))) copyDir(path.join(fci, "svg"), path.join(LIB, "core", "flat-color-icons"));
  fs.rmSync(tmp, { recursive: true, force: true });
  log("core: phosphor + tabler + lucide + iconoir + flat-color-icons installed");
}
// Bioicons — the colored/shaded scientific-illustration aesthetic. Chemistry
// categories go to chemistry/; the professional NON-biology categories go to
// illustrations/ so the other subjects gain the same look. Biology is skipped.
const BIO_CHEM = ["Chemistry", "Lab_apparatus", "Molecular_modelling"];
const BIO_ILLUS = ["General_items", "People-Other", "Scientific_graphs", "Safety_symbols", "Machine_Learning", "Computer_hardware", "Imaging", "Nanotechnology", "Procedures"];
function downloadBioicons() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "smaf-bio-"));
  log("cloning bioicons (chemistry + professional non-biology) …");
  sh("git", ["clone", "--depth", "1", "https://github.com/duerrsimon/bioicons.git", tmp], { stdio: "ignore" });
  const icons = path.join(tmp, "static", "icons");
  const licDirs = { "cc-0": "CC0-1.0", "cc-by-3.0": "CC-BY-3.0", "cc-by-4.0": "CC-BY-4.0", "cc-by-sa-3.0": "CC-BY-SA-3.0", "cc-by-sa-4.0": "CC-BY-SA-4.0", "mit": "MIT", "bsd": "BSD" };
  const walk = (dir, cb) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, cb); else if (e.name.endsWith(".svg")) cb(p, e.name); } };
  function importSet(cats, outBase) {
    const manifest = {}; let n = 0;
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
    return n;
  }
  const nc = importSet(BIO_CHEM, path.join(LIB, "chemistry", "bioicons"));
  const ni = importSet(BIO_ILLUS, path.join(LIB, "illustrations", "bioicons"));
  fs.rmSync(tmp, { recursive: true, force: true });
  log("bioicons: " + nc + " chemistry + " + ni + " professional non-biology illustrations");
}
function copyDir(src, dst) { fs.mkdirSync(dst, { recursive: true }); for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s = path.join(src, e.name), d = path.join(dst, e.name); if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d); } }

// ------------------------------------------------ distribute into subcategories
// Every leaf subcategory should carry ~100+ on-topic professional graphics. We
// keyword-match the big icon pool (phosphor/tabler/lucide/iconoir/flat-color +
// colored illustrations) and copy relevant assets into each subcategory folder,
// keeping the StudyMAF-authored primitives. Copies are named `<id>__<origin>.svg`
// so attribution survives and different libraries' same-named icons don't clash.
const SUB_TARGET = 100;
const AA = "\\b"; // word-ish boundary against the normalized "id" string
const R = (s) => new RegExp(s, "i");
// per-subcategory keyword tiers (primary -> broader). A shared fallback is appended.
const SUBCATS = {
  "diagram-components/arrows": [R("arrow|chevron|caret|pointer|triangle-right|move|corner"), R("direction|navigation|swap|refresh|redo|undo")],
  "diagram-components/dimensions": [R("ruler|dimension|measure|straighten|caliper|meter|scale|size|length"), R("line|distance|width|height|border")],
  "diagram-components/labels": [R("tag|label|bookmark|note|sticker|pin|text|badge|caption|title"), R("flag|marker|comment|price")],
  "diagram-components/callouts": [R("chat|message|bubble|callout|comment|balloon|speech|quote|annotation"), R("info|help|alert|notification|dialog")],
  "diagram-components/axes": [R("axis|chart|graph|coordinate|analytics|plot|trend"), R("grid|line|presentation|activity|stats")],
  "diagram-components/grids": [R("grid|table|layout|matrix|squares|dots|cells|columns|rows"), R("frame|border|apps|dashboard|window")],
  "mathematics/algebra": [R("function|variable|calculator|percent|plus|minus|divide|multiply|equal|sigma|sum|math|superscript|exponent"), R("number|abacus|dice|hash|braces|brackets")],
  "mathematics/geometry": [R("triangle|square|circle|rectangle|polygon|hexagon|pentagon|octagon|cube|shape|angle|cylinder|cone|sphere|diamond"), R("frame|corners|vector|line|ruler|grid")],
  "mathematics/trigonometry": [R("triangle|angle|wave|sine|protractor|compass|degree|rotate|circle|radius|arc"), R("shape|vector|corner|pi|function")],
  "mathematics/calculus": [R("function|curve|integral|infinity|trending|derivative|slope|chart-line|area|limit"), R("graph|chart|analytics|activity|wave|math")],
  "mathematics/graphs": [R("chart|graph|analytics|trending|plot|diagram|presentation|statistics|histogram|scatter|pie"), R("activity|report|dashboard|data|axis")],
  "mathematics/coordinate-systems": [R("grid|axis|coordinate|graph|crosshair|target|map-pin|vector|plane"), R("chart|map|compass|navigation|location")],
  "physics/mechanics": [R("car|truck|wheel|ball|gear|spring|weight|scale|pendulum|force|speed|engine|bicycle|rocket|anchor|dumbbell|barbell|hammer|balance|falling|domino|seesaw|lever|pulley"), R("arrow|move|motion|activity|drop|run|walk|sport")],
  "physics/electricity": [R("battery|bolt|lightning|plug|power|circuit|resistor|electric|charge|socket|flash|current|wire|lamp|bulb|energy"), R("zap|flash|light|cable|switch|outlet")],
  "physics/magnetism": [R("magnet|compass|horseshoe|north|pole|attract|field|loop"), R("circle|arrow|refresh|rotate|orbit|wave|target")],
  "physics/waves": [R("wave|waveform|sound|signal|vibration|ripple|frequency|radio|pulse|audio|sine|broadcast"), R("activity|volume|music|antenna|network|oscillat")],
  "physics/optics": [R("lens|glasses|eye|light|bulb|sun|prism|mirror|telescope|microscope|camera|focus|ray|rainbow|reflection|glass|flashlight"), R("view|visible|brightness|scan|search|aperture")],
  "physics/thermodynamics": [R("thermometer|temperature|fire|flame|heat|snowflake|cold|hot|gauge|steam|engine|piston|kelvin|celsius|degree"), R("sun|drop|energy|climate|weather|boiling")],
  "physics/fluids": [R("drop|droplet|water|liquid|flask|beaker|pipe|flow|bucket|tank|bottle|faucet|tap|pressure|wave|ocean"), R("cup|glass|fill|gauge|pump|container")],
  "physics/modern-physics": [R("atom|nucleus|radioactive|molecule|orbit|quantum|particle|electron|laser|radiation|nuclear|planet|star|galaxy"), R("science|physics|sparkle|comet|satellite|telescope")],
  "engineering/mechanical": [R("gear|cog|wrench|engine|motor|piston|bearing|shaft|screw|bolt|nut|spring|robot|drill|machine|turbine|fan|pump|conveyor"), R("tool|settings|cpu|hardware|automation|maintenance")],
  "engineering/structural": [R("beam|truss|column|frame|support|load|bridge|scaffold|steel|girder|structure|building|pillar"), R("box|grid|layers|stack|construction|crane")],
  "engineering/electrical": [R("battery|circuit|resistor|capacitor|plug|bolt|power|wire|chip|cpu|led|diode|transistor|socket|switch|current|antenna"), R("zap|flash|electronic|cable|component|board")],
  "engineering/civil": [R("building|bridge|road|crane|excavator|bulldozer|foundation|traffic|construction|pipe|dam|tunnel|barrier|cone|truck"), R("hardhat|brick|wall|map|route|infrastructure|city")],
  "architecture/plans": [R("door|window|stairs|wall|floor|room|layout|blueprint|plan|house|home|kitchen|bed|sofa|furniture|bath"), R("grid|frame|building|square|apartment|map")],
  "architecture/sections": [R("wall|layer|slab|section|building|floor|stack|foundation|layers"), R("box|frame|home|columns|grid|structure")],
  "architecture/elevations": [R("building|house|home|window|door|facade|skyscraper|apartment|tower|store|shop|hospital|bank|church"), R("city|estate|frame|structure|warehouse|garage")],
  "architecture/construction": [R("ruler|dimension|hammer|drill|construction|crane|hardhat|blueprint|measure|level|compass|tool|paint|brick|shovel|saw"), R("build|repair|maintenance|wrench|screw|nail")],
  "architecture/structural": [R("column|beam|frame|foundation|grid|support|building|pillar|structure"), R("box|layers|stack|square|scaffold|construction")]
};
const FALLBACK = R("arrow|chevron|circle|square|line|dot|shape|frame|grid|triangle|hexagon|corner|plus|minus|move"); // guarantees fill

function buildPool() {
  const pool = [];
  const relOf = (p) => path.relative(LIB, p).split(path.sep).join("/");
  const add = (base, srcOf) => { if (!fs.existsSync(base)) return; (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (e.name.endsWith(".svg") && !e.name.startsWith("_") && !e.name.includes("__")) pool.push({ abs: p, base: e.name.replace(/\.svg$/, ""), src: srcOf(p) }); } })(base); };
  add(path.join(LIB, "core"), p => { const s = relOf(p).split("/"); return s.length > 3 ? s[1] + "-" + s[2] : s[1]; });
  add(path.join(LIB, "illustrations"), p => "bioicons-" + relOf(p).split("/")[2]);
  add(path.join(LIB, "chemistry"), p => "chem-" + relOf(p).split("/")[2]);
  return pool;
}
function pickVariety(pool, re, cap) {
  const byBase = {};
  for (const a of pool) { const k = " " + a.base.toLowerCase().replace(/[-_]/g, " ") + " "; if (re.test(k)) (byBase[a.base] = byBase[a.base] || []).push(a); }
  const bases = Object.keys(byBase), out = []; let round = 0, added = true;
  while (out.length < cap && added) { added = false; for (const b of bases) { if (byBase[b][round]) { out.push(byBase[b][round]); added = true; if (out.length >= cap) break; } } round++; }
  return out;
}
function distribute() {
  const pool = buildPool();
  let total = 0, thin = [];
  for (const sub in SUBCATS) {
    const dir = path.join(LIB, sub); fs.mkdirSync(dir, { recursive: true });
    const have = new Set(fs.readdirSync(dir).filter(f => f.endsWith(".svg")));
    let count = have.size;
    const tiers = SUBCATS[sub].concat([FALLBACK]);
    for (const re of tiers) {
      if (count >= SUB_TARGET) break;
      for (const m of pickVariety(pool, re, SUB_TARGET * 2)) {
        if (count >= SUB_TARGET) break;
        const fname = m.base + "__" + m.src + ".svg";
        if (have.has(fname)) continue;
        try { fs.copyFileSync(m.abs, path.join(dir, fname)); have.add(fname); count++; total++; } catch (e) {}
      }
    }
    if (count < SUB_TARGET) thin.push(sub + "(" + count + ")");
  }
  log("distributed: " + total + " graphics into subcategories" + (thin.length ? "  under target: " + thin.join(", ") : "  — all ≥ " + SUB_TARGET));
}

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
    core: ["general"], illustrations: ["general"], "diagram-components": ["general", "diagram"]
  }[topDir] || ["general"];
}
// Bioicons category -> subjects, so colored illustrations are discoverable per subject.
const BIOICON_SUBJECTS = {
  Chemistry: ["chemistry"], Lab_apparatus: ["chemistry", "laboratory"], Molecular_modelling: ["chemistry"],
  General_items: ["general", "word-problems"], "People-Other": ["general", "word-problems"],
  Scientific_graphs: ["mathematics", "statistics"], Safety_symbols: ["chemistry", "general"],
  Machine_Learning: ["engineering", "computer-science"], Computer_hardware: ["engineering", "electrical"],
  Imaging: ["physics", "optics"], Nanotechnology: ["physics", "chemistry", "modern-physics"],
  Procedures: ["general", "laboratory"]
};
// Route genuinely-relevant objects from the big pro icon sets to STEM subjects by
// keyword, so each subject can be composed from real, on-aesthetic objects.
const SUBJECT_KEYWORDS = {
  physics: /\b(car|truck|bus|van|bicycle|bike|motorcycle|rocket|airplane|plane|jet|boat|ship|sail|train|wheel|tire|ball|soccer|basketball|football|tennis|baseball|bowling|pendulum|magnet|battery|lightning|bolt|thermometer|temperature|spring|scale|speed|speedometer|planet|orbit|satellite|atom|molecule|wave|lens|prism|light|bulb|flashlight|laser|sun|moon|star|clock|timer|stopwatch|gauge|drop|droplet|anchor|parachute|elevator|skateboard|hourglass|gravity|engine|fan|windmill|turbine|domino|dumbbell|barbell)\b/,
  engineering: /\b(gear|gears|cog|wrench|hammer|screw|screwdriver|nut|bolt|drill|saw|toolbox|tool|tools|engine|motor|robot|circuit|resistor|capacitor|cpu|chip|processor|microchip|plug|socket|crane|excavator|bulldozer|tractor|factory|pipe|valve|pump|conveyor|solder|wire|cable|antenna|radar|turbine|windmill|solar|panel|battery|lightning|ruler|caliper|blueprint|cog-wheel)\b/,
  architecture: /\b(building|buildings|house|home|door|window|stairs|staircase|bridge|crane|blueprint|ruler|office|warehouse|city|skyscraper|apartment|church|castle|hut|cabin|tent|garage|barn|column|wall|brick|bricks|roof|floor|elevation|fence|gate|ladder|hospital|bank|store|factory|lighthouse|tower|door-open|paint-roller|tape-measure|ruler-2)\b/,
  mathematics: /\b(chart|charts|graph|function|calculator|triangle|ruler|compass|protractor|percent|plus|minus|divide|equals|math|sigma|pi|infinity|angle|circle|square|cube|sphere|cylinder|cone|hexagon|pentagon|number|numbers|abacus|dice|coordinate|axis|vector|matrix|integral|shapes|ruler-2)\b/
};
function boostSubjects(id, subjects) {
  const out = new Set(subjects), k = " " + id.toLowerCase().replace(/[-_]/g, " ") + " ";
  for (const subj in SUBJECT_KEYWORDS) if (SUBJECT_KEYWORDS[subj].test(k)) { out.add(subj); if (subj !== "mathematics") out.add("word-problems"); }
  return [...out];
}
// icons8 flat-color-icons -> subjects by filename keyword.
function flatColorSubjects(id) {
  const k = id.toLowerCase(), s = new Set(["general"]);
  if (/graph|chart|statistic|pie|combo|scatter|area|flow|template|survey|process/.test(k)) s.add("mathematics");
  if (/idea|energy|electr|battery|flash|light|physic|charge|magnet|thermometer|temperature|clock|speed/.test(k)) s.add("physics");
  if (/settings|service|engineering|electronic|maintenance|automotive|gear|wrench|support|module|circuit/.test(k)) s.add("engineering");
  if (/home|shop|department|factory|library|museum|building|city|home_page/.test(k)) s.add("architecture");
  if (/flask|test_tube|biotech|biomass|lab|dna|microscope|medical/.test(k)) s.add("chemistry");
  return [...s];
}
// origin tag on a distributed copy (`<id>__<origin>.svg`) -> source + license
function originMeta(o) {
  if (/^phosphor/.test(o)) return { source: "phosphor", license: "MIT" };
  if (/^tabler/.test(o)) return { source: "tabler", license: "MIT" };
  if (/^iconoir/.test(o)) return { source: "iconoir", license: "MIT" };
  if (/^lucide/.test(o)) return { source: "lucide", license: "ISC" };
  if (/^flat-color/.test(o)) return { source: "flat-color-icons", license: "MIT" };
  if (/^bioicons|^chem/.test(o)) return { source: "bioicons", license: "CC-BY-4.0" };
  return { source: "studymaf", license: "MIT" };
}
function buildIndex() {
  const chemLic = readJSON(path.join(LIB, "chemistry", "bioicons", "_licenses.json")) || {};
  const illusLic = readJSON(path.join(LIB, "illustrations", "bioicons", "_licenses.json")) || {};
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
      let id = e.name.replace(/\.svg$/, "");
      const category = seg.slice(1, -1).join("/") || top;
      let source = top, license = "MIT", subjects = domainSubjects(top);
      const us = id.indexOf("__");
      if (us >= 0) {
        // a graphic distributed into a subcategory folder — keep its origin attribution
        const origin = id.slice(us + 2); id = id.slice(0, us);
        const m = originMeta(origin); source = m.source; license = m.license;
        subjects = Array.from(new Set(domainSubjects(top).concat(seg[1] ? [seg[1]] : [], boostSubjects(id, []))));
      } else if (top === "core") {
        source = seg[1]; license = source === "lucide" ? "ISC" : "MIT";
        if (source === "flat-color-icons") subjects = flatColorSubjects(id);
        if (["phosphor", "tabler", "iconoir", "lucide", "flat-color-icons"].includes(source)) subjects = boostSubjects(id, subjects);
      } else if (top === "chemistry" || top === "illustrations") {
        source = "bioicons";
        license = (top === "chemistry" ? chemLic : illusLic)[seg.slice(2).join("/")] || "CC-BY-4.0";
        subjects = BIOICON_SUBJECTS[seg[2]] || subjects;
      } else { source = "studymaf"; }
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
  if (download) { downloadCore(); downloadBioicons(); }
  else if (!fs.existsSync(path.join(LIB, "core", "phosphor"))) {
    log("(core icons not present — run with --download to fetch phosphor/tabler/bioicons)");
  }
  writeAuthored();
  distribute();
  buildIndex();
  log("\nStudyMAF visual library ready at " + path.relative(ROOT, LIB) + "  (gitignored; reproducible via this script)");
}
try { main(); } catch (e) { console.error("build-visual-library failed:", e.message); process.exit(1); }
