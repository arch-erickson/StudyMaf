#!/usr/bin/env node
/* StudyMAF — render lesson diagrams with the DGE into the REAL lesson content.
 *
 * Build-time only: each diagram is composed from the subject's curated library and
 * written as a self-contained SVG (math baked in as KaTeX MathML — no runtime AI or
 * KaTeX needed). The lesson JSON references the committed SVG via a { type:"svg" }
 * figure, so students see these in the real lesson flow — not a demo gallery.
 *
 * Run: node tools/build-lesson-diagrams.js
 * Output: data/diagrams/*.svg + data/diagrams/manifest.json
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { render, ANNOT } = require("./dge/dge.js");

const OUT = path.resolve(__dirname, "..", "data", "diagrams");
fs.mkdirSync(OUT, { recursive: true });

// radial arrows around a charge center, pointing OUT (dir=+1) or IN (dir=-1)
function radial(cx, cy, r0, r1, dir, role) {
  const items = [];
  for (let a = 0; a < 360; a += 45) {
    const t = a * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    const p0 = [cx + r0 * c, cy + r0 * s], p1 = [cx + r1 * c, cy + r1 * s];
    items.push({ type: "arrow", from: dir > 0 ? p0 : p1, to: dir > 0 ? p1 : p0, role });
  }
  return items;
}

// ---- the three Lesson 2 (Electric Field) diagrams -------------------------
const specs = [
  {
    id: "phys1442-02-field-around-charges",
    subject: "physics",
    title: "Electric field around point charges",
    canvas: { width: 460, height: 230, seed: "physics-electricity" },
    caption: "Field arrows point away from a positive charge and toward a negative charge.",
    items: [
      { type: "asset", id: "charge-positive", cx: 120, cy: 120, size: 40, role: "positive" },
      ...radial(120, 120, 26, 54, +1, "field"),
      { type: "text", text: "+q", x: 120, y: 200, anchor: "middle", math: true, size: 14 },
      { type: "asset", id: "charge-negative", cx: 340, cy: 120, size: 40, role: "negative" },
      ...radial(340, 120, 28, 56, -1, "field"),
      { type: "text", text: "-q", x: 340, y: 200, anchor: "middle", math: true, size: 14 }
    ]
  },
  {
    id: "phys1442-02-uniform-field-plates",
    subject: "physics",
    title: "Uniform field between parallel plates",
    canvas: { width: 420, height: 230, seed: "physics-electricity" },
    caption: "Between charged parallel plates the field $\\vec E$ is uniform — evenly spaced, parallel lines.",
    items: [
      { type: "asset", id: "parallel-plates", cx: 195, cy: 135, width: 210, color: ANNOT.ink },
      { type: "text", text: "\\vec E", x: 285, y: 135, anchor: "middle", math: true, size: 15, color: ANNOT.field },
      { type: "dimension", from: [355, 82], to: [355, 188], label: "d" }
    ]
  },
  {
    id: "phys1442-02-force-on-test-charge",
    subject: "physics",
    title: "Force on a test charge",
    canvas: { width: 460, height: 240, seed: "physics-electricity" },
    caption: "In the same field $\\vec E$, the force $\\vec F = q\\vec E$ is along $\\vec E$ on $+q$ and opposite on $-q$.",
    items: [
      // uniform field pointing right
      { type: "arrow", from: [40, 70], to: [420, 70], role: "field" },
      { type: "arrow", from: [40, 205], to: [420, 205], role: "field" },
      { type: "text", text: "\\vec E", x: 430, y: 70, anchor: "end", math: true, size: 14, color: ANNOT.field },
      // positive test charge: force along E (right)
      { type: "asset", id: "charge-positive", cx: 150, cy: 110, size: 38, role: "positive" },
      { type: "text", text: "+q", x: 150, y: 150, anchor: "middle", math: true, size: 13 },
      { type: "arrow", from: [172, 110], to: [262, 110], role: "force" },
      { type: "text", text: "\\vec F", x: 217, y: 96, anchor: "middle", math: true, size: 13, color: ANNOT.force },
      // negative test charge: force opposite E (left)
      { type: "asset", id: "charge-negative", cx: 320, cy: 165, size: 38, role: "negative" },
      { type: "text", text: "-q", x: 320, y: 205, anchor: "middle", math: true, size: 13 },
      { type: "arrow", from: [298, 165], to: [208, 165], role: "force" },
      { type: "text", text: "\\vec F", x: 253, y: 151, anchor: "middle", math: true, size: 13, color: ANNOT.force }
    ]
  }
];

// ---- render + wire into lesson JSON ---------------------------------------
const manifest = { generated: new Date().toISOString(), source: "tools/build-lesson-diagrams.js", diagrams: [] };
const attribution = new Set();

for (const spec of specs) {
  const { svg, manifest: m } = render(spec);
  const file = spec.id + ".svg";
  fs.writeFileSync(path.join(OUT, file), svg + "\n");
  (m.attributionRequired || []).forEach(a => attribution.add(a));
  manifest.diagrams.push({ id: spec.id, subject: spec.subject, title: spec.title, file: "data/diagrams/" + file, caption: spec.caption, assets: m.assets, attributionRequired: m.attributionRequired });
}
manifest.attribution = [...attribution];
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

// wire the diagrams into Lesson 2's concept sections (replace the older figures so
// students see them in the real reader — no duplicate demo-only copy).
const LESSON = path.resolve(__dirname, "..", "data", "lessons", "phys1442-02-efield.json");
const lesson = JSON.parse(fs.readFileSync(LESSON, "utf8"));
const wire = {
  "Field of a point charge": specs[0],
  "Field lines and uniform fields": specs[1],
  "Force from a field": specs[2]
};
let wired = 0;
for (const c of lesson.concept_sections || []) {
  const spec = wire[c.heading];
  if (!spec) continue;
  c.figure = { type: "svg", src: "data/diagrams/" + spec.id + ".svg", caption: spec.caption };
  wired++;
}
fs.writeFileSync(LESSON, JSON.stringify(lesson, null, 2) + "\n");

console.log(`rendered ${specs.length} lesson diagrams → data/diagrams/ (+ manifest.json)`);
console.log(`wired ${wired} figures into ${path.basename(LESSON)}`);
if (attribution.size) console.log("attribution required:\n  - " + [...attribution].join("\n  - "));
else console.log("attribution required: none (all StudyMAF-authored, MIT)");
