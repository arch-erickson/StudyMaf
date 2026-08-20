#!/usr/bin/env node
/* StudyMAF — generate EVERY lesson diagram with the DGE (concepts + real-world
 * examples, all 14 PHYS 1442 lessons) from the curated physics library only.
 *
 * Build-time, self-contained SVGs (math baked as KaTeX MathML). Each is:
 *   - edge-safe   — the DGE auto-fits content inside the frame (never clipped)
 *   - non-overlapping — labels use collision-aware placement (avoid)
 *   - clean       — a few purposeful primitives + annotations
 * Output: data/diagrams/*.svg + manifest.json, and each lesson's concept/example
 * figure is rewired to { type:"svg", src }.  Run: node tools/build-lesson-diagrams.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { render, ANNOT } = require("./dge/dge.js");

const OUT = path.resolve(__dirname, "..", "data", "diagrams");
const LDIR = path.resolve(__dirname, "..", "data", "lessons");
const INK = ANNOT.ink;

// ---- item helpers ----------------------------------------------------------
const P = (cx, cy, s, label) => { const o = { type: "asset", id: "charge-positive", cx, cy, size: s || 32, role: "positive" }; if (label) o.label = label; return o; };
const N = (cx, cy, s, label) => { const o = { type: "asset", id: "charge-negative", cx, cy, size: s || 32, role: "negative" }; if (label) o.label = label; return o; };
const AST = (id, cx, cy, s, label, color) => { const o = { type: "asset", id, cx, cy, size: s || 72, color: color || INK }; if (label) o.label = label; return o; };
const AR = (from, to, role, label) => { const o = { type: "arrow", from, to, role: role || "arrow" }; if (label) o.label = label; return o; };
const LN = (from, to, extra) => Object.assign({ type: "line", from, to }, extra || {});
const TX = (t, x, y, extra) => Object.assign({ type: "text", text: t, x, y, anchor: "middle", avoid: true }, extra || {});
const M = (t, x, y, extra) => TX(t, x, y, Object.assign({ math: true }, extra || {}));
const DIM = (from, to, label) => ({ type: "dimension", from, to, label });
const CO = (x, y, w, h, text) => { const o = { type: "callout", x, y, w, h }; if (text) o.text = text; return o; };
const SYM = (kind, x, y, s) => ({ type: "symbol", kind, x, y, size: s || 7 });
function radial(cx, cy, r0, r1, dir, role) { const a = []; for (let d = 0; d < 360; d += 45) { const t = d * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); const p0 = [cx + r0 * c, cy + r0 * s], p1 = [cx + r1 * c, cy + r1 * s]; a.push({ type: "arrow", from: dir > 0 ? p0 : p1, to: dir > 0 ? p1 : p0, role }); } return a; }
// a few field arrows pointing one direction across a band
const fieldRow = (x0, x1, ys, role) => ys.map(y => ({ type: "arrow", from: [x0, y], to: [x1, y], role: role || "field" }));

// ---- the diagrams (per lesson; c1..c5 = concepts by level, e1..e3 = examples) --
const SPEC = {
  "phys1442-01-coulomb": {
    c1: { cap: "Like charges repel; opposite charges attract.", w: 340, items: [
      P(110, 78, 32), P(190, 78, 32), AR([90, 78], [66, 78], "force"), AR([210, 78], [234, 78], "force"), TX("like: repel", 150, 40),
      P(110, 165, 32), N(190, 165, 32), AR([130, 165], [150, 165], "force"), AR([170, 165], [150, 165], "force"), TX("opposite: attract", 150, 200) ] },
    c2: { cap: "Coulomb's law: $F = k\\,q_1q_2/r^2$ — weaker with distance.", items: [
      P(95, 110, 36, "q_1"), P(330, 110, 36, "q_2"), DIM([113, 150], [312, 150], "r"),
      AR([77, 110], [45, 110], "force"), AR([348, 110], [395, 110], "force"), M("F = k\\,\\dfrac{q_1 q_2}{r^2}", 212, 195) ] },
    c3: { cap: "The two charges feel equal and opposite forces (Newton's 3rd law).", items: [
      P(120, 110, 36, "q_1"), P(320, 110, 36, "q_2"), AR([102, 110], [55, 110], "force", "\\vec F_{21}"), AR([338, 110], [385, 110], "force", "\\vec F_{12}"), TX("equal, opposite", 220, 185) ] },
    c4: { cap: "Net force = vector sum of each separate force (superposition).", items: [
      P(85, 75, 30, "q_1"), P(85, 165, 30, "q_2"), P(215, 120, 34, "q_3"),
      AR([233, 114], [325, 88], "force", "\\vec F_1"), AR([233, 126], [325, 152], "force", "\\vec F_2"), AR([233, 120], [360, 120], "velocity", "\\vec F_{net}") ] },
    c5: { cap: "Between an electron and proton, the electric pull dwarfs gravity.", items: [
      N(90, 105, 30, "e^-"), P(300, 105, 30, "p^+"), AR([108, 105], [185, 105], "force", "electric"), AR([108, 150], [128, 150], "arrow", "gravity"), TX("electric \\gg gravity", 200, 190) ] },
    e1: { cap: "A charged balloon polarizes the wall; opposite charges attract.", items: [
      N(105, 110, 44, "balloon"), LN([300, 40], [300, 185], { color: INK, width: 4 }), TX("wall", 316, 52, { anchor: "start" }),
      SYM("plus", 285, 110, 7), AR([152, 110], [272, 110], "force", "attraction") ] },
    e2: { cap: "A charged drum attracts oppositely-charged toner (Coulomb force).", items: [
      CO(60, 68, 96, 96, "drum"), P(310, 116, 30, "toner"), AR([292, 116], [162, 116], "force", "pulled in") ] },
    e3: { cap: "A grounding strap drains static charge before it can damage a chip.", items: [
      CO(70, 70, 130, 46, "chip"), SYM("minus", 135, 93, 7), LN([135, 116], [135, 150], { color: INK }),
      LN([116, 150], [154, 150], { color: INK, width: 3 }), LN([122, 157], [148, 157], { color: INK }), LN([128, 163], [142, 163], { color: INK }), TX("drains to ground", 230, 150, { anchor: "start" }) ] }
  },
  "phys1442-02-efield": {
    c1: { cap: "A charge fills space with a field; a test charge feels $\\vec F = q\\vec E$.", items: [
      P(110, 115, 40, "source"), ...radial(110, 115, 26, 52, 1, "field"), N(300, 115, 26, "q_0"), AR([282, 115], [200, 115], "force", "\\vec F") ] },
    c2: { cap: "Field points away from + and toward − charge.", w: 460, items: [
      P(120, 118, 40, "+q"), ...radial(120, 118, 26, 54, 1, "field"), N(340, 118, 40, "-q"), ...radial(340, 118, 28, 56, -1, "field") ] },
    c3: { cap: "Force is along $\\vec E$ on $+q$, opposite on $-q$.", w: 460, items: [
      ...fieldRow(40, 420, [70, 200], "field"), M("\\vec E", 432, 70, { anchor: "end", color: ANNOT.field }),
      P(150, 108, 36, "+q"), AR([170, 108], [258, 108], "force", "\\vec F"), N(320, 165, 36, "-q"), AR([300, 165], [212, 165], "force", "\\vec F") ] },
    c4: { cap: "Fields from several charges add as vectors.", items: [
      P(90, 80, 30, "q_1"), N(90, 170, 30, "q_2"), TX("P", 225, 118), SYM("plus", 225, 118, 4),
      AR([225, 118], [325, 90], "field", "\\vec E_1"), AR([225, 118], [325, 150], "field", "\\vec E_2") ] },
    c5: { cap: "Between parallel plates the field is uniform (evenly spaced lines).", items: [
      { type: "asset", id: "parallel-plates", cx: 200, cy: 118, width: 210, color: INK },
      M("\\vec E", 290, 118, { color: ANNOT.field }), DIM([335, 70], [335, 168], "d") ] },
    e1: { cap: "Charge sprayed onto hair makes strands repel and stand up.", items: [
      P(160, 150, 40, "dome"), ...radial(160, 150, 26, 52, 1, "field"), TX("like charges repel", 230, 40, { anchor: "start" }) ] },
    e2: { cap: "Charged ink drops are steered by a field between plates.", items: [
      { type: "asset", id: "parallel-plates", cx: 200, cy: 115, width: 190, color: INK }, N(120, 115, 22, "drop"), AR([138, 115], [250, 145], "field", "deflected") ] },
    e3: { cap: "A charged drum + field transfer the toner image (photocopier).", items: [
      CO(55, 66, 92, 96, "drum"), P(300, 114, 28, "toner"), AR([282, 114], [155, 114], "field", "pulled on") ] }
  },
  "phys1442-03-gauss": {
    c1: { cap: "Flux = field lines crossing a surface: $\\Phi_E = \\vec E\\cdot\\vec A$.", items: [
      ...fieldRow(40, 250, [80, 118, 156], "field"), M("\\vec E", 60, 55, { color: ANNOT.field }),
      LN([300, 55], [300, 180], { color: INK, width: 2, dashed: true }), TX("area A", 330, 60, { anchor: "start" }) ] },
    c2: { cap: "Gauss's law: flux through a closed surface $= q_{enc}/\\varepsilon_0$.", items: [
      P(200, 118, 34, "q"), ...radial(200, 118, 24, 70, 1, "field"), CO(120, 55, 160, 128), TX("Gaussian surface", 200, 205) ] },
    c3: { cap: "Pick a surface matching the symmetry so $E$ is constant on it.", items: [
      P(200, 118, 30, "q"), ...radial(200, 118, 22, 60, 1, "field"), CO(130, 60, 140, 116), TX("sphere of radius r", 200, 200) ] },
    c4: { cap: "In a conductor the field is zero inside; charge sits on the surface.", items: [
      CO(120, 60, 160, 120, "conductor"), TX("E = 0 inside", 200, 120), SYM("plus", 130, 70, 5), SYM("plus", 270, 70, 5), SYM("plus", 130, 170, 5), SYM("plus", 270, 170, 5) ] },
    c5: { cap: "Standard results follow from symmetry (sphere, line, plane).", items: [
      P(120, 118, 28, "q"), ...radial(120, 118, 20, 48, 1, "field"), M("E = k\\,q/r^2", 320, 118) ] },
    e1: { cap: "A car's metal shell shields you: field is zero inside the conductor.", items: [
      CO(90, 90, 200, 80, "car"), TX("E = 0 inside", 190, 130), AR([320, 50], [230, 92], "current", "strike") ] },
    e2: { cap: "A coaxial cable's braid confines the field between the conductors.", items: [
      LN([60, 118], [380, 118], { color: INK, width: 3 }), CO(60, 88, 320, 60), TX("shield (outer)", 220, 70), TX("core", 100, 118, { anchor: "start" }) ] },
    e3: { cap: "The door mesh blocks microwaves — holes are far smaller than $\\lambda$.", items: [
      AST("grid-square", 200, 115, 110, "mesh"), AR([40, 115], [140, 115], "magnetic", "microwaves") ] }
  },
  "phys1442-04-potential": {
    c1: { cap: "Potential = energy per charge, $V = U/q$ (like height for charges).", items: [
      LN([60, 60], [300, 165], { color: INK, width: 3 }), P(72, 52, 30), AR([108, 78], [235, 132], "velocity", "toward low V"),
      TX("high V", 70, 34), TX("low V", 300, 150), M("V = U/q", 190, 200) ] },
    c2: { cap: "A point charge sets up $V = kq/r$ — equal on each dashed ring.", items: [
      P(160, 115, 30, "q"), CO(120, 75, 80, 80), CO(90, 45, 140, 140), DIM([160, 115], [225, 115], "r"), M("V = kq/r", 320, 115) ] },
    c3: { cap: "Work across a potential difference: $W = q\\,\\Delta V = \\tfrac12 mv^2$.", items: [
      { type: "asset", id: "parallel-plates", cx: 180, cy: 115, width: 170, color: INK }, P(140, 140, 22), AR([158, 140], [250, 140], "velocity", "v"), M("W = q\\,\\Delta V", 300, 195) ] },
    c4: { cap: "Field points downhill in potential; $V = Ed$ in a uniform field.", items: [
      { type: "asset", id: "parallel-plates", cx: 190, cy: 112, width: 200, color: INK }, M("\\vec E", 280, 112, { color: ANNOT.field }), DIM([335, 66], [335, 160], "d"), M("V = Ed", 200, 200) ] },
    c5: { cap: "Field lines cross equipotential surfaces at right angles.", items: [
      P(180, 112, 28), CO(140, 74, 80, 80), CO(110, 44, 140, 140), ...radial(180, 112, 22, 96, 1, "field").slice(0, 4), M("1\\,\\text{eV}=1.6\\times10^{-19}\\,\\text{J}", 200, 205) ] },
    e1: { cap: "A 12 V battery gives each coulomb $W=q\\,\\Delta V$ to run the circuit.", items: [
      AST("battery-cell", 110, 115, 90, null, INK), M("12\\,\\text{V}", 110, 165), AST("light-bulb", 300, 115, 60, "lamp", INK), AR([160, 90], [250, 90], "current", "I") ] },
    e2: { cap: "A charged capacitor dumps energy $U=qV$ through the paddles.", items: [
      AST("capacitor", 110, 115, 80, "charged", INK), AR([170, 115], [270, 115], "current", "shock"), CO(285, 88, 70, 60, "heart") ] },
    e3: { cap: "A potential difference accelerates electrons: $qV=\\tfrac12 mv^2$.", items: [
      LN([60, 60], [60, 170], { color: INK, width: 3 }), N(95, 115, 24, "e^-"), AR([115, 115], [300, 115], "velocity", "v"), LN([330, 55], [330, 175], { color: ANNOT.leader, width: 5 }), TX("screen", 330, 42) ] }
  },
  "phys1442-05-capacitance": {
    c1: { cap: "Two conductors hold $\\pm Q$; capacitance $C = Q/V$.", items: [
      { type: "asset", id: "parallel-plates", cx: 200, cy: 112, width: 180, color: INK }, M("+Q", 118, 112, { color: ANNOT.positive }), M("-Q", 285, 112, { color: ANNOT.negative }), M("C = Q/V", 200, 200) ] },
    c2: { cap: "Parallel plates: $C = \\varepsilon_0 A/d$ — bigger area, smaller gap.", items: [
      { type: "asset", id: "parallel-plates", cx: 190, cy: 110, width: 200, color: INK }, M("A", 110, 110), DIM([335, 64], [335, 158], "d"), M("C = \\varepsilon_0 A/d", 200, 200) ] },
    c3: { cap: "Charging stores energy in the field: $U = \\tfrac12 CV^2$.", items: [
      AST("capacitor", 150, 112, 90, null, INK), AR([210, 112], [300, 85], "velocity"), AR([210, 112], [300, 140], "velocity", "release"), M("U = \\tfrac12 CV^2", 175, 195) ] },
    c4: { cap: "A dielectric raises capacitance: $C = \\kappa\\varepsilon_0 A/d$.", items: [
      { type: "asset", id: "parallel-plates", cx: 190, cy: 110, width: 200, color: INK }, CO(140, 70, 100, 80), M("\\kappa", 190, 110), M("C = \\kappa\\varepsilon_0 A/d", 200, 205) ] },
    c5: { cap: "Parallel capacitances add; series reciprocals add.", w: 460, items: [
      AST("capacitor", 110, 100, 70, null, INK), AST("capacitor", 110, 165, 70, null, INK), M("\\text{parallel: } C = C_1+C_2", 110, 205),
      AST("capacitor", 330, 90, 70, null, INK), AST("capacitor", 330, 150, 70, null, INK), M("\\tfrac{1}{C}=\\tfrac{1}{C_1}+\\tfrac{1}{C_2}", 330, 205) ] },
    e1: { cap: "A capacitor stores $U=\\tfrac12 CV^2$, then dumps it as a flash.", items: [
      AST("capacitor", 110, 115, 80, null, INK), AR([50, 115], [78, 115], "current", "charge"), AST("light-bulb", 300, 115, 66, "flash", ANNOT.velocity) ] },
    e2: { cap: "Each DRAM bit is a tiny capacitor: charged = 1, empty = 0.", items: [
      AST("capacitor", 110, 115, 72, null, INK), TX("1 = charged", 110, 165), AST("capacitor", 300, 115, 72, null, ANNOT.leader), TX("0 = empty", 300, 165) ] },
    e3: { cap: "Your finger changes the screen's local capacitance $C=\\kappa\\varepsilon_0 A/d$.", items: [
      AST("grid-square", 190, 150, 96, "screen grid", INK), AR([190, 60], [190, 105], "field", "\\Delta C") ] }
  },
  "phys1442-06-current": {
    c1: { cap: "Current is charge flow per second: $I = \\Delta Q/\\Delta t$.", items: [
      LN([50, 115], [390, 115], { color: INK, width: 3 }), P(150, 115, 22), P(250, 115, 22), AR([120, 90], [320, 90], "current", "I") ] },
    c2: { cap: "Electrons drift slowly through the lattice, colliding as they go.", items: [
      LN([50, 130], [390, 130], { color: INK, width: 2 }), N(120, 110, 20, "e^-"), AR([140, 110], [230, 110], "velocity", "drift v"), SYM("plus", 180, 130, 5), SYM("plus", 260, 130, 5), SYM("plus", 320, 130, 5) ] },
    c3: { cap: "Ohm's law: $V = IR$ — voltage drives current through resistance.", items: [
      AST("resistor", 200, 100, 130, "R", INK), AR([70, 150], [330, 150], "current", "I"), M("V = IR", 200, 195) ] },
    c4: { cap: "Resistance grows with length, falls with area: $R = \\rho L/A$.", items: [
      AST("resistor", 200, 100, 150, null, INK), DIM([80, 150], [320, 150], "L"), M("R = \\rho L/A", 200, 195) ] },
    c5: { cap: "Power dissipated: $P = IV = I^2R$.", items: [
      AST("resistor", 200, 95, 130, null, INK), AST("heat-flow", 200, 160, 60, "heat", ANNOT.current), M("P = I^2 R", 320, 100) ] },
    e1: { cap: "A fuse's thin link melts and breaks the circuit if $I$ is too high.", items: [
      AST("resistor", 200, 100, 120, "fuse link", INK), AR([70, 150], [330, 150], "current", "I"), TX("melts if I too high", 200, 195) ] },
    e2: { cap: "A bulb filament glows because $P=I^2R$ heats its resistance.", items: [
      AST("light-bulb", 200, 110, 90, null, ANNOT.velocity), AST("heat-flow", 300, 150, 50, null, ANNOT.current), M("P = I^2 R", 110, 110) ] },
    e3: { cap: "An overloaded cord warms up: too much current in its resistance.", items: [
      AST("resistor", 200, 100, 150, "cord", INK), AR([70, 150], [330, 150], "current", "big I"), AST("heat-flow", 200, 165, 46, null, ANNOT.current) ] }
  },
  "phys1442-07-dc-circuits": {
    c1: { cap: "Real batteries have internal resistance: $V = \\varepsilon - Ir$.", items: [
      AST("battery-cell", 120, 110, 90, null, INK), AST("resistor", 250, 110, 90, "r", INK), M("V = \\varepsilon - Ir", 200, 195) ] },
    c2: { cap: "Resistors in series add: $R_{eq} = R_1 + R_2$.", w: 460, items: [
      AST("resistor", 130, 110, 100, "R_1", INK), AST("resistor", 300, 110, 100, "R_2", INK), AR([70, 160], [400, 160], "current", "I"), M("R_{eq}=R_1+R_2", 230, 205) ] },
    c3: { cap: "Resistors in parallel: $1/R_{eq} = 1/R_1 + 1/R_2$.", items: [
      AST("resistor", 200, 80, 110, "R_1", INK), AST("resistor", 200, 150, 110, "R_2", INK), M("\\tfrac{1}{R_{eq}}=\\tfrac{1}{R_1}+\\tfrac{1}{R_2}", 200, 205) ] },
    c4: { cap: "Kirchhoff: currents balance at a junction; voltages sum to zero.", items: [
      LN([80, 115], [200, 115], { color: INK, width: 2 }), AR([90, 115], [150, 115], "current", "I"),
      AR([200, 115], [320, 70], "current", "I_1"), AR([200, 115], [320, 160], "current", "I_2"), M("I = I_1 + I_2", 250, 195) ] },
    c5: { cap: "An RC circuit charges/discharges over time constant $\\tau = RC$.", items: [
      AST("battery-cell", 90, 110, 70, null, INK), AST("resistor", 210, 90, 90, "R", INK), AST("capacitor", 320, 110, 70, "C", INK), M("\\tau = RC", 200, 200) ] },
    e1: { cap: "Old series light strings: one bulb out breaks the whole loop.", items: [
      AST("light-bulb", 90, 110, 55, null, INK), AST("light-bulb", 200, 110, 55, "out", ANNOT.leader), AST("light-bulb", 310, 110, 55, null, INK), AR([60, 160], [340, 160], "current", "series I") ] },
    e2: { cap: "Under load the battery's terminal voltage sags ($V=\\varepsilon-Ir$).", items: [
      AST("battery-cell", 110, 110, 90, null, INK), AST("resistor", 280, 110, 90, "load", INK), AR([70, 160], [330, 160], "current", "big I") ] },
    e3: { cap: "A flash charges a capacitor through a resistor, then fires.", items: [
      AST("battery-cell", 90, 110, 70, null, INK), AST("resistor", 200, 95, 80, "R", INK), AST("capacitor", 310, 110, 70, "C", INK), TX("charge, then flash", 200, 195) ] }
  },
  "phys1442-08-magnetic-force": {
    c1: { cap: "A moving charge feels $\\vec F = q\\vec v\\times\\vec B$.", items: [
      ...[[120, 70], [200, 70], [280, 70], [120, 160], [200, 160], [280, 160]].map(p => AST("field-out-of-page", p[0], p[1], 28, null, ANNOT.magnetic)),
      P(150, 115, 26, "q"), AR([168, 115], [260, 115], "velocity", "v"), AR([200, 100], [200, 55], "force", "\\vec F") ] },
    c2: { cap: "Right-hand rule gives the direction of $\\vec v\\times\\vec B$.", items: [
      AR([120, 150], [250, 150], "velocity", "v"), AR([120, 150], [120, 60], "force", "\\vec F"), AR([120, 150], [210, 100], "magnetic", "\\vec B") ] },
    c3: { cap: "A current-carrying wire in a field feels $\\vec F = I\\vec L\\times\\vec B$.", items: [
      LN([60, 115], [380, 115], { color: INK, width: 3 }), AR([120, 115], [300, 115], "current", "I"), AR([220, 100], [220, 55], "force", "\\vec F"),
      ...[[150, 160], [250, 160]].map(p => AST("field-out-of-page", p[0], p[1], 26, null, ANNOT.magnetic)) ] },
    c4: { cap: "The magnetic force curves a charge into a circle: $qvB = mv^2/r$.", items: [
      ...[[110, 70], [200, 70], [290, 70], [110, 165], [200, 165], [290, 165]].map(p => AST("field-into-page", p[0], p[1], 26, null, ANNOT.magnetic)),
      P(200, 118, 26, "q"), AST("current-loop", 200, 118, 120, null, ANNOT.velocity) ] },
    c5: { cap: "A current loop in a field feels a torque — the motor principle.", items: [
      AST("current-loop", 150, 115, 110, "loop", ANNOT.current), AST("bar-magnet", 320, 115, 90, null, INK), TX("torque", 150, 195) ] },
    e1: { cap: "A mass spectrometer bends ions by mass along circular paths.", items: [
      ...[[110, 70], [200, 70], [290, 70]].map(p => AST("field-into-page", p[0], p[1], 24, null, ANNOT.magnetic)),
      P(90, 150, 24, "ion"), AR([108, 150], [190, 150], "velocity", "v"), AST("current-loop", 240, 130, 100, null, ANNOT.velocity) ] },
    e2: { cap: "An electric motor spins a current loop between magnet poles.", items: [
      AST("bar-magnet", 200, 60, 120, null, INK), AST("current-loop", 200, 140, 110, "loop", ANNOT.current), TX("rotates", 300, 140) ] },
    e3: { cap: "The aurora: charged particles spiral along Earth's field lines.", items: [
      AST("field-lines-magnet", 200, 115, 190, null, ANNOT.magnetic), N(90, 90, 22, "e^-"), AR([108, 90], [160, 105], "velocity", "spiral in") ] }
  },
  "phys1442-09-magnetic-sources": {
    c1: { cap: "A straight current makes a circular field: $B = \\mu_0 I/2\\pi r$.", items: [
      LN([200, 40], [200, 190], { color: INK, width: 3 }), AR([200, 180], [200, 60], "current", "I"),
      AST("field-out-of-page", 300, 115, 30, null, ANNOT.magnetic), AST("field-into-page", 100, 115, 30, null, ANNOT.magnetic), M("B = \\mu_0 I/2\\pi r", 200, 205) ] },
    c2: { cap: "Each current element adds field (Biot–Savart); a loop concentrates it.", items: [
      AST("current-loop", 180, 115, 130, "I", ANNOT.current), AR([180, 90], [180, 45], "magnetic", "\\vec B") ] },
    c3: { cap: "Parallel currents attract; opposite currents repel.", items: [
      LN([120, 40], [120, 190], { color: INK, width: 3 }), LN([280, 40], [280, 190], { color: INK, width: 3 }),
      AR([120, 175], [120, 60], "current", "I_1"), AR([280, 175], [280, 60], "current", "I_2"),
      AR([140, 115], [180, 115], "force"), AR([260, 115], [220, 115], "force"), TX("attract", 200, 205) ] },
    c4: { cap: "A solenoid makes a uniform field inside: $B = \\mu_0 n I$.", items: [
      AST("solenoid", 190, 110, 200, null, INK), AR([100, 110], [280, 110], "magnetic", "\\vec B"), M("B = \\mu_0 n I", 200, 195) ] },
    c5: { cap: "Ampère's law relates the field around a loop to the enclosed current.", items: [
      LN([200, 40], [200, 190], { color: INK, width: 3 }), AR([200, 180], [200, 60], "current", "I_{enc}"), AST("current-loop", 200, 115, 150, null, ANNOT.magnetic), M("\\oint \\vec B\\cdot d\\vec l = \\mu_0 I", 200, 205) ] },
    e1: { cap: "An electromagnet: current through a solenoid makes a strong field.", items: [
      AST("solenoid", 190, 110, 200, "coil", INK), AR([100, 110], [280, 110], "magnetic", "\\vec B") ] },
    e2: { cap: "An MRI uses a huge, steady solenoid field to image the body.", items: [
      AST("solenoid", 190, 115, 210, "MRI coil", INK), AR([95, 115], [285, 115], "magnetic", "strong \\vec B") ] },
    e3: { cap: "Power lines carry current, so a magnetic field circles them.", items: [
      LN([200, 40], [200, 190], { color: INK, width: 3 }), AR([200, 180], [200, 60], "current", "I"),
      AST("field-out-of-page", 300, 115, 28, null, ANNOT.magnetic), AST("field-into-page", 100, 115, 28, null, ANNOT.magnetic) ] }
  },
  "phys1442-10-induction": {
    c1: { cap: "Magnetic flux = field through a loop: $\\Phi_B = BA\\cos\\theta$.", items: [
      AST("current-loop", 180, 115, 130, "area A", INK), ...[[150, 90], [210, 90], [150, 150], [210, 150]].map(p => AST("field-out-of-page", p[0], p[1], 22, null, ANNOT.magnetic)) ] },
    c2: { cap: "A changing flux induces a voltage: $\\varepsilon = -N\\,d\\Phi_B/dt$.", items: [
      AST("bar-magnet", 110, 115, 90, "move", INK), AR([160, 115], [230, 115], "velocity", "v"), AST("current-loop", 320, 115, 110, "loop", ANNOT.current) ] },
    c3: { cap: "Lenz's law: the induced current opposes the change in flux.", items: [
      AST("bar-magnet", 110, 115, 90, "N→", INK), AR([160, 115], [225, 115], "velocity"), AST("current-loop", 320, 115, 110, null, ANNOT.current), TX("induced I opposes", 320, 190) ] },
    c4: { cap: "A rod moving through a field makes motional EMF: $\\varepsilon = BLv$.", items: [
      ...[[110, 70], [200, 70], [290, 70], [110, 160], [200, 160], [290, 160]].map(p => AST("field-into-page", p[0], p[1], 24, null, ANNOT.magnetic)),
      LN([200, 55], [200, 175], { color: INK, width: 3 }), AR([210, 115], [300, 115], "velocity", "v"), M("\\varepsilon = BLv", 130, 115) ] },
    c5: { cap: "Spinning a loop in a field makes AC — a generator.", items: [
      AST("bar-magnet", 200, 60, 120, null, INK), AST("current-loop", 200, 140, 110, "rotate", ANNOT.current), AST("transverse-wave", 330, 140, 90, "AC", ANNOT.current) ] },
    e1: { cap: "Power plants spin coils in a field to generate electricity.", items: [
      AST("bar-magnet", 200, 60, 120, null, INK), AST("current-loop", 200, 140, 110, "turbine coil", ANNOT.current) ] },
    e2: { cap: "An induction cooktop induces eddy currents that heat the pan.", items: [
      AST("solenoid", 190, 150, 190, "coil", INK), AST("current-loop", 200, 80, 90, "eddy", ANNOT.current), AST("heat-flow", 300, 80, 44, null, ANNOT.current) ] },
    e3: { cap: "A vibrating string changes a pickup's flux, inducing the signal.", items: [
      AST("bar-magnet", 110, 130, 80, "magnet", INK), LN([60, 70], [360, 70], { color: INK, width: 2 }), TX("string", 210, 55), AST("current-loop", 300, 130, 90, "coil", ANNOT.current) ] }
  },
  "phys1442-11-ac-circuits": {
    c1: { cap: "An inductor opposes current change: $\\varepsilon = -L\\,dI/dt$.", items: [
      AST("solenoid", 190, 110, 190, "L", INK), AR([100, 110], [280, 110], "current", "I") ] },
    c2: { cap: "AC oscillates; rms values give the effective size ($V_{rms}=V_0/\\sqrt2$).", items: [
      AST("transverse-wave", 200, 110, 220, null, ANNOT.current), M("V_{rms} = V_0/\\sqrt2", 200, 195) ] },
    c3: { cap: "Reactance is AC opposition: $X_L=\\omega L$, $X_C=1/\\omega C$.", items: [
      AST("solenoid", 120, 110, 120, "X_L", INK), AST("capacitor", 300, 110, 80, "X_C", INK) ] },
    c4: { cap: "A series RLC combines into impedance $Z$.", w: 470, items: [
      AST("resistor", 110, 110, 90, "R", INK), AST("solenoid", 250, 110, 110, "L", INK), AST("capacitor", 390, 110, 70, "C", INK), M("Z=\\sqrt{R^2+(X_L-X_C)^2}", 240, 200) ] },
    c5: { cap: "At resonance $X_L=X_C$ and the current peaks: $\\omega_0=1/\\sqrt{LC}$.", items: [
      AST("transverse-wave", 200, 100, 200, null, ANNOT.current), M("\\omega_0 = 1/\\sqrt{LC}", 200, 190) ] },
    e1: { cap: "A radio tunes to one station by matching its resonant frequency.", items: [
      AST("solenoid", 120, 110, 110, "L", INK), AST("capacitor", 290, 110, 80, "tune C", INK), M("\\omega_0=1/\\sqrt{LC}", 200, 195) ] },
    e2: { cap: "A charger transforms and rectifies AC into steady DC.", items: [
      AST("transverse-wave", 110, 110, 120, "AC", ANNOT.current), AR([180, 110], [250, 110], "arrow"), LN([290, 110], [380, 110], { color: ANNOT.current, width: 3 }), TX("DC", 335, 90) ] },
    e3: { cap: "A ballast (inductor) limits the current through a fluorescent tube.", items: [
      AST("solenoid", 120, 110, 120, "ballast", INK), AST("light-bulb", 300, 110, 70, "tube", INK), AR([180, 150], [270, 150], "current", "limited I") ] }
  },
  "phys1442-12-em-waves": {
    c1: { cap: "Maxwell's four laws unify electricity, magnetism, and light.", items: [
      AST("field-lines-radial", 110, 115, 90, "E", ANNOT.field), AST("current-loop", 300, 115, 100, "B", ANNOT.magnetic), TX("→ light", 200, 200) ] },
    c2: { cap: "In an EM wave, $\\vec E$ and $\\vec B$ oscillate perpendicular to travel.", items: [
      AST("transverse-wave", 200, 90, 220, "E", ANNOT.field), AST("transverse-wave", 200, 155, 220, "B", ANNOT.magnetic), AR([60, 190], [360, 190], "velocity", "c") ] },
    c3: { cap: "All EM waves travel at $c = 1/\\sqrt{\\mu_0\\varepsilon_0}\\approx 3\\times10^8$ m/s.", items: [
      AST("transverse-wave", 200, 110, 240, null, ANNOT.field), AR([60, 160], [360, 160], "velocity", "c"), M("c \\approx 3\\times10^8\\,\\text{m/s}", 200, 200) ] },
    c4: { cap: "Wavelength sets the band, from radio to gamma (the spectrum).", items: [
      AST("wavelength-labeled", 130, 110, 150, "long \\lambda", ANNOT.field), AST("transverse-wave", 320, 110, 120, "short \\lambda", ANNOT.magnetic) ] },
    c5: { cap: "A polarizer passes one direction; $I = I_0\\cos^2\\theta$ (Malus).", items: [
      AST("transverse-wave", 120, 110, 120, null, ANNOT.field), AST("grid-square", 250, 110, 80, "polarizer", INK), M("I = I_0\\cos^2\\theta", 200, 195) ] },
    e1: { cap: "The spectrum spans radio → micro → visible → X-ray → gamma.", items: [
      AST("wavelength-labeled", 120, 110, 150, "radio", ANNOT.field), AST("transverse-wave", 320, 110, 120, "gamma", ANNOT.magnetic) ] },
    e2: { cap: "Polarized sunglasses block the horizontally-polarized glare.", items: [
      AST("transverse-wave", 110, 110, 110, "glare", ANNOT.field), AST("grid-square", 250, 110, 84, "polarizer", INK), TX("glare blocked", 340, 160) ] },
    e3: { cap: "LCDs switch light with liquid crystals between two polarizers.", items: [
      AST("grid-square", 120, 110, 76, "polarizer 1", INK), AST("grid-square", 300, 110, 76, "polarizer 2", INK), AR([170, 110], [250, 110], "field", "light") ] }
  },
  "phys1442-13-geometric-optics": {
    c1: { cap: "At a surface, light reflects and refracts (bends).", items: [
      LN([60, 150], [380, 150], { color: INK, width: 2 }), AR([100, 60], [200, 150], "velocity", "incident"), AR([200, 150], [300, 60], "velocity", "reflected"), AR([200, 150], [270, 195], "field", "refracted") ] },
    c2: { cap: "Index $n=c/v$ sets the bending: $n_1\\sin\\theta_1=n_2\\sin\\theta_2$.", items: [
      AST("ray-refraction", 200, 115, 150, null, INK), M("n_1\\sin\\theta_1=n_2\\sin\\theta_2", 200, 205) ] },
    c3: { cap: "Curved mirrors focus light to (or from) a focal point.", items: [
      AST("concave-mirror", 150, 115, 130, "mirror", INK), AR([320, 90], [200, 115], "velocity"), AR([320, 140], [200, 115], "velocity"), SYM("times", 235, 115, 5), TX("F", 250, 130) ] },
    c4: { cap: "Magnification $m=-d_i/d_o$; a negative sign means inverted.", items: [
      AST("converging-lens", 200, 115, 120, null, INK), AR([90, 115], [90, 75], "force", "object"), AR([310, 115], [310, 165], "field", "image"), M("m = -d_i/d_o", 200, 205) ] },
    c5: { cap: "Thin lens: $1/f = 1/d_o + 1/d_i$.", items: [
      AST("converging-lens", 200, 115, 130, null, INK), LN([40, 115], [360, 115], { color: ANNOT.leader, dashed: true }), SYM("times", 300, 115, 5), TX("F", 300, 132), M("\\tfrac{1}{f}=\\tfrac{1}{d_o}+\\tfrac{1}{d_i}", 200, 205) ] },
    e1: { cap: "Eyeglass lenses converge or diverge light to focus on the retina.", items: [
      AST("converging-lens", 150, 115, 120, "lens", INK), AR([250, 90], [320, 115], "velocity"), AR([250, 140], [320, 115], "velocity"), TX("focus", 335, 115, { anchor: "start" }) ] },
    e2: { cap: "Fiber optics trap light by total internal reflection.", items: [
      LN([50, 90], [390, 90], { color: INK, width: 2 }), LN([50, 150], [390, 150], { color: INK, width: 2 }),
      AR([60, 100], [140, 145], "velocity"), AR([140, 145], [220, 100], "velocity"), AR([220, 100], [300, 145], "velocity"), TX("fiber", 220, 70) ] },
    e3: { cap: "A convex passenger mirror widens the view (objects look smaller).", items: [
      AST("convex-mirror", 160, 115, 130, "mirror", INK), AR([300, 90], [200, 115], "velocity"), AR([300, 140], [200, 115], "velocity"), TX("wide view", 300, 175) ] }
  },
  "phys1442-14-interference-diffraction": {
    c1: { cap: "Converging lenses focus parallel light; diverging spread it.", items: [
      AST("converging-lens", 130, 115, 120, "converging", INK), AST("diverging-lens", 320, 115, 120, "diverging", INK) ] },
    c2: { cap: "Two slits interfere: bright fringes at $d\\sin\\theta = m\\lambda$.", items: [
      LN([90, 40], [90, 190], { color: INK, width: 2 }), SYM("minus", 90, 95, 6), SYM("minus", 90, 135, 6),
      AR([90, 95], [340, 70], "field"), AR([90, 135], [340, 160], "field"), LN([360, 40], [360, 190], { color: ANNOT.leader, width: 4 }), TX("fringes", 360, 205) ] },
    c3: { cap: "A single slit spreads light into a diffraction pattern.", items: [
      LN([100, 60], [100, 100], { color: INK, width: 3 }), LN([100, 130], [100, 190], { color: INK, width: 3 }),
      AR([100, 115], [330, 70], "field"), AR([100, 115], [330, 115], "field"), AR([100, 115], [330, 160], "field"), TX("slit", 100, 45) ] },
    c4: { cap: "A grating's many slits give sharp maxima: $d\\sin\\theta = m\\lambda$.", items: [
      AST("grid-square", 130, 115, 90, "grating", INK), AR([180, 115], [330, 70], "field"), AR([180, 115], [330, 160], "field"), M("d\\sin\\theta = m\\lambda", 250, 205) ] },
    c5: { cap: "Thin films interfere; resolution is limited by diffraction.", items: [
      LN([80, 90], [360, 90], { color: INK, width: 2 }), LN([80, 120], [360, 120], { color: INK, width: 2 }),
      AR([120, 55], [180, 90], "field", "in"), AR([180, 90], [240, 55], "field", "1"), AR([200, 120], [270, 60], "field", "2"), TX("thin film", 300, 140) ] },
    e1: { cap: "A CD's fine tracks act as a grating, splitting light into colors.", items: [
      AST("grid-square", 130, 115, 90, "tracks", INK), AR([180, 115], [330, 75], "field", "red"), AR([180, 115], [330, 155], "magnetic", "blue") ] },
    e2: { cap: "An anti-reflective coating cancels reflections by interference.", items: [
      LN([70, 100], [370, 100], { color: INK, width: 2 }), LN([70, 125], [370, 125], { color: INK, width: 2 }), TX("coating", 220, 145),
      AR([120, 60], [180, 100], "field", "in"), AR([180, 100], [240, 60], "field", "cancels") ] },
    e3: { cap: "A telescope's aperture sets the smallest detail it can resolve.", items: [
      AST("converging-lens", 150, 115, 120, "aperture", INK), SYM("times", 300, 100, 4), SYM("times", 300, 130, 4), TX("two stars", 330, 115, { anchor: "start" }) ] }
  }
};

// ---- render + wire ---------------------------------------------------------
if (fs.existsSync(OUT)) for (const f of fs.readdirSync(OUT)) if (/\.svg$/.test(f)) fs.unlinkSync(path.join(OUT, f)); // clear old
fs.mkdirSync(OUT, { recursive: true });

const manifest = { generated: new Date().toISOString(), source: "tools/build-lesson-diagrams.js", diagrams: [] };
const attribution = new Set();
let made = 0, wired = 0;

for (const lessonId of Object.keys(SPEC)) {
  const lessonFile = path.join(LDIR, lessonId + ".json");
  const lesson = JSON.parse(fs.readFileSync(lessonFile, "utf8"));
  const concepts = (lesson.concept_sections || []).slice().sort((a, b) => a.level - b.level);
  const examples = lesson.real_world_examples || [];
  const slots = SPEC[lessonId];

  const place = (slot, target) => {
    const s = slots[slot]; if (!s || !target) return;
    const id = lessonId + "-" + slot;
    const spec = { id, subject: "physics", title: s.t || "", canvas: { width: s.w || 440, height: s.h || 230, seed: "physics-" + lessonId }, items: (s.items || []).filter(it => it && it.type) };
    const { svg, manifest: m } = render(spec);
    fs.writeFileSync(path.join(OUT, id + ".svg"), svg + "\n");
    (m.attributionRequired || []).forEach(a => attribution.add(a));
    manifest.diagrams.push({ id, subject: "physics", file: "data/diagrams/" + id + ".svg", assets: m.assets });
    target.figure = { type: "svg", src: "data/diagrams/" + id + ".svg", caption: s.cap || "" };
    made++; wired++;
  };
  concepts.forEach((c, i) => place("c" + (i + 1), c));
  examples.forEach((e, i) => place("e" + (i + 1), e));

  fs.writeFileSync(lessonFile, JSON.stringify(lesson, null, 2) + "\n");
}

manifest.attribution = [...attribution];
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("rendered " + made + " diagrams, wired " + wired + " figures across " + Object.keys(SPEC).length + " lessons");
console.log("attribution required: " + (attribution.size ? [...attribution].join("; ") : "none (all StudyMAF-authored, MIT)"));
