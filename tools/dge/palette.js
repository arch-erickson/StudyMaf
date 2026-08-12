/* StudyMAF Diagram Generation Engine — palettes & annotation colors.
 *
 * Two color systems, both about CONSISTENCY:
 *   ANNOT  — annotation colors that stay consistent across every diagram
 *            (a generic pointing arrow is always the same neutral; semantic
 *            vectors keep their role color; charge signs use the physics
 *            convention). Colors can change WITH A REASON, never at random.
 *   PALETTES — muted / pastel content palettes for the objects. A diagram picks
 *            ONE and stays within it; different diagrams may use different
 *            palettes, but each is internally consistent and harmonious.
 */
"use strict";

// Fixed annotation colors — softened so nothing is overpowering.
const ANNOT = {
  arrow: "#5B6B7A",      // a generic pointing arrow — ALWAYS this muted slate
  leader: "#9AA3AF",     // leader / connector lines
  dimension: "#9AA3AF",  // dimension lines + ticks
  label: "#3A4150",      // annotation text (readable, not pure black)
  ink: "#3A4150",
  guide: "#CDD3DB",      // dashed construction / guide lines
  highlight: "#D98E63",  // callouts / emphasis (muted terracotta)
  // charge signs — physics convention (consistent, reasoned): + red, − blue
  positive: "#D65A4A", negative: "#4C77B8",
  plus: "#3A4150", minus: "#3A4150", times: "#5B6B7A", equals: "#5B6B7A", // generic symbols default to ink
  // semantic vector roles — consistent whenever that quantity appears (muted)
  force: "#7A6FD1", velocity: "#E0A24B", acceleration: "#E0A24B",
  field: "#3FA98A", current: "#D96A54", magnetic: "#4A9DB0"
};

// Muted / pastel content palettes. `accent` is the main object color; `fills`
// are progressively lighter tints for layering.
const PALETTES = [
  { name: "slate", ink: "#3A4150", accent: "#6B7A99", fills: ["#8391AB", "#A6B1C4", "#C7CEDA", "#E4E8EF"] },
  { name: "sage", ink: "#33413A", accent: "#7FA893", fills: ["#93B7A4", "#B0CBBE", "#CDDFD6", "#E7F0EB"] },
  { name: "dusk", ink: "#3A3A52", accent: "#8983B8", fills: ["#9E99C6", "#BBB7D8", "#D5D3E8", "#ECEBF5"] },
  { name: "clay", ink: "#4A3F3A", accent: "#C08A6E", fills: ["#CD9E86", "#DBB8A6", "#E8D2C6", "#F4E9E1"] },
  { name: "sky", ink: "#2E3F4A", accent: "#7FA6BF", fills: ["#95B6CB", "#B2CBDA", "#D0E0EA", "#EAF1F5"] }
];

function paletteByName(name) { return PALETTES.find(p => p.name === name) || PALETTES[0]; }
// deterministic pick from a seed string so a given subject/topic keeps its look
function pickPalette(seed) {
  if (!seed) return PALETTES[0];
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

module.exports = { ANNOT, PALETTES, paletteByName, pickPalette };
