#!/usr/bin/env node
/* StudyMAF — build the SUBJECT-SPECIFIC visual libraries the DGE composes from.
 *
 * Each subject (physics, calculus, chemistry, …) gets its OWN curated library
 * under assets/<subject>/, containing ONLY approved, purpose-built primitives —
 * never generic filler (business/briefcase/etc.). A physics diagram may only use
 * physics assets; the DGE validates this at build time.
 *
 * Source of truth = the committed authored SVG modules under tools/visual-library/.
 * This script writes, per subject:
 *   assets/<subject>/primitives/<id>.svg   the approved SVGs (committed)
 *   assets/<subject>/registry.json         semantic metadata for each asset
 *
 * Run: node tools/build-subject-libraries.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { AUTHORED } = require("./visual-library/authored.js");
const { PHYSICS } = require("./visual-library/authored-physics.js");

const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "assets");

// ---- helpers ---------------------------------------------------------------
const basename = (p) => p.replace(/^.*\//, "").replace(/\.svg$/, "");
const topicOf = (p) => { const seg = p.split("/"); return seg.length >= 3 ? seg[1] : "general"; };
function bounds(svg) {
  const m = svg.match(/viewBox\s*=\s*"([-\d.eE ]+)"/);
  if (m) { const p = m[1].trim().split(/[ ,]+/).map(Number); if (p.length === 4) return { w: p[2], h: p[3] }; }
  return { w: 24, h: 24 };
}
// default anchors from bounds (center + edge midpoints), extended by overrides
function anchorsFor(id, b) {
  const base = {
    center: [+(b.w / 2).toFixed(1), +(b.h / 2).toFixed(1)],
    n: [+(b.w / 2).toFixed(1), 0], s: [+(b.w / 2).toFixed(1), b.h],
    e: [b.w, +(b.h / 2).toFixed(1)], w: [0, +(b.h / 2).toFixed(1)]
  };
  return Object.assign(base, ANCHOR_OVERRIDES[id] || {});
}
// curated semantic roles (what the primitive can play in a diagram); default [topic]
const ROLES = {
  "charge-positive": ["charge", "positive", "source"],
  "charge-negative": ["charge", "negative", "source"],
  "field-lines-radial": ["field", "radial", "source"],
  "parallel-plates": ["field-region", "capacitor", "plates"],
  "force-arrow": ["vector", "force"], "velocity-arrow": ["vector", "velocity"],
  "acceleration-arrow": ["vector", "acceleration"],
  "resistor": ["component"], "battery-cell": ["component", "source"], "capacitor": ["component"],
  "light-bulb": ["component"], "switch": ["component"], "circuit-series": ["circuit"],
  "converging-lens": ["optic", "lens"], "diverging-lens": ["optic", "lens"],
  "concave-mirror": ["optic", "mirror"], "convex-mirror": ["optic", "mirror"],
  "transverse-wave": ["wave"], "wavelength-labeled": ["wave"], "standing-wave": ["wave"],
  "bar-magnet": ["magnet", "source"], "field-lines-magnet": ["field"], "solenoid": ["component"],
  "axes-2d": ["graph", "axes"], "axes-quadrant1": ["graph", "axes"], "grid-square": ["graph", "grid"],
  "arrow-right": ["vector"], "arrow-double": ["dimension"], "dimension-horizontal": ["dimension"]
};
const ANCHOR_OVERRIDES = {
  "parallel-plates": { "gap-center": [50, 40], "top-plate": [50, 16], "bottom-plate": [50, 64] },
  "charge-positive": { center: [15, 15] }, "charge-negative": { center: [15, 15] }
};

// Subject-neutral STEM primitives from AUTHORED that physics graphs legitimately
// use (axes, grid, plain arrows, dimensions). These are StudyMAF-authored, MIT —
// NOT generic filler. Curated allowlist by source path prefix + id.
const NEUTRAL_FOR_PHYSICS = new Set([
  "diagram-components/axes/axes-2d.svg",
  "diagram-components/axes/axes-quadrant1.svg",
  "diagram-components/grids/grid-square.svg",
  "diagram-components/arrows/arrow-right.svg",
  "diagram-components/arrows/arrow-double.svg",
  "diagram-components/dimensions/dimension-horizontal.svg"
]);

// ---- build one subject -----------------------------------------------------
function buildSubject(subject, entries, { primitivesDir, note }) {
  const dir = path.join(ASSETS, subject);
  const primDir = path.join(dir, primitivesDir || "primitives");
  fs.mkdirSync(primDir, { recursive: true });
  const registry = { subject, version: 1, note, generatedBy: "tools/build-subject-libraries.js", assets: {} };
  const seen = {};
  for (const [srcPath, svg] of entries) {
    const id = basename(srcPath);
    if (seen[id]) throw new Error(`duplicate asset id "${id}" (from ${srcPath} and ${seen[id]}) in subject ${subject}`);
    seen[id] = srcPath;
    fs.writeFileSync(path.join(primDir, id + ".svg"), svg.trim() + "\n");
    const b = bounds(svg);
    registry.assets[id] = {
      id, subject, topic: topicOf(srcPath), roles: ROLES[id] || [topicOf(srcPath)],
      bounds: b, anchors: anchorsFor(id, b),
      source: "studymaf", license: "MIT", file: (primitivesDir || "primitives") + "/" + id + ".svg"
    };
  }
  fs.writeFileSync(path.join(dir, "registry.json"), JSON.stringify(registry, null, 2) + "\n");
  return Object.keys(registry.assets).length;
}

// empty registry (routing established; assets added later)
function emptySubject(subject, note) {
  const dir = path.join(ASSETS, subject);
  fs.mkdirSync(path.join(dir, "primitives"), { recursive: true });
  fs.writeFileSync(path.join(dir, "registry.json"),
    JSON.stringify({ subject, version: 1, note, generatedBy: "tools/build-subject-libraries.js", assets: {} }, null, 2) + "\n");
}

// ---- run -------------------------------------------------------------------
const physicsEntries = [
  ...Object.entries(PHYSICS),
  ...Object.entries(AUTHORED).filter(([p]) => NEUTRAL_FOR_PHYSICS.has(p))
];
const nPhys = buildSubject("physics", physicsEntries, {
  note: "Approved physics primitives only (StudyMAF-authored, MIT). No generic filler icons."
});
emptySubject("calculus", "Calculus library — routing established; add approved calculus primitives here.");
emptySubject("chemistry", "Chemistry library — routing established; add approved chemistry primitives here.");

console.log(`built subject libraries → assets/`);
console.log(`  physics:   ${nPhys} approved assets`);
console.log(`  calculus:  0 (registry scaffold)`);
console.log(`  chemistry: 0 (registry scaffold)`);
