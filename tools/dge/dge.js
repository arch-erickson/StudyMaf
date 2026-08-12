/* StudyMAF — Diagram Generation Engine (DGE).
 *
 * Composes a self-contained SVG diagram from the visual library:
 *   1. place LIBRARY GRAPHICS (objects/icons/illustrations) — optional; skip for
 *      purely abstract diagrams. Mono assets are recolored to the diagram's palette;
 *      colored illustrations are kept as-is.
 *   2. add ANNOTATIONS, SYMBOLS & TEXT sized to fit and placed to avoid obstructing
 *      the content (intentional overlaps are allowed). Annotation colors are fixed
 *      and consistent (a pointing arrow is always the same neutral; + green, − red).
 *   3. add EXTRA graphics/marks as needed while preserving spacing & composition.
 *
 * Spec-driven: the AI stage emits a JSON spec; DGE.render(spec) returns the SVG.
 * Animation is added later as a separate ability over an existing diagram.
 */
"use strict";
const path = require("path");
const { Library, tintMono } = require("./assets.js");
const { ANNOT, pickPalette, paletteByName } = require("./palette.js");
const G = require("./geometry.js");

const LIB_DIR = path.resolve(__dirname, "..", "..", "studymaf-visual-library");
let _lib = null;
function library() { return _lib || (_lib = new Library(LIB_DIR)); }

const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const idColor = (c) => "c" + String(c).replace(/[^a-z0-9]/gi, "");
const num = (n) => (Math.round(n * 100) / 100);

// Equations/formulas render as real math via KaTeX → MathML, which is native to
// the browser and needs no external CSS or fonts, so the composed SVG stays fully
// self-contained. If KaTeX isn't installed we fall back to italic-serif text.
let _katex = null; try { _katex = require("katex"); } catch (e) { /* optional */ }
function mathML(latex) {
  if (!_katex) return null;
  let html; try { html = _katex.renderToString(String(latex), { output: "mathml", throwOnError: false }); } catch (e) { return null; }
  const m = html.match(/<math[\s\S]*?<\/math>/);
  return m ? m[0] : null;
}
// rough width of a LaTeX string once typeset (control words count as one glyph)
function mathWidth(latex, size) { return Math.max(size, String(latex).replace(/\\[a-zA-Z]+/g, "x").replace(/[{}$^_]/g, "").length * size * 0.6); }

class Diagram {
  constructor(opts) {
    opts = opts || {};
    this.w = opts.width || 480;
    this.h = opts.height || 320;
    this.canvas = { w: this.w, h: this.h };
    this.palette = opts.palette ? (typeof opts.palette === "string" ? paletteByName(opts.palette) : opts.palette) : pickPalette(opts.seed);
    this.bg = opts.bg || "none";
    this.content = [];      // svg fragments: objects/symbols (drawn first)
    this.annot = [];        // arrows/dimensions/lines
    this.labels = [];       // text (drawn last)
    this.boxes = [];        // content bounding boxes (for collision avoidance)
    this.arrowColors = new Set();
    this._pi = 0;           // palette fill cursor
  }

  // ---- 1. library graphics ----
  place(query, opts) {
    opts = opts || {};
    const lib = library();
    let asset = opts.id ? lib.get(opts.id) : lib.one(query, { subject: opts.subject, source: opts.source, colored: opts.colored });
    if (!asset) return null;
    const { vb, inner, root } = lib.parse(lib.raw(asset));
    const colored = lib.isColored(asset);
    const size = opts.size || Math.max(opts.width || 0, opts.height || 0) || 64;
    const scale = opts.width ? opts.width / vb.w : opts.height ? opts.height / vb.h : size / Math.max(vb.w, vb.h);
    const w = vb.w * scale, h = vb.h * scale;
    const cx = opts.cx != null ? opts.cx : (opts.x != null ? opts.x + w / 2 : this.w / 2);
    const cy = opts.cy != null ? opts.cy : (opts.y != null ? opts.y + h / 2 : this.h / 2);
    const left = cx - w / 2, top = cy - h / 2;
    const sx = opts.flip ? -scale : scale;
    // color: explicit, or role, or a palette fill for mono; colored assets keep themselves
    const color = colored ? null : (opts.color || (opts.role && ANNOT[opts.role]) || (opts.tone === "cycle" ? this._nextInk() : this.palette.accent));
    const body = color ? tintMono(inner, color) : inner;
    const tf = `translate(${num(cx)} ${num(cy)}) scale(${num(sx)} ${num(scale)}) translate(${num(-vb.x - vb.w / 2)} ${num(-vb.y - vb.h / 2)})`;
    const op = opts.opacity != null ? ` opacity="${opts.opacity}"` : "";
    const rootAttr = Object.keys(root || {}).map(k => ` ${k}="${root[k]}"`).join(""); // carry fill=none/stroke defaults
    this.content.push(`<g transform="${tf}"${op}${color ? ` color="${color}"` : ""}${rootAttr}>${body}</g>`);
    const bbox = G.box(left, top, w, h);
    this.boxes.push(bbox);
    if (opts.label) this.text(opts.label, cx, top - 4, { anchor: "middle", avoid: true, role: "label" });
    return { bbox, cx, cy, w, h, asset: asset.id };
  }
  _nextInk(tone) {
    if (tone === "ink") return this.palette.ink;
    const f = this.palette.fills; return f[(this._pi++) % f.length];
  }

