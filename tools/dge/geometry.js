/* DGE — geometry: axis-aligned bounding boxes, overlap tests, and collision-aware
 * placement of labels/objects so annotations never obstruct the content. */
"use strict";

const box = (x, y, w, h) => ({ x, y, w, h });
const inflate = (b, p) => box(b.x - p, b.y - p, b.w + 2 * p, b.h + 2 * p);
const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function overlapArea(a, b) {
  const dx = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const dy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return dx * dy;
}
function contains(canvas, b) { return b.x >= 0 && b.y >= 0 && b.x + b.w <= canvas.w && b.y + b.h <= canvas.h; }

// estimated text box for the DGE label font
function textBox(text, x, y, size, anchor) {
  const w = String(text).length * size * 0.56, h = size * 1.15;
  const bx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return box(bx, y - h * 0.8, w, h);
}

// Find a spot for a `w x h` label near an anchor box that avoids `obstacles`
// (and stays on canvas). Tries the natural ring of positions, then relaxes.
function placeNear(anchor, w, h, obstacles, canvas, gap) {
  gap = gap == null ? 6 : gap;
  const [cx, cy] = center(anchor);
  let best = null, bestScore = Infinity;
  // widen the search ring until a clean (non-overlapping) spot is found
  for (const g of [gap, gap + 14, gap + 30, gap + 50]) {
    const cand = [
      [anchor.x + anchor.w + g, cy - h / 2],                 // right
      [anchor.x - w - g, cy - h / 2],                        // left
      [cx - w / 2, anchor.y - h - g],                        // above
      [cx - w / 2, anchor.y + anchor.h + g],                 // below
      [anchor.x + anchor.w + g, anchor.y - h - g],           // up-right
      [anchor.x - w - g, anchor.y - h - g],                  // up-left
      [anchor.x + anchor.w + g, anchor.y + anchor.h + g],    // down-right
      [anchor.x - w - g, anchor.y + anchor.h + g]            // down-left
    ];
    for (const [x, y] of cand) {
      const b = box(x, y, w, h);
      let s = obstacles.reduce((acc, o) => acc + overlapArea(b, o), 0);
      if (!contains(canvas, b)) s += 1e6;             // heavy penalty for off-canvas
      if (s === 0) return b;                          // clean spot — take it
      if (s < bestScore) { bestScore = s; best = b; }
    }
    if (bestScore === 0) break;
  }
  return best;
}

module.exports = { box, inflate, center, overlap, overlapArea, contains, textBox, placeNear };
