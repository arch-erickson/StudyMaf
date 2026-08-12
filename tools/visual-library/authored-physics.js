/* StudyMAF — authored PHYSICS SVG assets (part of the visual library).
 * Same style contract as authored.js: monochrome currentColor line art. */
"use strict";
const { S, T } = require("./authored.js");

const PHYSICS = {

  // ================================ mechanics ================================
  "physics/mechanics/force-arrow.svg": S(60, 24, `<line x1="6" y1="12" x2="48" y2="12" stroke-width="2"/><polyline points="42 6 52 12 42 18" stroke-width="2"/>${T(30, 6, "F", 9)}`),
  "physics/mechanics/velocity-arrow.svg": S(60, 24, `<line x1="6" y1="12" x2="48" y2="12" stroke-width="2"/><polyline points="42 6 52 12 42 18" stroke-width="2"/>${T(30, 6, "v", 9)}`),
  "physics/mechanics/acceleration-arrow.svg": S(60, 24, `<line x1="6" y1="12" x2="48" y2="12" stroke-width="2"/><polyline points="42 6 52 12 42 18" stroke-width="2"/>${T(30, 6, "a", 9)}`),
  "physics/mechanics/weight-gravity.svg": S(40, 60, `<rect x="10" y="8" width="20" height="16" rx="2"/><line x1="20" y1="26" x2="20" y2="50" stroke-width="2"/><polyline points="14 44 20 52 26 44" stroke-width="2"/>${T(30, 40, "mg", 8)}`),
  "physics/mechanics/normal-force.svg": S(40, 60, `<rect x="10" y="34" width="20" height="16" rx="2"/><line x1="8" y1="52" x2="32" y2="52"/><line x1="20" y1="32" x2="20" y2="8" stroke-width="2"/><polyline points="14 14 20 6 26 14" stroke-width="2"/>${T(30, 14, "N", 8)}`),
  "physics/mechanics/friction-force.svg": S(70, 40, `<rect x="26" y="10" width="22" height="14" rx="2"/><line x1="6" y1="26" x2="64" y2="26"/>${[10, 16, 22, 28, 34, 40, 46, 52, 58].map(x => `<line x1="${x}" y1="26" x2="${x - 4}" y2="31"/>`).join("")}<line x1="24" y1="17" x2="8" y2="17" stroke-width="1.8"/><polyline points="12 13 6 17 12 21" stroke-width="1.8"/>${T(14, 8, "f", 8)}`),
  "physics/mechanics/inclined-plane.svg": S(120, 80, `<polygon points="10 68 110 68 110 20"/><rect x="78" y="30" width="18" height="14" transform="rotate(-25.6 87 37)"/>`, 1.6),
  "physics/mechanics/block-on-incline.svg": S(120, 90, `<polygon points="12 74 112 74 112 22"/><g transform="rotate(-27.5 84 44)"><rect x="72" y="34" width="22" height="18" rx="1"/><line x1="83" y1="43" x2="83" y2="70" stroke-width="1.6"/><polyline points="79 64 83 71 87 64" stroke-width="1.6"/></g><path d="M92 74 A20 20 0 0 0 86 60"/>`, 1.5),
  "physics/mechanics/spring.svg": S(120, 30, `<line x1="6" y1="15" x2="20" y2="15"/><polyline points="20 15 26 6 34 24 42 6 50 24 58 6 66 24 74 6 82 24 90 15"/><line x1="90" y1="15" x2="104" y2="15"/><line x1="104" y1="6" x2="104" y2="24"/>`, 1.5),
  "physics/mechanics/spring-mass.svg": S(70, 120, `<line x1="10" y1="8" x2="60" y2="8"/><polyline points="35 8 35 18 26 22 44 30 26 38 44 46 26 54 44 62 35 66 35 74"/><rect x="20" y="74" width="30" height="26" rx="2"/>${T(35, 87, "m", 10)}`, 1.5),
  "physics/mechanics/pendulum.svg": S(90, 100, `<line x1="10" y1="12" x2="80" y2="12"/><line x1="45" y1="12" x2="70" y2="76" stroke-dasharray="3 3"/><line x1="45" y1="12" x2="45" y2="84"/><circle cx="45" cy="88" r="8" fill="currentColor" fill-opacity="0.12"/><path d="M45 42 A30 30 0 0 1 56 46"/>`, 1.4),
  "physics/mechanics/pulley.svg": S(90, 100, `<circle cx="45" cy="20" r="12"/><circle cx="45" cy="20" r="2" fill="currentColor" stroke="none"/><line x1="33" y1="20" x2="33" y2="74"/><line x1="57" y1="20" x2="57" y2="60"/><rect x="24" y="74" width="18" height="16" rx="1"/><rect x="48" y="60" width="18" height="16" rx="1"/>`, 1.5),
  "physics/mechanics/projectile-path.svg": S(120, 80, `<line x1="12" y1="70" x2="112" y2="70"/><path d="M14 70 Q60 -2 106 70" stroke-dasharray="4 3" stroke-width="1.8"/><line x1="14" y1="70" x2="34" y2="50" stroke-width="1.8"/><polyline points="30 50 35 49 34 54" stroke-width="1.8"/>`, 1.4),
  "physics/mechanics/free-body-diagram.svg": S(100, 100, `<circle cx="50" cy="50" r="9"/><line x1="50" y1="41" x2="50" y2="14" stroke-width="1.8"/><polyline points="45 20 50 12 55 20" stroke-width="1.8"/><line x1="50" y1="59" x2="50" y2="86" stroke-width="1.8"/><polyline points="45 80 50 88 55 80" stroke-width="1.8"/><line x1="59" y1="50" x2="86" y2="50" stroke-width="1.8"/><polyline points="80 45 88 50 80 55" stroke-width="1.8"/><line x1="41" y1="50" x2="14" y2="50" stroke-width="1.8"/><polyline points="20 45 12 50 20 55" stroke-width="1.8"/>`, 1.4),
  "physics/mechanics/lever.svg": S(120, 70, `<line x1="12" y1="40" x2="108" y2="40" stroke-width="2"/><polygon points="60 40 52 58 68 58"/><line x1="24" y1="40" x2="24" y2="22" stroke-width="1.8"/><polyline points="20 28 24 20 28 28" stroke-width="1.8"/><rect x="86" y="26" width="16" height="14"/>`, 1.5),

  // ================================ electricity ================================
  "physics/electricity/charge-positive.svg": S(30, 30, `<circle cx="15" cy="15" r="11"/><line x1="15" y1="9" x2="15" y2="21" stroke-width="2"/><line x1="9" y1="15" x2="21" y2="15" stroke-width="2"/>`, 1.6),
  "physics/electricity/charge-negative.svg": S(30, 30, `<circle cx="15" cy="15" r="11"/><line x1="9" y1="15" x2="21" y2="15" stroke-width="2"/>`, 1.6),
  "physics/electricity/field-lines-radial.svg": S(100, 100, `<circle cx="50" cy="50" r="9"/><line x1="50" y1="9" x2="50" y2="21" stroke-width="2"/><line x1="44" y1="15" x2="56" y2="15" stroke-width="2"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return `<line x1="${(50 + 14 * c).toFixed(1)}" y1="${(50 + 14 * s).toFixed(1)}" x2="${(50 + 40 * c).toFixed(1)}" y2="${(50 + 40 * s).toFixed(1)}"/><polyline points="${(50 + 34 * c - 3 * s).toFixed(1)} ${(50 + 34 * s + 3 * c).toFixed(1)} ${(50 + 40 * c).toFixed(1)} ${(50 + 40 * s).toFixed(1)} ${(50 + 34 * c + 3 * s).toFixed(1)} ${(50 + 34 * s - 3 * c).toFixed(1)}"/>`; }).join("")}`, 1.2),
  "physics/electricity/parallel-plates.svg": S(100, 80, `<rect x="18" y="14" width="64" height="4" fill="currentColor"/><rect x="18" y="62" width="64" height="4" fill="currentColor"/>${[30, 45, 60, 75].map(x => `<line x1="${x}" y1="20" x2="${x}" y2="60"/><polyline points="${x - 3} 54 ${x} 60 ${x + 3} 54"/>`).join("")}${T(9, 12, "+", 12)}${T(9, 66, "−", 12)}`, 1.3),
  "physics/electricity/resistor.svg": S(90, 24, `<line x1="6" y1="12" x2="24" y2="12"/><polyline points="24 12 29 5 37 19 45 5 53 19 61 5 66 12"/><line x1="66" y1="12" x2="84" y2="12"/>`, 1.5),
  "physics/electricity/battery-cell.svg": S(60, 40, `<line x1="6" y1="20" x2="24" y2="20"/><line x1="24" y1="8" x2="24" y2="32" stroke-width="2.4"/><line x1="34" y1="14" x2="34" y2="26"/><line x1="34" y1="20" x2="54" y2="20"/>${T(20, 8, "+", 9)}`, 1.5),
  "physics/electricity/capacitor.svg": S(60, 40, `<line x1="6" y1="20" x2="26" y2="20"/><line x1="26" y1="8" x2="26" y2="32" stroke-width="2"/><line x1="34" y1="8" x2="34" y2="32" stroke-width="2"/><line x1="34" y1="20" x2="54" y2="20"/>`, 1.5),
  "physics/electricity/light-bulb.svg": S(40, 40, `<circle cx="20" cy="20" r="12"/><path d="M14 14 l12 12 M26 14 l-12 12"/>`, 1.4),
  "physics/electricity/switch.svg": S(60, 30, `<line x1="6" y1="20" x2="20" y2="20"/><circle cx="20" cy="20" r="2" fill="currentColor" stroke="none"/><line x1="20" y1="20" x2="42" y2="9"/><circle cx="42" cy="20" r="2" fill="currentColor" stroke="none"/><line x1="42" y1="20" x2="56" y2="20"/>`, 1.5),
  "physics/electricity/circuit-series.svg": S(120, 90, `<rect x="14" y="16" width="92" height="58" rx="2"/><line x1="40" y1="16" x2="40" y2="8"/><line x1="52" y1="10" x2="52" y2="6" stroke-width="2.2"/><line x1="46" y1="16" x2="46" y2="10"/><g transform="translate(0,0)"><polyline points="72 16 77 9 85 23 93 9 98 16" fill="none"/></g>`, 1.4),

  // ================================ magnetism ================================
  "physics/magnetism/bar-magnet.svg": S(100, 40, `<rect x="14" y="12" width="72" height="16" rx="2"/><line x1="50" y1="12" x2="50" y2="28"/>${T(32, 20, "N", 9)}${T(68, 20, "S", 9)}`, 1.5),
  "physics/magnetism/field-lines-magnet.svg": S(120, 90, `<rect x="40" y="38" width="40" height="14" rx="1"/><line x1="60" y1="38" x2="60" y2="52"/>${T(50, 45, "N", 8)}${T(70, 45, "S", 8)}<path d="M78 40 C 104 22, 104 68, 78 50"/><path d="M78 44 C 96 34, 96 56, 78 48"/><path d="M42 40 C 16 22, 16 68, 42 50"/><path d="M42 44 C 24 34, 24 56, 42 48"/>`, 1.2),
  "physics/magnetism/solenoid.svg": S(120, 50, `<line x1="8" y1="25" x2="20" y2="25"/>${[24, 36, 48, 60, 72, 84, 96].map(x => `<ellipse cx="${x}" cy="25" rx="4" ry="12"/>`).join("")}<line x1="100" y1="25" x2="112" y2="25"/>`, 1.3),
  "physics/magnetism/field-into-page.svg": S(30, 30, `<circle cx="15" cy="15" r="11"/><line x1="9" y1="9" x2="21" y2="21"/><line x1="21" y1="9" x2="9" y2="21"/>`, 1.4),
  "physics/magnetism/field-out-of-page.svg": S(30, 30, `<circle cx="15" cy="15" r="11"/><circle cx="15" cy="15" r="2.4" fill="currentColor" stroke="none"/>`, 1.4),
  "physics/magnetism/current-loop.svg": S(80, 80, `<ellipse cx="40" cy="40" rx="26" ry="30"/><polyline points="60 30 66 34 62 40"/><line x1="40" y1="40" x2="40" y2="14" stroke-dasharray="3 3"/><polyline points="36 20 40 12 44 20"/>`, 1.4),
  "physics/magnetism/compass.svg": S(50, 50, `<circle cx="25" cy="25" r="20"/><polygon points="25 8 30 25 25 42 20 25" fill="currentColor" fill-opacity="0.12"/><circle cx="25" cy="25" r="2" fill="currentColor" stroke="none"/>`, 1.4),

  // ================================ waves ================================
  "physics/waves/transverse-wave.svg": S(140, 60, `<line x1="8" y1="30" x2="132" y2="30" stroke-dasharray="2 3"/><path d="M12 30 C 24 4, 40 4, 52 30 C 64 56, 80 56, 92 30 C 104 4, 120 4, 130 30" stroke-width="2"/>`, 1.3),
  "physics/waves/wavelength-labeled.svg": S(140, 70, `<path d="M12 34 C 24 8, 40 8, 52 34 C 64 60, 80 60, 92 34 C 104 8, 120 8, 130 34" stroke-width="2"/><line x1="32" y1="50" x2="112" y2="50"/><polyline points="36 46 32 50 36 54"/><polyline points="108 46 112 50 108 54"/>${T(72, 62, "λ", 11)}`, 1.3),
  "physics/waves/longitudinal-wave.svg": S(140, 40, `${[14, 20, 26, 40, 62, 66, 70, 84, 106, 112, 118].map(x => `<line x1="${x}" y1="12" x2="${x}" y2="28"/>`).join("")}`, 1.3),
  "physics/waves/standing-wave.svg": S(140, 60, `<path d="M12 30 C 24 6, 40 6, 52 30 C 64 54, 80 54, 92 30 C 104 6, 120 6, 130 30" stroke-width="1.6"/><path d="M12 30 C 24 54, 40 54, 52 30 C 64 6, 80 6, 92 30 C 104 54, 120 54, 130 30" stroke-width="1.6" stroke-dasharray="4 3"/>`, 1.3),

  // ================================ optics ================================
  "physics/optics/converging-lens.svg": S(70, 90, `<path d="M35 8 Q49 45 35 82 Q21 45 35 8 Z"/><line x1="4" y1="45" x2="66" y2="45" stroke-dasharray="3 3"/><circle cx="16" cy="45" r="1.6" fill="currentColor" stroke="none"/><circle cx="54" cy="45" r="1.6" fill="currentColor" stroke="none"/>`, 1.4),
  "physics/optics/diverging-lens.svg": S(70, 90, `<path d="M28 8 Q40 45 28 82 L42 82 Q30 45 42 8 Z"/><line x1="4" y1="45" x2="66" y2="45" stroke-dasharray="3 3"/>`, 1.4),
  "physics/optics/concave-mirror.svg": S(70, 90, `<path d="M46 8 Q22 45 46 82"/><path d="M46 8 Q22 45 46 82" transform="translate(3,0)"/><line x1="8" y1="45" x2="62" y2="45" stroke-dasharray="3 3"/><circle cx="30" cy="45" r="1.6" fill="currentColor" stroke="none"/>`, 1.4),
  "physics/optics/convex-mirror.svg": S(70, 90, `<path d="M28 8 Q52 45 28 82"/><path d="M28 8 Q52 45 28 82" transform="translate(-3,0)"/><line x1="8" y1="45" x2="62" y2="45" stroke-dasharray="3 3"/>`, 1.4),
  "physics/optics/plane-mirror.svg": S(40, 90, `<line x1="20" y1="8" x2="20" y2="82" stroke-width="2"/>${[16, 28, 40, 52, 64, 76].map(y => `<line x1="20" y1="${y}" x2="12" y2="${y + 6}"/>`).join("")}`, 1.3),
  "physics/optics/prism.svg": S(80, 80, `<polygon points="40 12 68 66 12 66"/>`, 1.6),
  "physics/optics/ray-refraction.svg": S(100, 100, `<line x1="8" y1="8" x2="50" y2="50" stroke-width="1.8"/><polyline points="34 40 42 42 40 34" stroke-width="1.6"/><line x1="50" y1="50" x2="78" y2="92" stroke-width="1.8"/><line x1="8" y1="50" x2="92" y2="50"/><line x1="50" y1="16" x2="50" y2="84" stroke-dasharray="3 3"/>`, 1.4),

  // ================================ thermodynamics ================================
  "physics/thermodynamics/thermometer.svg": S(30, 80, `<rect x="12" y="8" width="6" height="52" rx="3"/><circle cx="15" cy="64" r="7"/><line x1="15" y1="60" x2="15" y2="40" stroke-width="3"/>${[16, 24, 32, 40, 48].map(y => `<line x1="18" y1="${y}" x2="21" y2="${y}"/>`).join("")}`, 1.4),
  "physics/thermodynamics/heat-flow.svg": S(120, 50, `<rect x="10" y="12" width="30" height="26" rx="2"/><rect x="80" y="12" width="30" height="26" rx="2"/><line x1="44" y1="25" x2="76" y2="25" stroke-width="2"/><polyline points="70 20 78 25 70 30" stroke-width="2"/>${T(25, 25, "hot", 8)}${T(95, 25, "cold", 8)}`, 1.4),
  "physics/thermodynamics/piston-cylinder.svg": S(60, 90, `<path d="M12 30 v52 h36 v-52"/><rect x="12" y="24" width="36" height="10"/><line x1="30" y1="24" x2="30" y2="8"/><rect x="24" y="4" width="12" height="6"/>${[52, 60, 68, 76].map(y => `<line x1="18" y1="${y}" x2="42" y2="${y}" stroke-dasharray="2 3" stroke-width="0.8"/>`).join("")}`, 1.4),
  "physics/thermodynamics/pv-diagram.svg": S(110, 100, `<line x1="18" y1="88" x2="18" y2="10"/><polyline points="14 16 18 10 22 16"/><line x1="12" y1="82" x2="100" y2="82"/><polyline points="94 78 100 82 94 86"/><path d="M30 30 C 60 20, 84 40, 88 70" stroke-width="1.8"/>${T(10, 20, "P", 9)}${T(96, 92, "V", 9)}`, 1.3),

  // ================================ fluids ================================
  "physics/fluids/beaker-fluid.svg": S(60, 80, `<path d="M16 10 v52 a4 4 0 0 0 4 4 h20 a4 4 0 0 0 4 -4 v-52"/><path d="M16 34 h32 v28 a4 4 0 0 1 -4 4 h-24 a4 4 0 0 1 -4 -4 z" fill="currentColor" fill-opacity="0.12" stroke="none"/><line x1="16" y1="34" x2="48" y2="34"/>`, 1.4),
  "physics/fluids/pressure-depth.svg": S(80, 90, `<path d="M12 12 v66 h56 v-66"/><line x1="12" y1="24" x2="68" y2="24"/><path d="M12 24 h56 v54 h-56 z" fill="currentColor" fill-opacity="0.1" stroke="none"/>${[40, 56, 72].map((y, i) => `<line x1="40" y1="${y}" x2="${52 + i * 5}" y2="${y}"/><polyline points="${48 + i * 5} ${y - 3} ${52 + i * 5} ${y} ${48 + i * 5} ${y + 3}"/>`).join("")}`, 1.4),
  "physics/fluids/buoyancy.svg": S(80, 90, `<path d="M12 30 v48 h56 v-48"/><line x1="12" y1="30" x2="68" y2="30"/><rect x="30" y="40" width="20" height="20"/><line x1="40" y1="40" x2="40" y2="20" stroke-width="1.8"/><polyline points="35 26 40 18 45 26" stroke-width="1.8"/>`, 1.4),
  "physics/fluids/pipe-flow.svg": S(120, 60, `<path d="M8 18 h44 l16 -8 v40 l-16 -8 h-44 z"/><line x1="70" y1="30" x2="112" y2="30" stroke-width="2"/><polyline points="106 25 112 30 106 35" stroke-width="2"/><line x1="20" y1="30" x2="40" y2="30" stroke-width="1.6"/><polyline points="36 27 40 30 36 33" stroke-width="1.6"/>`, 1.4),

  // ================================ modern physics ================================
  "physics/modern-physics/bohr-atom.svg": S(90, 90, `<circle cx="45" cy="45" r="4" fill="currentColor"/><ellipse cx="45" cy="45" rx="34" ry="14"/><ellipse cx="45" cy="45" rx="34" ry="14" transform="rotate(60 45 45)"/><ellipse cx="45" cy="45" rx="34" ry="14" transform="rotate(120 45 45)"/><circle cx="79" cy="45" r="2.6" fill="currentColor" stroke="none"/>`, 1.2),
  "physics/modern-physics/nucleus.svg": S(60, 60, `${[[26, 26], [34, 28], [30, 34], [24, 32], [36, 34]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="6" ${i % 2 ? 'fill="currentColor" fill-opacity="0.15"' : 'fill="none"'}/>`).join("")}`, 1.2),
  "physics/modern-physics/photon.svg": S(90, 30, `<path d="M8 15 q6 -9 12 0 t12 0 t12 0 t12 0" stroke-width="1.8"/><line x1="56" y1="15" x2="80" y2="15" stroke-width="1.8"/><polyline points="74 10 82 15 74 20" stroke-width="1.8"/>`, 1.4),
  "physics/modern-physics/energy-levels.svg": S(90, 90, `${[[78, "n=1"], [58, "n=2"], [42, "n=3"], [30, "n=4"]].map(([y]) => `<line x1="14" y1="${y}" x2="60" y2="${y}"/>`).join("")}<line x1="37" y1="42" x2="37" y2="76" stroke-width="1.6"/><polyline points="33 70 37 78 41 70" stroke-width="1.6"/>`, 1.3),

};

module.exports = { PHYSICS };
