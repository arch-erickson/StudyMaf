#!/usr/bin/env node
/* Generate DGE diagrams for the three added classes (phys1441, phys1433,
 * precalc): one edge-safe illustration per concept + real-world example, drawn
 * from the physics library (phys classes) or algebra library (precalc). Rewires
 * each concept/example figure to { type:"svg", src }. Mirrors
 * tools/build-math-diagrams.js. Run: node tools/build-sci-diagrams.js */
"use strict";
const fs = require("fs"), path = require("path");
const { render, ANNOT } = require("./dge/dge.js");
const p41 = require("./seed-phys1441.js").LESSONS;
const p33 = require("./seed-phys1433.js").LESSONS;
const pc = require("./seed-precalc.js").LESSONS;

const OUT = path.resolve(__dirname, "..", "data", "diagrams");
const LDIR = path.resolve(__dirname, "..", "data", "lessons");
fs.mkdirSync(OUT, { recursive: true });

const POOLS = {
  // ---- Physics I — Calculus Based (subject: physics) ----
  "phys1441-01-units": { s: "physics", a: ["axes-2d", "dimension-horizontal", "arrow-right"] },
  "phys1441-02-kinematics-1d": { s: "physics", a: ["velocity-arrow", "acceleration-arrow", "arrow-right"] },
  "phys1441-03-vectors-2d": { s: "physics", a: ["force-arrow", "velocity-arrow", "axes-2d"] },
  "phys1441-04-newtons-laws": { s: "physics", a: ["free-body-diagram", "force-arrow", "normal-force"] },
  "phys1441-05-applications-gravity": { s: "physics", a: ["weight-gravity", "free-body-diagram", "projectile-path"] },
  "phys1441-06-work-energy": { s: "physics", a: ["force-arrow", "spring", "inclined-plane"] },
  "phys1441-07-potential-energy": { s: "physics", a: ["spring-mass", "weight-gravity", "pendulum"] },
  "phys1441-08-momentum": { s: "physics", a: ["velocity-arrow", "force-arrow", "arrow-double"] },
  "phys1441-09-rotation": { s: "physics", a: ["lever", "pulley", "arrow-double"] },
  "phys1441-10-equilibrium": { s: "physics", a: ["free-body-diagram", "lever", "normal-force"] },
  "phys1441-11-fluids": { s: "physics", a: ["beaker-fluid", "pressure-depth", "buoyancy"] },
  "phys1441-12-oscillations": { s: "physics", a: ["spring-mass", "pendulum", "transverse-wave"] },
  "phys1441-13-temperature-heat": { s: "physics", a: ["thermometer", "heat-flow", "piston-cylinder"] },
  "phys1441-14-thermodynamics": { s: "physics", a: ["pv-diagram", "piston-cylinder", "heat-flow"] },
  // ---- Physics I — Algebra Based (subject: physics) ----
  "phys1433-01-units": { s: "physics", a: ["axes-2d", "dimension-horizontal", "arrow-right"] },
  "phys1433-02-kinematics-1d": { s: "physics", a: ["velocity-arrow", "acceleration-arrow", "arrow-right"] },
  "phys1433-03-kinematics-2d": { s: "physics", a: ["projectile-path", "velocity-arrow", "axes-2d"] },
  "phys1433-04-newtons-laws": { s: "physics", a: ["free-body-diagram", "force-arrow", "normal-force"] },
  "phys1433-05-friction-circular": { s: "physics", a: ["friction-force", "normal-force", "force-arrow"] },
  "phys1433-06-gravitation": { s: "physics", a: ["weight-gravity", "field-lines-radial", "free-body-diagram"] },
  "phys1433-07-work-energy-power": { s: "physics", a: ["force-arrow", "spring", "inclined-plane"] },
  "phys1433-08-momentum": { s: "physics", a: ["velocity-arrow", "force-arrow", "arrow-double"] },
  "phys1433-09-rotation-torque": { s: "physics", a: ["lever", "pulley", "arrow-double"] },
  "phys1433-10-equilibrium": { s: "physics", a: ["free-body-diagram", "lever", "normal-force"] },
  "phys1433-11-fluids": { s: "physics", a: ["beaker-fluid", "pressure-depth", "buoyancy"] },
  "phys1433-12-temperature-heat": { s: "physics", a: ["thermometer", "heat-flow", "piston-cylinder"] },
  "phys1433-13-thermodynamics": { s: "physics", a: ["pv-diagram", "piston-cylinder", "heat-flow"] },
  "phys1433-14-waves-sound": { s: "physics", a: ["transverse-wave", "longitudinal-wave", "wavelength-labeled"] },
  // ---- Precalculus (subject: algebra) ----
  "precalc-01-functions": { s: "algebra", a: ["function-machine", "coordinate-plane", "number-line"] },
  "precalc-02-function-formulas": { s: "algebra", a: ["function-machine", "coordinate-plane", "line-linear"] },
  "precalc-03-function-graphs": { s: "algebra", a: ["coordinate-plane", "parabola", "cubic"] },
  "precalc-04-transformations": { s: "algebra", a: ["parabola", "parabola-down", "coordinate-plane"] },
  "precalc-05-operations": { s: "algebra", a: ["function-machine", "arrow-double", "coordinate-plane"] },
  "precalc-06-inverse": { s: "algebra", a: ["function-machine", "line-linear", "coordinate-plane"] },
  "precalc-07-poly-division": { s: "algebra", a: ["cubic", "bar-model", "coordinate-plane"] },
  "precalc-08-poly-graphs": { s: "algebra", a: ["cubic", "parabola", "coordinate-plane"] },
  "precalc-09-poly-roots": { s: "algebra", a: ["cubic", "parabola", "number-line-point"] },
  "precalc-10-rational": { s: "algebra", a: ["coordinate-plane", "line-linear", "number-line"] },
  "precalc-11-asymptotes": { s: "algebra", a: ["coordinate-plane", "exponential", "line-linear"] },
  "precalc-12-inequalities": { s: "algebra", a: ["number-line", "number-line-point", "coordinate-plane"] },
  "precalc-13-exponential": { s: "algebra", a: ["exponential", "coordinate-plane", "function-machine"] },
  "precalc-14-logarithmic": { s: "algebra", a: ["exponential", "coordinate-plane", "function-machine"] }
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

const manifest = { generated: new Date().toISOString(), source: "tools/build-sci-diagrams.js", diagrams: [] };
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
processClass(p41); processClass(p33); processClass(pc);

const mPath = path.join(OUT, "manifest.json");
let master = { diagrams: [] };
try { master = JSON.parse(fs.readFileSync(mPath, "utf8")); } catch (e) {}
const byId = {}; (master.diagrams || []).forEach(d => byId[d.id] = d);
manifest.diagrams.forEach(d => byId[d.id] = d);
master.diagrams = Object.values(byId);
master.sciGenerated = manifest.generated;
fs.writeFileSync(mPath, JSON.stringify(master, null, 2) + "\n");

console.log("sci diagrams: rendered " + made + ", wired " + wired + " figures across " + lessons + " lessons");
