/* DGE — asset library access: search the index, load an SVG, normalize it to a
 * reusable inner fragment + viewBox, and recolor mono assets to a target color
 * while leaving already-colored illustrations (bioicons / flat-color) intact. */
"use strict";
const fs = require("fs");
const path = require("path");

const COLORED_SOURCES = new Set(["bioicons", "flat-color-icons"]);

class Library {
  constructor(libDir) {
    this.dir = libDir;
    const idxPath = path.join(libDir, "asset-index.json");
    if (!fs.existsSync(idxPath)) throw new Error("asset-index.json not found — run tools/build-visual-library.js first");
    this.index = JSON.parse(fs.readFileSync(idxPath, "utf8"));
    this.assets = this.index.assets;
    this.byId = {};
    for (const a of this.assets) (this.byId[a.id] = this.byId[a.id] || []).push(a);
  }

  // Search. Ranks exact-id > tag/word hits, optionally filtered by subject/source/color.
  find(query, opts) {
    opts = opts || {};
    const words = String(query || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const wantColored = opts.colored;      // true = only colored, false = only mono, undefined = any
    const subject = opts.subject, source = opts.source;
    const scored = [];
    for (const a of this.assets) {
      if (source && a.source !== source) continue;
      if (subject && !(a.subjects || []).includes(subject)) continue;
      const isColored = COLORED_SOURCES.has(a.source);
      if (wantColored === true && !isColored) continue;
      if (wantColored === false && isColored) continue;
      let score = 0;
      const hay = (a.id + " " + (a.tags || []).join(" ")).toLowerCase();
      for (const w of words) {
        if (a.id.toLowerCase() === w) score += 100;
        else if (a.id.toLowerCase().includes(w)) score += 20;
        else if ((a.tags || []).some(t => t === w)) score += 12;
        else if (hay.includes(w)) score += 4;
      }
      if (a.source === "studymaf") score += 3;          // prefer purpose-built primitives
      if (score > 0) scored.push([score, a]);
    }
    scored.sort((x, y) => y[0] - x[0]);
    const out = scored.map(s => s[1]);
    return opts.limit ? out.slice(0, opts.limit) : out;
  }
  one(query, opts) { return this.find(query, Object.assign({ limit: 1 }, opts))[0] || null; }
  get(id) { return (this.byId[id] || [])[0] || null; }

  raw(asset) { return fs.readFileSync(path.join(this.dir, asset.file), "utf8"); }
  isColored(asset) { return COLORED_SOURCES.has(asset.source); }

  // Parse an SVG string into { vb:{x,y,w,h}, inner } (inner = markup inside <svg>).
  parse(svg) {
    let vb = { x: 0, y: 0, w: 24, h: 24 };
    const m = svg.match(/viewBox\s*=\s*"([-\d.eE ]+)"/);
    if (m) { const p = m[1].trim().split(/[ ,]+/).map(Number); if (p.length === 4) vb = { x: p[0], y: p[1], w: p[2], h: p[3] }; }
    else {
      const w = svg.match(/\bwidth\s*=\s*"([\d.]+)/), h = svg.match(/\bheight\s*=\s*"([\d.]+)/);
      if (w && h) vb = { x: 0, y: 0, w: +w[1], h: +h[1] };
    }
    const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/i, "").replace(/<\/svg>\s*$/i, "").trim();
    return { vb, inner };
  }
}

// Recolor a MONO asset's inner markup to `color` (fills + strokes that were black
// or currentColor). Colored illustrations are returned unchanged.
function tintMono(inner, color) {
  return inner
    .replace(/(fill|stroke)\s*=\s*"(#0{3}|#0{6}|#000000|black|currentColor)"/gi, `$1="${color}"`)
    .replace(/(fill|stroke)\s*:\s*(#0{3}|#0{6}|#000000|black|currentColor)/gi, `$1:${color}`);
}

module.exports = { Library, tintMono, COLORED_SOURCES };
