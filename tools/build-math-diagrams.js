#!/usr/bin/env node
/* Generate DGE diagrams for every math-class lesson (Calc I/II, College Algebra):
 * one clean, edge-safe illustration per concept + real-world example, drawn from
 * the curated calculus / algebra libraries. Each concept/example figure is rewired
 * to { type:"svg", src }. Run: node tools/build-math-diagrams.js */
"use strict";
const fs = require("fs"), path = require("path");
const { render, ANNOT } = require("./dge/dge.js");
const c1 = require("./seed-calc1.js").LESSONS;
const c2 = require("./seed-calc2.js").LESSONS;
const al = require("./seed-algebra.js").LESSONS;

const OUT = path.resolve(__dirname, "..", "data", "diagrams");
const LDIR = path.resolve(__dirname, "..", "data", "lessons");
fs.mkdirSync(OUT, { recursive: true });

// per-lesson asset pools (cycled across the 5 concepts + 3 examples). Only ids from
// the lesson's subject library are used, so nothing off-subject appears.
const POOLS = {
  // ---- Calculus I (subject: calculus) ----
  "calc1-01-limits": { s: "calculus", a: ["limit-hole", "coordinate-plane", "number-line-point"] },
  "calc1-02-continuity": { s: "calculus", a: ["coordinate-plane", "line-linear", "limit-hole"] },
  "calc1-03-derivative-definition": { s: "calculus", a: ["tangent-line", "secant-line", "coordinate-plane"] },
  "calc1-04-differentiation-rules": { s: "calculus", a: ["parabola", "cubic", "coordinate-plane"] },
  "calc1-05-rates-trig": { s: "calculus", a: ["sine-wave", "cosine-wave", "tangent-line"] },
  "calc1-06-chain-rule": { s: "calculus", a: ["sine-wave", "parabola", "coordinate-plane"] },
  "calc1-07-inverse-implicit": { s: "calculus", a: ["unit-circle", "coordinate-plane", "tangent-line"] },
  "calc1-08-exp-log-derivatives": { s: "calculus", a: ["exponential", "coordinate-plane", "tangent-line"] },
  "calc1-09-related-rates": { s: "calculus", a: ["right-triangle-labeled", "coordinate-plane", "parabola"] },
  "calc1-10-linearization": { s: "calculus", a: ["tangent-line", "coordinate-plane", "parabola"] },
  "calc1-11-extrema-mvt": { s: "calculus", a: ["parabola", "cubic", "secant-line"] },
  "calc1-12-curve-sketching": { s: "calculus", a: ["cubic", "parabola-down", "coordinate-plane"] },
  "calc1-13-optimization-lhopital": { s: "calculus", a: ["parabola-down", "coordinate-plane", "exponential"] },
  "calc1-14-integral": { s: "calculus", a: ["area-under-curve", "riemann-rectangles", "coordinate-plane"] },
  // ---- Calculus II (subject: calculus) ----
  "calc2-01-antiderivatives-ftc": { s: "calculus", a: ["area-under-curve", "coordinate-plane", "riemann-rectangles"] },
  "calc2-02-substitution": { s: "calculus", a: ["area-under-curve", "coordinate-plane", "riemann-rectangles"] },
  "calc2-03-parts": { s: "calculus", a: ["area-under-curve", "exponential", "coordinate-plane"] },
  "calc2-04-trig-integrals": { s: "calculus", a: ["sine-wave", "cosine-wave", "area-under-curve"] },
  "calc2-05-trig-substitution": { s: "calculus", a: ["right-triangle-labeled", "unit-circle", "coordinate-plane"] },
  "calc2-06-partial-fractions": { s: "calculus", a: ["coordinate-plane", "area-under-curve", "line-linear"] },
  "calc2-07-improper": { s: "calculus", a: ["exponential", "area-under-curve", "coordinate-plane"] },
  "calc2-08-taylor-polynomials": { s: "calculus", a: ["parabola", "cubic", "coordinate-plane"] },
  "calc2-09-sequences": { s: "calculus", a: ["number-line-point", "number-line", "coordinate-plane"] },
  "calc2-10-series": { s: "calculus", a: ["number-line-point", "area-under-curve", "coordinate-plane"] },
  "calc2-11-alternating-ratio": { s: "calculus", a: ["number-line-point", "sine-wave", "coordinate-plane"] },
  "calc2-12-power-series": { s: "calculus", a: ["coordinate-plane", "parabola", "exponential"] },
  "calc2-13-areas": { s: "calculus", a: ["area-under-curve", "parabola", "coordinate-plane"] },
  "calc2-14-volumes": { s: "calculus", a: ["area-under-curve", "coordinate-plane", "riemann-rectangles"] },
  // ---- College Algebra (subject: algebra) ----
  "alg-01-arithmetic": { s: "algebra", a: ["number-line", "number-line-point", "bar-model"] },
  "alg-02-exponents-polynomials": { s: "algebra", a: ["rectangle", "bar-model", "function-machine"] },
  "alg-03-factoring": { s: "algebra", a: ["rectangle", "square", "bar-model"] },
  "alg-04-rational-expressions": { s: "algebra", a: ["bar-model", "function-machine", "rectangle"] },
  "alg-05-radicals-complex": { s: "algebra", a: ["right-triangle-labeled", "coordinate-plane", "square"] },
  "alg-06-linear-equations": { s: "algebra", a: ["balance-scale", "number-line", "line-linear"] },
  "alg-07-quadratic-equations": { s: "algebra", a: ["parabola", "parabola-down", "coordinate-plane"] },
  "alg-08-polynomial-rational-equations": { s: "algebra", a: ["cubic", "coordinate-plane", "function-machine"] },
  "alg-09-radical-equations": { s: "algebra", a: ["coordinate-plane", "right-triangle-labeled", "balance-scale"] },
  "alg-10-lines": { s: "algebra", a: ["line-linear", "coordinate-plane", "coordinate-plane-q1"] },
  "alg-11-conics": { s: "algebra", a: ["circle-radius", "parabola", "coordinate-plane"] },
  "alg-12-systems": { s: "algebra", a: ["coordinate-plane", "line-linear", "circle-radius"] },
  "alg-13-right-triangle-trig": { s: "algebra", a: ["right-triangle-labeled", "unit-circle", "angle-standard"] },
  "alg-14-exp-log": { s: "algebra", a: ["exponential", "coordinate-plane", "function-machine"] }
};