  // consistent title across diagrams: centered, standard weight/size, reserves a top band
  title(text, opts) {
    opts = opts || {};
    this.text(text, this.w / 2, opts.y || 26, { anchor: "middle", weight: 700, size: 16, color: this.palette.ink });
    if (opts.subtitle) this.text(opts.subtitle, this.w / 2, (opts.y || 26) + 17, { anchor: "middle", size: 12, color: ANNOT.leader });
    this.boxes.push(G.box(0, 0, this.w, (opts.subtitle ? 46 : 36)));   // keep other labels clear of the header
  }

  // ---- 2. annotations, symbols, text ----
  arrow(from, to, opts) {
    opts = opts || {};
    const color = opts.color || (opts.role && ANNOT[opts.role]) || ANNOT.arrow;
    const solid = !!opts.solid, op = solid ? 1 : 0.55, sw = opts.width || 2;
    this.arrowColors.add(color);
    const dbl = opts.double ? ` marker-start="url(#ah-${idColor(color)})"` : "";
    this.annot.push(`<line x1="${num(from[0])}" y1="${num(from[1])}" x2="${num(to[0])}" y2="${num(to[1])}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" opacity="${op}" marker-end="url(#ah-${idColor(color)})"${dbl}${opts.dashed ? ' stroke-dasharray="5 4"' : ""}/>`);
    // slim collision box along the arrow so labels dodge it
    this.boxes.push(G.box(Math.min(from[0], to[0]) - 3, Math.min(from[1], to[1]) - 3, Math.abs(to[0] - from[0]) + 6, Math.abs(to[1] - from[1]) + 6));
    if (opts.label) { const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]; this.text(opts.label, mid[0], mid[1], { anchor: "middle", avoid: true, color, size: opts.labelSize || 13 }); }
  }
  line(from, to, opts) {
    opts = opts || {};
    const color = opts.color || (opts.guide ? ANNOT.guide : this.palette.ink);
    this.annot.push(`<line x1="${num(from[0])}" y1="${num(from[1])}" x2="${num(to[0])}" y2="${num(to[1])}" stroke="${color}" stroke-width="${opts.width || 1.6}" stroke-linecap="round"${(opts.dashed || opts.guide) ? ' stroke-dasharray="4 4"' : ""}/>`);
  }
  symbol(kind, x, y, opts) {
    opts = opts || {}; const s = opts.size || 9, sw = opts.width || 2;
    // reasoned defaults: a bare +/− is a neutral operator (ink); a CIRCLED sign is
    // a charge, so it uses the physics convention (+ red, − blue). Override via color/role.
    const circled = kind === "plus-circle" || kind === "minus-circle";
    const col = opts.color || (opts.role && ANNOT[opts.role]) || (circled ? (kind[0] === "p" ? ANNOT.positive : ANNOT.negative) : ANNOT.label);
    const put = (d) => this.content.push(`<g stroke="${col}" stroke-width="${sw}" stroke-linecap="round" fill="none">${d}</g>`);
    const H = `<line x1="${x - s}" y1="${y}" x2="${x + s}" y2="${y}"/>`, V = `<line x1="${x}" y1="${y - s}" x2="${x}" y2="${y + s}"/>`;
    if (kind === "plus") put(H + V);
    else if (kind === "minus") put(H);
    else if (kind === "times") put(`<line x1="${x - s}" y1="${y - s}" x2="${x + s}" y2="${y + s}"/><line x1="${x + s}" y1="${y - s}" x2="${x - s}" y2="${y + s}"/>`);
    else if (kind === "equals") put(`<line x1="${x - s}" y1="${y - s / 2.5}" x2="${x + s}" y2="${y - s / 2.5}"/><line x1="${x - s}" y1="${y + s / 2.5}" x2="${x + s}" y2="${y + s / 2.5}"/>`);
    else if (circled) put(`<circle cx="${x}" cy="${y}" r="${s + 3}" fill="none"/>` + H + (kind[0] === "p" ? V : ""));
    this.boxes.push(G.box(x - s - 2, y - s - 2, 2 * s + 4, 2 * s + 4));
  }
  text(str, x, y, opts) {
    opts = opts || {}; const size = Math.max(12, opts.size || 13), anchor = opts.anchor || "start", color = opts.color || ANNOT.label;
    // real math (KaTeX → MathML) when requested and available
    const mm = opts.math ? mathML(str) : null;
    let bx = x, by = y;
    const boxOf = () => mm
      ? G.box(anchor === "middle" ? x - mathWidth(str, size) / 2 : anchor === "end" ? x - mathWidth(str, size) : x, y - size, mathWidth(str, size), size * 1.3)
      : G.textBox(str, x, y, size, anchor);
    if (opts.avoid) {
      const tb = boxOf();
      const spot = G.placeNear(tb, tb.w, tb.h, this.boxes, this.canvas, 5);
      if (spot) { bx = anchor === "middle" ? spot.x + spot.w / 2 : anchor === "end" ? spot.x + spot.w : spot.x; by = spot.y + spot.h * 0.78; this.boxes.push(G.inflate(spot, 1)); }
    } else this.boxes.push(boxOf());
    if (mm) {
      const w = mathWidth(str, size);
      const fx = anchor === "middle" ? bx - w / 2 : anchor === "end" ? bx - w : bx;
      this.labels.push(`<foreignObject x="${num(fx)}" y="${num(by - size)}" width="${num(w + 6)}" height="${num(size * 1.8)}" overflow="visible"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${size}px;color:${color};line-height:1.1;white-space:nowrap">${mm}</div></foreignObject>`);
    } else {
      const style = opts.math ? ' font-family="Georgia, serif" font-style="italic"' : ' font-family="Inter, system-ui, sans-serif"';
      this.labels.push(`<text x="${num(bx)}" y="${num(by)}" fill="${color}" font-size="${size}"${style}${opts.weight ? ` font-weight="${opts.weight}"` : ""} text-anchor="${anchor}">${esc(str)}</text>`);
    }
  }
  dimension(from, to, opts) {
    opts = opts || {}; const c = ANNOT.dimension, off = opts.offset || 0;
    // simple horizontal/vertical dimension with ticks + arrowheads + centered label
    this.arrowColors.add(c);
    this.annot.push(`<line x1="${num(from[0])}" y1="${num(from[1])}" x2="${num(to[0])}" y2="${num(to[1])}" stroke="${c}" stroke-width="1.4" marker-start="url(#ah-${idColor(c)})" marker-end="url(#ah-${idColor(c)})"/>`);
    const tick = (p, perp) => this.annot.push(`<line x1="${num(p[0] - perp[0])}" y1="${num(p[1] - perp[1])}" x2="${num(p[0] + perp[0])}" y2="${num(p[1] + perp[1])}" stroke="${c}" stroke-width="1.2"/>`);
    const horiz = Math.abs(to[0] - from[0]) >= Math.abs(to[1] - from[1]);
    tick(from, horiz ? [0, 5] : [5, 0]); tick(to, horiz ? [0, 5] : [5, 0]);
    if (opts.label) this.text(opts.label, (from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + (horiz ? -6 : 0) + off, { anchor: "middle", color: c, size: 12, math: true });
  }
  callout(x, y, w, h, opts) {
    opts = opts || {}; const c = opts.color || ANNOT.highlight;
    this.annot.push(`<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" rx="8" fill="none" stroke="${c}" stroke-width="1.8"${opts.dashed ? ' stroke-dasharray="5 4"' : ""}/>`);
    if (opts.text) this.text(opts.text, x + w / 2, y - 6, { anchor: "middle", color: c, avoid: true });
  }

  // ---- render ----
  _defs() {
    const m = [...this.arrowColors].map(c => `<marker id="ah-${idColor(c)}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`).join("");
    return m ? `<defs>${m}</defs>` : "";
  }
  toSVG() {
    const bg = this.bg && this.bg !== "none" ? `<rect width="${this.w}" height="${this.h}" fill="${this.bg}"/>` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="100%" font-family="Inter, system-ui, sans-serif">${this._defs()}${bg}${this.content.join("")}${this.annot.join("")}${this.labels.join("")}</svg>`;
  }
}

// ---- declarative spec -> SVG (what the AI stage will emit) ----
function render(spec) {
  const c = spec.canvas || {};
  const d = new Diagram({ width: c.width, height: c.height, palette: c.palette, seed: c.seed, bg: c.bg });
  for (const it of (spec.items || [])) {
    switch (it.type) {
      case "asset": d.place(it.query, it); break;
      case "arrow": d.arrow(it.from, it.to, it); break;
      case "line": d.line(it.from, it.to, it); break;
      case "symbol": d.symbol(it.kind, it.x, it.y, it); break;
      case "text": d.text(it.text, it.x, it.y, it); break;
      case "dimension": d.dimension(it.from, it.to, it); break;
      case "callout": d.callout(it.x, it.y, it.w, it.h, it); break;
    }
  }
  return d.toSVG();
}

module.exports = { Diagram, render, library, ANNOT };
