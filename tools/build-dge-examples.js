#!/usr/bin/env node
/* Render example diagrams with the DGE to prove the pipeline end-to-end:
 * library graphics -> recolor to palette -> annotations/symbols/text with
 * collision avoidance + fixed annotation colors -> one self-contained SVG.
 * Output: studymaf-visual-library/_dge-examples/ (gitignored) + a gallery. */
"use strict";
const fs = require("fs");
const path = require("path");
const { Diagram, ANNOT } = require("./dge/dge.js");

const OUT = path.resolve(__dirname, "..", "studymaf-visual-library", "_dge-examples");
fs.mkdirSync(OUT, { recursive: true });
const examples = [];
const save = (name, note, d) => { const svg = d.toSVG(); fs.writeFileSync(path.join(OUT, name + ".svg"), svg + "\n"); examples.push({ name, note, svg }); };

// 1) Motion — a library object (car) recolored, velocity arrow, distance dimension.
(() => {
  const d = new Diagram({ width: 500, height: 250, seed: "physics-mechanics" });
  d.text("Constant velocity", 250, 26, { anchor: "middle", weight: 700, size: 15, color: d.palette.ink });
  d.line([24, 188], [476, 188], { color: d.palette.ink, width: 2 });
  d.place("car", { cx: 120, cy: 150, width: 118, color: d.palette.accent, colored: false, source: "phosphor" });
  d.place("car", { cx: 410, cy: 150, width: 118, colored: false, source: "phosphor", opacity: 0.28 });
  d.arrow([182, 130], [300, 130], { role: "velocity", label: "v" });
  d.dimension([120, 210], [410, 210], { label: "d" });
  save("01-motion", "library object recolored + velocity arrow + distance dimension", d);
})();

// 2) Electrostatics — authored charges (semantic red/blue), field arrows, + / − symbols.
(() => {
  const d = new Diagram({ width: 440, height: 250, seed: "physics-electricity" });
  d.text("Field between two charges", 220, 26, { anchor: "middle", weight: 700, size: 15, color: d.palette.ink });
  d.place("charge-positive", { cx: 90, cy: 135, size: 40, role: "positive", label: "q₁" });
  d.place("charge-negative", { cx: 350, cy: 135, size: 40, role: "negative", label: "q₂" });
  for (const y of [105, 135, 165]) d.arrow([118, y], [322, y], { role: "field" });
  d.text("E", 220, 92, { anchor: "middle", color: ANNOT.field, math: true, size: 14, avoid: true });
  d.symbol("plus-circle", 90, 200, { size: 6 });
  d.symbol("minus-circle", 350, 200, { size: 6 });
  d.text("attract", 220, 200, { anchor: "middle", color: ANNOT.label, size: 12, avoid: true });
  save("02-electrostatics", "authored charges + field arrows + green/red symbols + dodged labels", d);
})();

// 3) Optics — authored converging lens, object/image arrows, rays, focal points.
(() => {
  const d = new Diagram({ width: 480, height: 240, seed: "physics-optics" });
  d.text("Converging lens", 240, 24, { anchor: "middle", weight: 700, size: 15, color: d.palette.ink });
  d.line([20, 130], [460, 130], { guide: true });
  d.place("converging-lens", { cx: 240, cy: 130, height: 150, color: d.palette.accent, colored: false });
  d.arrow([90, 130], [90, 78], { color: d.palette.ink, solid: true, label: "object" });
  d.arrow([370, 130], [370, 178], { color: ANNOT.highlight, solid: true, label: "image" });
  d.line([90, 78], [240, 130], { color: ANNOT.leader });
  d.line([240, 130], [370, 178], { color: ANNOT.leader });
  for (const x of [175, 305]) { d.content.push(`<circle cx="${x}" cy="130" r="2.4" fill="${d.palette.ink}"/>`); d.text("F", x, 146, { anchor: "middle", size: 12, math: true, color: d.palette.ink }); }
  save("03-optics", "authored lens recolored + object/image arrows + rays + focal points", d);
})();

// 4) Calculus — abstract diagram (skips library objects), authored area + annotations.
(() => {
  const d = new Diagram({ width: 320, height: 260, seed: "mathematics-calculus" });
  d.text("Area under a curve", 160, 24, { anchor: "middle", weight: 700, size: 15, color: d.palette.ink });
  d.place("area-under-curve", { cx: 160, cy: 145, width: 240, color: d.palette.accent, colored: false });
  d.text("∫ f(x) dx", 160, 150, { anchor: "middle", color: d.palette.accent, math: true, size: 15, avoid: true });
  d.text("a", 70, 234, { anchor: "middle", size: 13, math: true, color: ANNOT.dimension });
  d.text("b", 250, 234, { anchor: "middle", size: 13, math: true, color: ANNOT.dimension });
  save("04-calculus", "no library objects — authored primitive + math annotations", d);
})();

// 5) Chemistry — a COLORED illustration kept as-is, with an annotation on top.
(() => {
  const d = new Diagram({ width: 300, height: 300, seed: "chemistry" });
  d.text("Add reagent", 150, 26, { anchor: "middle", weight: 700, size: 15, color: d.palette.ink });
  const beaker = d.place("beaker", { cx: 150, cy: 195, size: 150, colored: true });
  d.place("dropper", { cx: 150, cy: 70, size: 70, colored: true }) || d.place("pipette", { cx: 150, cy: 70, size: 70, colored: true });
  d.arrow([150, 96], [150, 138], { role: "arrow", solid: true, label: "drop" });
  if (beaker) d.callout(beaker.bbox.x - 6, beaker.bbox.y - 6, beaker.bbox.w + 12, beaker.bbox.h + 12, { text: "" });
  save("05-chemistry", "colored bioicons illustration kept + annotation arrow + callout", d);
})();

// gallery
let html = `<h1 style="font-family:system-ui;margin:0 0 4px">DGE — example diagrams</h1><p style="font-family:system-ui;color:#667;margin:0 0 18px">Composed from the visual library: objects recolored to a palette, annotations/symbols/text placed to avoid obstruction, fixed annotation colors (arrow neutral, + green, − red, semantic vectors consistent).</p><div style="display:flex;flex-wrap:wrap;gap:22px">`;
for (const e of examples) html += `<figure style="margin:0;width:360px;border:1px solid #e5e7eb;border-radius:12px;padding:14px;background:#fff"><div style="background:#fff">${e.svg}</div><figcaption style="font-family:system-ui;font-size:12px;color:#334;margin-top:8px"><b>${e.name}</b><br><span style="color:#778">${e.note}</span></figcaption></figure>`;
html += `</div>`;
fs.writeFileSync(path.join(OUT, "_gallery.html"), "<!doctype html><meta charset=utf8><body style=\"background:#f6f7f9;padding:22px\">" + html);
console.log("rendered " + examples.length + " DGE example diagrams → " + path.relative(path.resolve(__dirname, ".."), OUT));
