/* StudyMAF — original authored STEM SVG assets (the value-add of the visual library).
 *
 * These are hand-crafted, monochrome, currentColor line diagrams in one clean,
 * minimal, sophisticated educational style (no cartoon/emoji). They cover the
 * math/physics/engineering/architecture primitives that generic icon sets lack.
 *
 * Style contract:
 *   - fill:none, stroke:currentColor so the diagram engine can recolor freely
 *   - round caps/joins; stroke-width tuned per canvas
 *   - small primitives on a 24 grid (match the icon libraries); composite
 *     diagrams on a larger natural canvas
 *   - semantic +/- glyphs and labels drawn in currentColor (color is applied later)
 *
 * This module is the source of truth. `build.js` writes each entry to
 * studymaf-visual-library/<path>. Add assets here, not as loose files.
 */
"use strict";
const S = (w, h, inner, sw) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" stroke-width="${sw || 1.5}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
// text helper (labels use fill, no stroke)
const T = (x, y, s, size) => `<text x="${x}" y="${y}" fill="currentColor" stroke="none" font-family="Georgia, serif" font-style="italic" font-size="${size || 9}" text-anchor="middle" dominant-baseline="middle">${s}</text>`;

const AUTHORED = {

  // ============================ diagram-components ============================
  "diagram-components/arrows/arrow-right.svg": S(24, 24, `<line x1="3" y1="12" x2="19" y2="12"/><polyline points="14 7 20 12 14 17"/>`),
  "diagram-components/arrows/arrow-double.svg": S(24, 24, `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="9 8 5 12 9 16"/><polyline points="15 8 19 12 15 16"/>`),
  "diagram-components/arrows/arrow-curved.svg": S(24, 24, `<path d="M4 16 C 6 6, 16 4, 20 8"/><polyline points="15 7 20 8 19 13"/>`),
  "diagram-components/arrows/arrow-block.svg": S(24, 24, `<path d="M3 9 L13 9 L13 5 L21 12 L13 19 L13 15 L3 15 Z"/>`),
  "diagram-components/arrows/arrow-dashed.svg": S(24, 24, `<line x1="3" y1="12" x2="18" y2="12" stroke-dasharray="3 3"/><polyline points="14 7 20 12 14 17"/>`),
  "diagram-components/arrows/arrow-return.svg": S(24, 24, `<path d="M20 8 H8 a4 4 0 0 0 0 8 h3"/><polyline points="11 12 7 16 11 20"/>`),

  "diagram-components/axes/axes-2d.svg": S(48, 48, `<line x1="24" y1="44" x2="24" y2="5"/><polyline points="21 9 24 5 27 9"/><line x1="4" y1="24" x2="43" y2="24"/><polyline points="39 21 43 24 39 27"/>${T(29, 10, "y", 8)}${T(40, 20, "x", 8)}`),
  "diagram-components/axes/axes-quadrant1.svg": S(48, 48, `<line x1="8" y1="44" x2="8" y2="5"/><polyline points="5 9 8 5 11 9"/><line x1="6" y1="42" x2="44" y2="42"/><polyline points="40 39 44 42 40 45"/>`),
  "diagram-components/axes/axes-3d.svg": S(60, 60, `<line x1="20" y1="42" x2="20" y2="8"/><polyline points="17 12 20 8 23 12"/><line x1="20" y1="42" x2="54" y2="42"/><polyline points="50 39 54 42 50 45"/><line x1="20" y1="42" x2="6" y2="54"/><polyline points="12 51 6 54 9 48"/>`),

  "diagram-components/grids/grid-square.svg": S(48, 48, `<rect x="4" y="4" width="40" height="40" rx="1"/><line x1="14" y1="4" x2="14" y2="44"/><line x1="24" y1="4" x2="24" y2="44"/><line x1="34" y1="4" x2="34" y2="44"/><line x1="4" y1="14" x2="44" y2="14"/><line x1="4" y1="24" x2="44" y2="24"/><line x1="4" y1="34" x2="44" y2="34"/>`, 1),
  "diagram-components/grids/grid-dots.svg": S(48, 48, `${[10, 20, 30, 38].flatMap(y => [10, 20, 30, 38].map(x => `<circle cx="${x}" cy="${y}" r="1.1" fill="currentColor" stroke="none"/>`)).join("")}`),
  "diagram-components/grids/grid-polar.svg": S(48, 48, `<circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="12"/><circle cx="24" cy="24" r="6"/><line x1="6" y1="24" x2="42" y2="24"/><line x1="24" y1="6" x2="24" y2="42"/><line x1="11" y1="11" x2="37" y2="37"/><line x1="37" y1="11" x2="11" y2="37"/>`, 1),

  "diagram-components/dimensions/dimension-horizontal.svg": S(48, 24, `<line x1="6" y1="8" x2="6" y2="18"/><line x1="42" y1="8" x2="42" y2="18"/><line x1="6" y1="13" x2="42" y2="13"/><polyline points="10 10 6 13 10 16"/><polyline points="38 10 42 13 38 16"/>`, 1.2),
  "diagram-components/dimensions/dimension-vertical.svg": S(24, 48, `<line x1="8" y1="6" x2="18" y2="6"/><line x1="8" y1="42" x2="18" y2="42"/><line x1="13" y1="6" x2="13" y2="42"/><polyline points="10 10 13 6 16 10"/><polyline points="10 38 13 42 16 38"/>`, 1.2),
  "diagram-components/dimensions/dimension-radius.svg": S(48, 48, `<circle cx="24" cy="24" r="18"/><line x1="24" y1="24" x2="42" y2="24"/><polyline points="38 21 42 24 38 27"/><circle cx="24" cy="24" r="1.3" fill="currentColor" stroke="none"/>${T(33, 20, "r", 8)}`, 1.2),
  "diagram-components/dimensions/dimension-angle.svg": S(48, 48, `<line x1="8" y1="40" x2="42" y2="40"/><line x1="8" y1="40" x2="40" y2="12"/><path d="M26 40 A18 18 0 0 0 20 27"/>`, 1.3),

  "diagram-components/labels/leader-line.svg": S(48, 24, `<circle cx="10" cy="16" r="2" fill="currentColor" stroke="none"/><polyline points="10 16 24 8 42 8"/>`, 1.2),
  "diagram-components/labels/label-dot.svg": S(24, 24, `<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>`),

  "diagram-components/callouts/callout-rounded.svg": S(48, 36, `<path d="M6 4 h36 a4 4 0 0 1 4 4 v14 a4 4 0 0 1 -4 4 h-22 l-6 6 v-6 h-8 a4 4 0 0 1 -4 -4 v-14 a4 4 0 0 1 4 -4 z"/>`, 1.3),
  "diagram-components/callouts/callout-circle.svg": S(48, 48, `<circle cx="18" cy="18" r="12"/><line x1="27" y1="27" x2="42" y2="42"/>`, 1.5),

  // ================================ mathematics ================================
  // -- coordinate systems --
  "mathematics/coordinate-systems/coordinate-plane.svg": S(120, 120, `<line x1="60" y1="112" x2="60" y2="8"/><polyline points="56 14 60 8 64 14"/><line x1="8" y1="60" x2="112" y2="60"/><polyline points="106 56 112 60 106 64"/>${[20, 40, 80, 100].map(v => `<line x1="${v}" y1="57" x2="${v}" y2="63"/><line x1="57" y1="${v}" x2="63" y2="${v}"/>`).join("")}${T(66, 14, "y")}${T(107, 54, "x")}`, 1.4),
  "mathematics/coordinate-systems/coordinate-plane-q1.svg": S(120, 120, `<line x1="16" y1="110" x2="16" y2="10"/><polyline points="12 16 16 10 20 16"/><line x1="12" y1="104" x2="112" y2="104"/><polyline points="106 100 112 104 106 108"/>${[36, 56, 76, 96].map(x => `<line x1="${x}" y1="101" x2="${x}" y2="107"/>`).join("")}${[24, 44, 64, 84].map(y => `<line x1="13" y1="${y}" x2="19" y2="${y}"/>`).join("")}`, 1.4),
  "mathematics/coordinate-systems/polar-plane.svg": S(120, 120, `<circle cx="60" cy="60" r="48"/><circle cx="60" cy="60" r="32"/><circle cx="60" cy="60" r="16"/><line x1="12" y1="60" x2="108" y2="60"/><line x1="60" y1="12" x2="60" y2="108"/><line x1="26" y1="26" x2="94" y2="94"/><line x1="94" y1="26" x2="26" y2="94"/>`, 1),
  "mathematics/coordinate-systems/number-line.svg": S(160, 40, `<line x1="10" y1="20" x2="150" y2="20"/><polyline points="146 16 150 20 146 24"/><polyline points="14 16 10 20 14 24"/>${[30, 55, 80, 105, 130].map(x => `<line x1="${x}" y1="15" x2="${x}" y2="25"/>`).join("")}`, 1.4),
  "mathematics/coordinate-systems/number-line-point.svg": S(160, 40, `<line x1="10" y1="20" x2="150" y2="20"/><polyline points="146 16 150 20 146 24"/><polyline points="14 16 10 20 14 24"/>${[30, 55, 80, 105, 130].map(x => `<line x1="${x}" y1="15" x2="${x}" y2="25"/>`).join("")}<circle cx="105" cy="20" r="4.5" fill="currentColor" stroke="none"/>`, 1.4),

  // -- graphs --
  "mathematics/graphs/line-linear.svg": S(120, 120, `<line x1="60" y1="112" x2="60" y2="8"/><line x1="8" y1="60" x2="112" y2="60"/><line x1="18" y1="96" x2="102" y2="24"/>`, 1.4),
  "mathematics/graphs/parabola.svg": S(120, 120, `<line x1="60" y1="112" x2="60" y2="8"/><line x1="8" y1="60" x2="112" y2="60"/><path d="M20 22 Q60 118 100 22" stroke-width="2"/>`, 1.4),
  "mathematics/graphs/parabola-down.svg": S(120, 120, `<line x1="60" y1="112" x2="60" y2="8"/><line x1="8" y1="60" x2="112" y2="60"/><path d="M20 98 Q60 2 100 98" stroke-width="2"/>`, 1.4),
  "mathematics/graphs/cubic.svg": S(120, 120, `<line x1="60" y1="112" x2="60" y2="8"/><line x1="8" y1="60" x2="112" y2="60"/><path d="M22 104 C40 104 48 20 60 60 C72 100 80 16 98 16" stroke-width="2"/>`, 1.4),
  "mathematics/graphs/sine-wave.svg": S(140, 80, `<line x1="8" y1="40" x2="134" y2="40"/><path d="M12 40 C 27 4, 43 4, 54 40 C 65 76, 81 76, 96 40 C 107 4, 123 4, 132 40" stroke-width="2"/>`, 1.3),
  "mathematics/graphs/cosine-wave.svg": S(140, 80, `<line x1="8" y1="40" x2="134" y2="40"/><path d="M12 8 C 24 8, 30 72, 42 72 C 54 72, 60 8, 72 8 C 84 8, 90 72, 102 72 C 114 72, 120 8, 132 8" stroke-width="2"/>`, 1.3),
  "mathematics/graphs/exponential.svg": S(120, 120, `<line x1="60" y1="112" x2="60" y2="8"/><line x1="8" y1="60" x2="112" y2="60"/><path d="M14 104 C 50 100, 66 90, 78 60 C 90 30, 96 16, 104 12" stroke-width="2"/>`, 1.4),
  "mathematics/graphs/absolute-value.svg": S(120, 120, `<line x1="60" y1="112" x2="60" y2="8"/><line x1="8" y1="60" x2="112" y2="60"/><polyline points="20 24 60 60 100 24" stroke-width="2"/>`, 1.4),

  // -- calculus --
  "mathematics/calculus/tangent-line.svg": S(120, 120, `<line x1="8" y1="60" x2="112" y2="60"/><path d="M18 96 Q60 118 102 24" stroke-width="2"/><line x1="30" y1="94" x2="96" y2="34"/><circle cx="66" cy="58" r="3" fill="currentColor" stroke="none"/>`, 1.4),
  "mathematics/calculus/secant-line.svg": S(120, 120, `<line x1="8" y1="60" x2="112" y2="60"/><path d="M18 96 Q60 118 102 24" stroke-width="2"/><line x1="34" y1="88" x2="92" y2="34"/><circle cx="34" cy="88" r="3" fill="currentColor" stroke="none"/><circle cx="92" cy="34" r="3" fill="currentColor" stroke="none"/>`, 1.4),
  "mathematics/calculus/area-under-curve.svg": S(120, 120, `<line x1="14" y1="100" x2="112" y2="100"/><line x1="20" y1="106" x2="20" y2="14"/><path d="M20 40 C 45 30, 70 78, 100 34" stroke-width="2"/><path d="M20 40 C 45 30, 70 78, 100 34 L100 100 L20 100 Z" fill="currentColor" fill-opacity="0.12" stroke="none"/>`, 1.4),
  "mathematics/calculus/riemann-rectangles.svg": S(120, 120, `<line x1="14" y1="100" x2="112" y2="100"/><line x1="20" y1="106" x2="20" y2="14"/><path d="M20 44 C 45 34, 70 74, 100 40" stroke-width="1.8"/>${[20, 36, 52, 68, 84].map((x, i) => { const ys = [58, 46, 46, 60, 52][i]; return `<rect x="${x}" y="${ys}" width="16" height="${100 - ys}" fill="currentColor" fill-opacity="0.1"/>`; }).join("")}`, 1.2),
  "mathematics/calculus/limit-hole.svg": S(120, 120, `<line x1="8" y1="60" x2="112" y2="60"/><line x1="60" y1="112" x2="60" y2="8"/><path d="M16 30 L52 66" stroke-width="2"/><path d="M68 54 L104 90" stroke-width="2"/><circle cx="60" cy="60" r="3.5" fill="#fff"/>`, 1.4),
  "mathematics/calculus/slope-field.svg": S(120, 120, `${[24, 48, 72, 96].flatMap((x, i) => [24, 48, 72, 96].map((y, j) => { const a = (i + j) * 0.5 - 1; const dx = 7 * Math.cos(a), dy = 7 * Math.sin(a); return `<line x1="${(x - dx).toFixed(1)}" y1="${(y - dy).toFixed(1)}" x2="${(x + dx).toFixed(1)}" y2="${(y + dy).toFixed(1)}"/>`; })).join("")}`, 1.2),

  // -- geometry --
  "mathematics/geometry/triangle.svg": S(80, 80, `<polygon points="14 66 66 66 40 16"/>`, 1.6),
  "mathematics/geometry/triangle-right.svg": S(80, 80, `<polygon points="16 64 66 64 16 20"/><rect x="16" y="56" width="8" height="8"/>`, 1.6),
  "mathematics/geometry/circle-radius.svg": S(80, 80, `<circle cx="40" cy="40" r="30"/><line x1="40" y1="40" x2="70" y2="40"/><circle cx="40" cy="40" r="1.6" fill="currentColor" stroke="none"/>${T(55, 35, "r")}`, 1.5),
  "mathematics/geometry/square.svg": S(80, 80, `<rect x="16" y="16" width="48" height="48"/>`, 1.6),
  "mathematics/geometry/rectangle.svg": S(90, 70, `<rect x="12" y="16" width="66" height="38"/>`, 1.6),
  "mathematics/geometry/parallelogram.svg": S(90, 70, `<polygon points="12 54 30 16 78 16 60 54"/>`, 1.6),
  "mathematics/geometry/trapezoid.svg": S(90, 70, `<polygon points="12 54 30 16 60 16 78 54"/>`, 1.6),
  "mathematics/geometry/angle-arc.svg": S(80, 80, `<line x1="14" y1="62" x2="70" y2="62"/><line x1="14" y1="62" x2="64" y2="22"/><path d="M40 62 A26 26 0 0 0 34 45"/>`, 1.5),
  "mathematics/geometry/protractor.svg": S(120, 72, `<path d="M12 62 A48 48 0 0 1 108 62 Z"/><path d="M28 62 A32 32 0 0 1 92 62"/>${[0, 30, 60, 90, 120, 150, 180].map(a => { const r1 = 48, r2 = 42, cx = 60, cy = 62, rad = Math.PI - a * Math.PI / 180; return `<line x1="${(cx + r2 * Math.cos(rad)).toFixed(1)}" y1="${(cy - r2 * Math.sin(rad)).toFixed(1)}" x2="${(cx + r1 * Math.cos(rad)).toFixed(1)}" y2="${(cy - r1 * Math.sin(rad)).toFixed(1)}"/>`; }).join("")}`, 1.2),

  // -- trigonometry --
  "mathematics/trigonometry/unit-circle.svg": S(120, 120, `<circle cx="60" cy="60" r="44"/><line x1="10" y1="60" x2="110" y2="60"/><line x1="60" y1="110" x2="60" y2="10"/><line x1="60" y1="60" x2="91" y2="29"/><line x1="91" y1="29" x2="91" y2="60"/><path d="M78 60 A18 18 0 0 0 73 47"/><circle cx="91" cy="29" r="2.5" fill="currentColor" stroke="none"/>`, 1.3),
  "mathematics/trigonometry/right-triangle-labeled.svg": S(120, 90, `<polygon points="16 74 104 74 16 20"/><rect x="16" y="66" width="8" height="8"/>${T(60, 82, "adjacent", 8)}${T(8, 47, "opp", 8)}${T(68, 40, "hyp", 8)}`, 1.5),
  "mathematics/trigonometry/angle-standard.svg": S(120, 120, `<line x1="10" y1="60" x2="110" y2="60"/><line x1="60" y1="110" x2="60" y2="10"/><line x1="60" y1="60" x2="100" y2="34"/><polyline points="94 33 100 34 97 40"/><path d="M80 60 A20 20 0 0 0 74 46"/><circle cx="60" cy="60" r="1.6" fill="currentColor" stroke="none"/>`, 1.3),

  // -- algebra --
  "mathematics/algebra/balance-scale.svg": S(120, 90, `<line x1="60" y1="14" x2="60" y2="70"/><line x1="24" y1="26" x2="96" y2="26"/><path d="M14 26 l10 20 h-20 z"/><path d="M106 26 l10 20 h-20 z"/><line x1="46" y1="80" x2="74" y2="80"/><path d="M52 80 l8 -10 l8 10"/>`, 1.4),
  "mathematics/algebra/function-machine.svg": S(120, 90, `<rect x="34" y="24" width="52" height="42" rx="4"/><line x1="8" y1="45" x2="34" y2="45"/><polyline points="30 41 34 45 30 49"/><line x1="86" y1="45" x2="112" y2="45"/><polyline points="108 41 112 45 108 49"/>${T(60, 46, "f", 14)}`, 1.4),
  "mathematics/algebra/bar-model.svg": S(120, 60, `<rect x="10" y="16" width="100" height="16"/><line x1="35" y1="16" x2="35" y2="32"/><line x1="60" y1="16" x2="60" y2="32"/><line x1="85" y1="16" x2="85" y2="32"/><rect x="10" y="40" width="50" height="12"/>`, 1.3),

};

module.exports = { AUTHORED, S, T };
