/* StudyMAF — authored ENGINEERING + ARCHITECTURE SVG assets.
 * Same style contract as authored.js: monochrome currentColor line art. */
"use strict";
const { S, T } = require("./authored.js");

const ENG_ARCH = {

  // ================================ engineering / structural ================================
  "engineering/structural/beam-simply-supported.svg": S(140, 60, `<line x1="14" y1="30" x2="126" y2="30" stroke-width="3"/><polygon points="20 30 12 44 28 44"/><circle cx="120" cy="40" r="6"/><line x1="112" y1="46" x2="128" y2="46"/><line x1="8" y1="48" x2="32" y2="48"/>`, 1.4),
  "engineering/structural/cantilever-beam.svg": S(140, 60, `<line x1="16" y1="30" x2="128" y2="30" stroke-width="3"/><line x1="16" y1="14" x2="16" y2="46" stroke-width="2"/>${[16, 24, 32, 40].map(y => `<line x1="16" y1="${y}" x2="8" y2="${y + 6}"/>`).join("")}<line x1="120" y1="14" x2="120" y2="28" stroke-width="1.8"/><polyline points="116 20 120 28 124 20" stroke-width="1.8"/>`, 1.4),
  "engineering/structural/truss.svg": S(160, 70, `<polygon points="12 58 148 58 120 18 40 18"/><line x1="40" y1="18" x2="52" y2="58"/><line x1="80" y1="18" x2="52" y2="58"/><line x1="80" y1="18" x2="108" y2="58"/><line x1="120" y1="18" x2="108" y2="58"/><line x1="80" y1="18" x2="80" y2="58"/>`, 1.3),
  "engineering/structural/support-pin.svg": S(40, 40, `<circle cx="20" cy="10" r="3" fill="currentColor" stroke="none"/><polygon points="20 12 8 30 32 30"/><line x1="6" y1="34" x2="34" y2="34"/>${[10, 16, 22, 28].map(x => `<line x1="${x}" y1="34" x2="${x - 4}" y2="39"/>`).join("")}`, 1.4),
  "engineering/structural/support-roller.svg": S(40, 44, `<circle cx="20" cy="8" r="3" fill="currentColor" stroke="none"/><polygon points="20 10 10 26 30 26"/><circle cx="14" cy="31" r="4"/><circle cx="26" cy="31" r="4"/><line x1="6" y1="38" x2="34" y2="38"/>`, 1.4),
  "engineering/structural/support-fixed.svg": S(40, 40, `<line x1="12" y1="8" x2="12" y2="34" stroke-width="2"/><line x1="12" y1="20" x2="34" y2="20" stroke-width="2"/>${[8, 15, 22, 29].map(y => `<line x1="12" y1="${y}" x2="4" y2="${y + 6}"/>`).join("")}`, 1.4),
  "engineering/structural/load-point.svg": S(30, 50, `<line x1="15" y1="6" x2="15" y2="40" stroke-width="2"/><polyline points="9 34 15 42 21 34" stroke-width="2"/><line x1="4" y1="46" x2="26" y2="46"/>${T(24, 12, "P", 9)}`, 1.4),
  "engineering/structural/load-distributed.svg": S(120, 50, `<line x1="10" y1="14" x2="110" y2="14"/>${[14, 30, 46, 62, 78, 94, 106].map(x => `<line x1="${x}" y1="14" x2="${x}" y2="36" stroke-width="1.4"/><polyline points="${x - 3} 30 ${x} 37 ${x + 3} 30" stroke-width="1.2"/>`).join("")}<line x1="8" y1="42" x2="112" y2="42"/>`, 1.3),
  "engineering/structural/moment-arrow.svg": S(50, 50, `<path d="M38 16 A18 18 0 1 0 40 30"/><polyline points="42 22 39 30 33 25"/>${T(25, 25, "M", 10)}`, 1.5),

  // ================================ engineering / mechanical ================================
  "engineering/mechanical/gear.svg": S(60, 60, `<g transform="translate(30 30)">${Array.from({ length: 10 }).map((_, i) => { const a = i * 36 * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return `<line x1="${(20 * c).toFixed(1)}" y1="${(20 * s).toFixed(1)}" x2="${(26 * c).toFixed(1)}" y2="${(26 * s).toFixed(1)}" stroke-width="4"/>`; }).join("")}</g><circle cx="30" cy="30" r="20"/><circle cx="30" cy="30" r="7"/>`, 1.4),
  "engineering/mechanical/gear-pair.svg": S(100, 60, `<circle cx="30" cy="30" r="16"/><circle cx="30" cy="30" r="5"/><circle cx="72" cy="30" r="11"/><circle cx="72" cy="30" r="4"/>${Array.from({ length: 8 }).map((_, i) => { const a = i * 45 * Math.PI / 180; return `<line x1="${(30 + 16 * Math.cos(a)).toFixed(1)}" y1="${(30 + 16 * Math.sin(a)).toFixed(1)}" x2="${(30 + 21 * Math.cos(a)).toFixed(1)}" y2="${(30 + 21 * Math.sin(a)).toFixed(1)}" stroke-width="3"/>`; }).join("")}`, 1.3),
  "engineering/mechanical/shaft.svg": S(120, 40, `<rect x="10" y="14" width="100" height="12" rx="2"/><rect x="30" y="10" width="10" height="20"/><rect x="80" y="10" width="10" height="20"/>`, 1.4),
  "engineering/mechanical/bolt-nut.svg": S(50, 60, `<polygon points="25 6 40 14 40 26 25 34 10 26 10 14"/><circle cx="25" cy="20" r="6"/><rect x="20" y="34" width="10" height="20"/>`, 1.4),
  "engineering/mechanical/bearing.svg": S(60, 60, `<circle cx="30" cy="30" r="24"/><circle cx="30" cy="30" r="10"/>${Array.from({ length: 8 }).map((_, i) => { const a = i * 45 * Math.PI / 180; return `<circle cx="${(30 + 17 * Math.cos(a)).toFixed(1)}" cy="${(30 + 17 * Math.sin(a)).toFixed(1)}" r="3"/>`; }).join("")}`, 1.3),
  "engineering/mechanical/spring-coil.svg": S(120, 30, `<line x1="6" y1="15" x2="18" y2="15"/><path d="M18 15 q6 -12 12 0 t12 0 t12 0 t12 0 t12 0 t6 0"/><line x1="102" y1="15" x2="114" y2="15"/>`, 1.4),

  // ================================ engineering / electrical ================================
  "engineering/electrical/resistor.svg": S(90, 24, `<line x1="6" y1="12" x2="24" y2="12"/><rect x="24" y="6" width="42" height="12"/><line x1="66" y1="12" x2="84" y2="12"/>`, 1.4),
  "engineering/electrical/capacitor.svg": S(60, 40, `<line x1="6" y1="20" x2="26" y2="20"/><line x1="26" y1="8" x2="26" y2="32" stroke-width="2"/><line x1="34" y1="8" x2="34" y2="32" stroke-width="2"/><line x1="34" y1="20" x2="54" y2="20"/>`, 1.4),
  "engineering/electrical/inductor.svg": S(90, 24, `<line x1="6" y1="14" x2="22" y2="14"/><path d="M22 14 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0"/><line x1="70" y1="14" x2="84" y2="14"/>`, 1.4),
  "engineering/electrical/battery.svg": S(60, 40, `<line x1="6" y1="20" x2="24" y2="20"/><line x1="24" y1="8" x2="24" y2="32" stroke-width="2.4"/><line x1="34" y1="14" x2="34" y2="26"/><line x1="34" y1="20" x2="54" y2="20"/>`, 1.4),
  "engineering/electrical/ground.svg": S(40, 40, `<line x1="20" y1="6" x2="20" y2="20"/><line x1="8" y1="20" x2="32" y2="20"/><line x1="12" y1="26" x2="28" y2="26"/><line x1="16" y1="32" x2="24" y2="32"/>`, 1.4),
  "engineering/electrical/diode.svg": S(60, 40, `<line x1="6" y1="20" x2="22" y2="20"/><polygon points="22 10 22 30 40 20"/><line x1="40" y1="10" x2="40" y2="30" stroke-width="2"/><line x1="40" y1="20" x2="54" y2="20"/>`, 1.4),
  "engineering/electrical/ac-source.svg": S(50, 50, `<circle cx="25" cy="25" r="18"/><path d="M15 25 q5 -9 10 0 t10 0" stroke-width="1.4"/>`, 1.4),
  "engineering/electrical/junction.svg": S(40, 40, `<line x1="6" y1="20" x2="34" y2="20"/><line x1="20" y1="6" x2="20" y2="34"/><circle cx="20" cy="20" r="3" fill="currentColor" stroke="none"/>`, 1.4),

  // ================================ engineering / civil ================================
  "engineering/civil/beam-bridge.svg": S(160, 70, `<rect x="10" y="26" width="140" height="8"/><line x1="30" y1="34" x2="30" y2="58"/><line x1="80" y1="34" x2="80" y2="58"/><line x1="130" y1="34" x2="130" y2="58"/><line x1="20" y1="58" x2="40" y2="58"/><line x1="70" y1="58" x2="90" y2="58"/><line x1="120" y1="58" x2="140" y2="58"/>`, 1.4),
  "engineering/civil/foundation-footing.svg": S(90, 70, `<rect x="38" y="6" width="14" height="34"/><rect x="18" y="40" width="54" height="16"/><line x1="10" y1="60" x2="80" y2="60"/>${[16, 26, 36, 46, 56, 66, 74].map(x => `<line x1="${x}" y1="60" x2="${x - 4}" y2="65"/>`).join("")}`, 1.4),
  "engineering/civil/column.svg": S(50, 90, `<rect x="18" y="10" width="14" height="70"/><rect x="10" y="80" width="30" height="6"/><line x1="14" y1="18" x2="36" y2="18"/>`, 1.4),
  "engineering/civil/retaining-wall.svg": S(90, 80, `<path d="M20 8 L34 8 L30 70 L74 70 L74 76 L18 76 Z"/>${[[46, 30], [56, 40], [50, 50]].map(([x, y]) => `<line x1="${x}" y1="${y}" x2="${x - 8}" y2="${y}"/><polyline points="${x - 5} ${y - 3} ${x - 9} ${y} ${x - 5} ${y + 3}"/>`).join("")}`, 1.4),
  "engineering/civil/pipe-section.svg": S(60, 60, `<circle cx="30" cy="30" r="22"/><circle cx="30" cy="30" r="15"/><circle cx="30" cy="30" r="15" fill="currentColor" fill-opacity="0.08" stroke="none"/>`, 1.4),

  // ================================ architecture / plans ================================
  "architecture/plans/door-single.svg": S(60, 60, `<line x1="10" y1="50" x2="10" y2="14"/><line x1="10" y1="14" x2="46" y2="14"/><path d="M10 50 A36 36 0 0 0 46 14"/>`, 1.3),
  "architecture/plans/door-double.svg": S(80, 60, `<line x1="8" y1="46" x2="40" y2="46"/><line x1="72" y1="46" x2="40" y2="46"/><line x1="8" y1="46" x2="8" y2="18"/><path d="M8 46 A28 28 0 0 1 36 18"/><line x1="72" y1="46" x2="72" y2="18"/><path d="M72 46 A28 28 0 0 0 44 18"/>`, 1.2),
  "architecture/plans/window-plan.svg": S(80, 30, `<rect x="8" y="10" width="64" height="10"/><line x1="8" y1="15" x2="72" y2="15"/>`, 1.3),
  "architecture/plans/wall-plan.svg": S(90, 30, `<rect x="8" y="10" width="74" height="10" fill="currentColor" fill-opacity="0.12"/><line x1="8" y1="10" x2="82" y2="10"/><line x1="8" y1="20" x2="82" y2="20"/>`, 1.3),
  "architecture/plans/stair-plan.svg": S(80, 80, `<rect x="16" y="10" width="48" height="60"/>${[20, 30, 40, 50, 60].map(y => `<line x1="16" y1="${y}" x2="64" y2="${y}"/>`).join("")}<line x1="40" y1="66" x2="40" y2="14" stroke-width="1.6"/><polyline points="35 20 40 12 45 20" stroke-width="1.6"/>`, 1.3),

  // ================================ architecture / sections + elevations ================================
  "architecture/sections/wall-section.svg": S(50, 90, `<rect x="18" y="8" width="14" height="74"/>${Array.from({ length: 9 }).map((_, i) => `<line x1="18" y1="${12 + i * 8}" x2="32" y2="${8 + i * 8}" stroke-width="0.8"/>`).join("")}`, 1.3),
  "architecture/sections/slab-section.svg": S(90, 40, `<rect x="8" y="14" width="74" height="12"/>${Array.from({ length: 10 }).map((_, i) => `<line x1="${10 + i * 8}" y1="26" x2="${14 + i * 8}" y2="14" stroke-width="0.8"/>`).join("")}`, 1.3),
  "architecture/elevations/door-elevation.svg": S(50, 80, `<rect x="12" y="8" width="26" height="66"/><rect x="17" y="14" width="16" height="24"/><rect x="17" y="44" width="16" height="24"/><circle cx="20" cy="42" r="1.4" fill="currentColor" stroke="none"/>`, 1.3),
  "architecture/elevations/window-elevation.svg": S(60, 70, `<rect x="10" y="10" width="40" height="50"/><line x1="30" y1="10" x2="30" y2="60"/><line x1="10" y1="35" x2="50" y2="35"/>`, 1.3),

  // ================================ architecture / construction + structural ================================
  "architecture/construction/north-arrow.svg": S(40, 50, `<polygon points="20 6 26 30 20 24 14 30"/>${T(20, 42, "N", 11)}`, 1.3),
  "architecture/construction/level-marker.svg": S(60, 40, `<polygon points="20 26 26 16 14 16"/><line x1="26" y1="26" x2="52" y2="26"/>${T(38, 14, "±0.00", 7)}`, 1.2),
  "architecture/construction/section-marker.svg": S(50, 50, `<circle cx="25" cy="25" r="14"/><line x1="25" y1="11" x2="25" y2="39"/>${T(25, 18, "A", 9)}<polyline points="25 39 30 34" stroke-width="2"/>`, 1.3),
  "architecture/construction/dimension-tick.svg": S(90, 30, `<line x1="10" y1="15" x2="80" y2="15"/><line x1="14" y1="10" x2="6" y2="20"/><line x1="84" y1="10" x2="76" y2="20"/>`, 1.2),
  "architecture/structural/column-plan.svg": S(50, 50, `<rect x="14" y="14" width="22" height="22"/><line x1="14" y1="14" x2="36" y2="36"/><line x1="36" y1="14" x2="14" y2="36"/>`, 1.3),
  "architecture/structural/footing-plan.svg": S(60, 60, `<rect x="10" y="10" width="40" height="40" stroke-dasharray="4 3"/><rect x="22" y="22" width="16" height="16"/>`, 1.3),

};

module.exports = { ENG_ARCH };
