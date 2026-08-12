/* StudyMAF Diagram Generation Engine — palettes & annotation colors.
 *
 * Two color systems, both about CONSISTENCY:
 *   ANNOT  — annotation colors that are the SAME across every diagram
 *            (a pointing arrow is always the same neutral; + is green, − is red).
 *   PALETTES — content palettes for the objects/illustrations. A diagram picks
 *            ONE and stays within it; different diagrams may use different
 *            palettes, but each is internally consistent and harmonious.
 */
"use strict";

// Fixed annotation colors — never vary by diagram.
const ANNOT = {
  arrow: "#4F5D75",      // a generic pointing arrow — ALWAYS this neutral slate
  leader: "#8B93A1",     // leader / connector lines
  dimension: "#8B93A1",  // dimension lines + ticks
  label: "#2D3142",      // annotation text
  plus: "#2F9E44",       // + symbol — always green
  minus: "#E03131",      // − symbol — always red
  times: "#4F5D75", equals: "#4F5D75",
  highlight: "#EF8354",  // callouts / emphasis
  guide: "#C7CDD6",      // dashed construction/guide lines
  // semantic vector roles — consistent whenever that quantity appears
  force: "#7048E8", velocity: "#F59F00", acceleration: "#F59F00",
  field: "#0CA678", current: "#E8553A", magnetic: "#1098AD",
  positive: "#E8553A", negative: "#2F6DB5" // charge bodies (physics convention)
};

// Harmonious content palettes. A diagram commits to one.
const PALETTES = [
  { name: "slate", ink: "#2D3142", accent: "#4F5D75", fills: ["#4F5D75", "#7C8698", "#AEB6C2", "#D7DBE2"] },
  { name: "indigo", ink: "#20244A", accent: "#4F46E5", fills: ["#4F46E5", "#7C74EE", "#A9A4F4", "#DAD8FB"] },
  { name: "teal", ink: "#0E3A38", accent: "#0CA678", fills: ["#0CA678", "#3FC79E", "#8FE0C8", "#CFF3E8"] },
  { name: "ember", ink: "#3A2417", accent: "#EF8354", fills: ["#EF8354", "#F4A582", "#F8C6AE", "#FBE3D6"] },
  { name: "steel", ink: "#1F2933", accent: "#3E5C76", fills: ["#3E5C76", "#748CAB", "#A7B8CC", "#D6DEE8"] }
];

function paletteByName(name) { return PALETTES.find(p => p.name === name) || PALETTES[0]; }
// deterministic pick from a seed string so a given subject/topic keeps its look
function pickPalette(seed) {
  if (!seed) return PALETTES[0];
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

module.exports = { ANNOT, PALETTES, paletteByName, pickPalette };