const COLORS = [ANNOT.ink, "#6B7A99", "#7FA893", "#8983B8", "#C08A6E"];

function diagram(id, subject, assetId, seedIdx) {
  const spec = {
    id, subject,
    canvas: { width: 380, height: 220, seed: subject + "-" + id },
    items: [{ type: "asset", id: assetId, cx: 190, cy: 112, size: 150, color: COLORS[seedIdx % COLORS.length] }]
  };
  return render(spec).svg;
}

const manifest = { generated: new Date().toISOString(), source: "tools/build-math-diagrams.js", diagrams: [] };
let made = 0, wired = 0, lessons = 0;

function processClass(list) {
  for (const L of list) {
    const pool = POOLS[L.id]; if (!pool) { console.warn("no pool for " + L.id); continue; }
    const lessonFile = path.join(LDIR, L.id + ".json");
    const lesson = JSON.parse(fs.readFileSync(lessonFile, "utf8"));
    const concepts = (lesson.concept_sections || []).slice().sort((a, b) => a.level - b.level);
    const examples = lesson.real_world_examples || [];
    let k = 0;
    const emit = (slot, target, caption) => {
      const asset = pool.a[k % pool.a.length];
      const id = L.id + "-" + slot;
      const svg = diagram(id, pool.s, asset, k);
      fs.writeFileSync(path.join(OUT, id + ".svg"), svg + "\n");
      target.figure = { type: "svg", src: "data/diagrams/" + id + ".svg", caption: caption };
      manifest.diagrams.push({ id, subject: pool.s, file: "data/diagrams/" + id + ".svg", asset });
      made++; wired++; k++;
    };
    concepts.forEach((c, i) => emit("c" + (i + 1), c, c.heading));
    examples.forEach((e, i) => emit("e" + (i + 1), e, e.title));
    fs.writeFileSync(lessonFile, JSON.stringify(lesson, null, 2) + "\n");
    lessons++;
  }
}
processClass(c1); processClass(c2); processClass(al);

// merge into the existing diagram manifest (physics diagrams already there)
const mPath = path.join(OUT, "manifest.json");
let master = { diagrams: [] };
try { master = JSON.parse(fs.readFileSync(mPath, "utf8")); } catch (e) {}
const byId = {}; (master.diagrams || []).forEach(d => byId[d.id] = d);
manifest.diagrams.forEach(d => byId[d.id] = d);
master.diagrams = Object.values(byId);
master.mathGenerated = manifest.generated;
fs.writeFileSync(mPath, JSON.stringify(master, null, 2) + "\n");

console.log("math diagrams: rendered " + made + ", wired " + wired + " figures across " + lessons + " lessons");
