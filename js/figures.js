/* StudyMAF — data-driven figures in one consistent house style.
 * The CODE owns how each figure type is drawn; JSON only supplies parameters.
 * Types: "coordinate-plane", "number-line".
 */
window.Figures = (function () {
  "use strict";

  function accent() {
    var v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    return v || "#EF8354";
  }
  var COLORS = { navy: "#2D3142", slate: "#4F5D75", gray: "#BFC0C0" };
  function resolve(c) { if (!c) return COLORS.navy; if (c === "accent") return accent(); return COLORS[c] || c; }

  // Create a crisp canvas at CSS width, given aspect ratio.
  function makeCanvas(cssWidth, cssHeight) {
    var dpr = window.devicePixelRatio || 1;
    var cv = document.createElement("canvas");
    cv.width = cssWidth * dpr; cv.height = cssHeight * dpr;
    cv.style.width = "100%"; cv.style.aspectRatio = cssWidth + " / " + cssHeight;
    var ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    return { cv: cv, ctx: ctx, w: cssWidth, h: cssHeight };
  }

  function coordinatePlane(params) {
    var p = params || {};
    var xR = p.xRange || [-5, 5], yR = p.yRange || [-5, 5];
    var W = 560, H = 380, pad = 34;
    var c = makeCanvas(W, H), ctx = c.ctx;
    var plotW = W - pad * 2, plotH = H - pad * 2;
    function X(x) { return pad + (x - xR[0]) / (xR[1] - xR[0]) * plotW; }
    function Y(y) { return pad + (yR[1] - y) / (yR[1] - yR[0]) * plotH; }

    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = "#eef0f3"; ctx.lineWidth = 1;
    ctx.font = "11px Inter, sans-serif"; ctx.fillStyle = COLORS.gray; ctx.textAlign = "center";
    for (var gx = Math.ceil(xR[0]); gx <= xR[1]; gx++) {
      ctx.beginPath(); ctx.moveTo(X(gx), pad); ctx.lineTo(X(gx), H - pad); ctx.stroke();
      if (gx !== 0) ctx.fillText(String(gx), X(gx), Y(0) + 14);
    }
    ctx.textAlign = "right";
    for (var gy = Math.ceil(yR[0]); gy <= yR[1]; gy++) {
      ctx.beginPath(); ctx.moveTo(pad, Y(gy)); ctx.lineTo(W - pad, Y(gy)); ctx.stroke();
      if (gy !== 0) ctx.fillText(String(gy), X(0) - 6, Y(gy) + 4);
    }
    // axes
    ctx.strokeStyle = COLORS.navy; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(pad, Y(0)); ctx.lineTo(W - pad, Y(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(0), pad); ctx.lineTo(X(0), H - pad); ctx.stroke();

    // lines
    var intersections = [];
    (p.lines || []).forEach(function (ln) {
      var col = resolve(ln.color);
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath();
      var y0 = ln.slope * xR[0] + ln.intercept, y1 = ln.slope * xR[1] + ln.intercept;
      ctx.moveTo(X(xR[0]), Y(y0)); ctx.lineTo(X(xR[1]), Y(y1)); ctx.stroke();
      // label near right end
      ctx.fillStyle = col; ctx.font = "600 13px Inter, sans-serif"; ctx.textAlign = "left";
      var ly = Math.max(yR[0] + 0.4, Math.min(yR[1] - 0.2, y1));
      ctx.fillText(ln.label || "", Math.min(X(xR[1]) - 4, X(xR[1] - 1.2)), Y(ly) - 6);
    });
    // mark pairwise intersections
    var L = p.lines || [];
    for (var i = 0; i < L.length; i++) for (var j = i + 1; j < L.length; j++) {
      if (L[i].slope === L[j].slope) continue;
      var xi = (L[j].intercept - L[i].intercept) / (L[i].slope - L[j].slope);
      var yi = L[i].slope * xi + L[i].intercept;
      if (xi >= xR[0] && xi <= xR[1] && yi >= yR[0] && yi <= yR[1]) {
        ctx.fillStyle = accent(); ctx.beginPath(); ctx.arc(X(xi), Y(yi), 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    return c.cv;
  }

  function numberLine(params) {
    var p = params || {}, min = p.min != null ? p.min : 0, max = p.max != null ? p.max : 10;
    var W = 560, H = 120, pad = 40; var c = makeCanvas(W, H), ctx = c.ctx;
    var y = 64, plotW = W - pad * 2;
    function X(v) { return pad + (v - min) / (max - min) * plotW; }
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = COLORS.navy; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    // arrows
    [[pad, -1], [W - pad, 1]].forEach(function (a) {
      ctx.beginPath(); ctx.moveTo(a[0], y); ctx.lineTo(a[0] + a[1] * 10, y - 5);
      ctx.lineTo(a[0] + a[1] * 10, y + 5); ctx.closePath(); ctx.fillStyle = COLORS.navy; ctx.fill();
    });
    ctx.font = "11px Inter, sans-serif"; ctx.fillStyle = COLORS.gray; ctx.textAlign = "center";
    for (var t = Math.ceil(min); t <= max; t++) {
      ctx.strokeStyle = COLORS.gray; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(t), y - 5); ctx.lineTo(X(t), y + 5); ctx.stroke();
      ctx.fillText(String(t), X(t), y + 22);
    }
    (p.points || []).forEach(function (pt) {
      ctx.fillStyle = accent(); ctx.beginPath(); ctx.arc(X(pt.value), y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      if (pt.label) { ctx.fillStyle = accent(); ctx.font = "700 13px Inter, sans-serif"; ctx.fillText(pt.label, X(pt.value), y - 16); }
    });
    return c.cv;
  }

  // ---- schematic: declarative SVG diagrams in one consistent house style ----
  var SVGNS = "http://www.w3.org/2000/svg";
  var C = { pos: "#E8553A", neg: "#2F6DB5", ink: "#2D3142", soft: "#8b93a1", line: "#c7cdd6", slate: "#4F5D75" };
  // Standard notation colors (see DIAGRAM_RULES.md) — a symbol means the same
  // thing in every diagram. Authors reference these by name.
  var STD = {
    positive: "#E8553A", negative: "#2F6DB5", force: "#7048E8", field: "#0CA678",
    velocity: "#F59F00", current: "#E8553A", magnetic: "#1098AD", measure: "#8B93A1"
  };
  function col(c) { if (!c) return C.ink; if (c === "accent") return accent(); return STD[c] || C[c] || c; }
  var MARKER_NAMES = ["ink", "pos", "neg", "soft", "accent", "positive", "negative", "force", "field", "velocity", "current", "magnetic", "measure"];
  function markerFor(cc) { return MARKER_NAMES.indexOf(cc) >= 0 ? ("arh-" + cc) : "arh-ink"; }
  function sv(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]); return e; }
  function txt(x, y, s, fill, size, anchor) { var t = sv("text", { x: x, y: y, fill: fill || C.ink, "font-size": size || 13, "font-family": "Inter, sans-serif", "font-weight": 600, "text-anchor": anchor || "middle", "dominant-baseline": "middle" }); t.textContent = s; return t; }

  // A label whose text contains $…$ is rendered as real math (KaTeX) inside a
  // <foreignObject>, so diagram equations use proper notation like the rest of the
  // app. Everything else stays a plain <text>. Math is measured after it mounts and
  // re-anchored so "middle"/"end"/"start" position exactly like <text> does.
  function isMath(s) { return typeof s === "string" && s.indexOf("$") >= 0; }
  function mathText(x, y, s, fill, size, anchor) {
    size = size || 13; anchor = anchor || "middle"; fill = fill || C.ink;
    var fo = sv("foreignObject", { x: x, y: y - size, width: 260, height: size * 3, overflow: "visible" });
    var div = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    div.style.cssText = "display:inline-block;white-space:nowrap;line-height:1.1;font-size:" + size + "px;color:" + fill + ";font-family:Inter,sans-serif";
    div.textContent = s;
    fo.appendChild(div);
    function measure() {
      var w = div.offsetWidth || div.getBoundingClientRect().width || 10;
      var h = div.offsetHeight || size * 1.3;
      fo.setAttribute("width", Math.ceil(w) + 2);
      fo.setAttribute("height", Math.ceil(h) + 2);
      fo.setAttribute("x", anchor === "end" ? x - w : anchor === "start" ? x : x - w / 2);
      fo.setAttribute("y", y - h / 2);
    }
    // Render + re-anchor once the node is mounted AND KaTeX has finished. Both are
    // async (KaTeX scripts load `defer`; the figure mounts after element() returns),
    // so poll briefly instead of assuming either is ready — this guarantees the math
    // renders rather than leaving raw "$…$" if KaTeX is a beat late.
    var tries = 0;
    (function attempt() {
      var ready = typeof window.renderMathInElement === "function";
      if (ready && fo.isConnected) { StudyMath.render(div); measure(); if (div.querySelector(".katex")) return; }
      if (tries++ < 40) setTimeout(attempt, 50); else measure();
    })();
    return fo;
  }
  function lbl(x, y, s, fill, size, anchor) { return isMath(s) ? mathText(x, y, s, fill, size, anchor) : txt(x, y, s, fill, size, anchor); }

  // ---- reusable component library (see DIAGRAM_RULES.md §5) ----
  // Each component draws detailed primitives around a local origin (~±40).
  // Reference from JSON with {kind:"component", name, x, y, scale, color, label}.
  // Before adding a new one, check LIB first and reuse if something fits.
  function tnode(x, y, s, fill, size) { var t = sv("text", { x: x, y: y, fill: fill, "font-size": size || 8, "font-family": "Inter, sans-serif", "font-weight": 700, "text-anchor": "middle", "dominant-baseline": "middle" }); t.textContent = s; return t; }
  var LIB = {
    balloon: function (g, e) {
      var c = col(e.color || "accent");
      g.appendChild(sv("path", { d: "M0,-26 C 18,-26 18,-2 0,10 C -18,-2 -18,-26 0,-26 Z", fill: c, stroke: "rgba(0,0,0,.12)", "stroke-width": 1 }));
      g.appendChild(sv("path", { d: "M0,10 l -4,6 l 8,0 z", fill: c }));
      g.appendChild(sv("path", { d: "M0,16 q 8,14 -3,30", fill: "none", stroke: C.soft, "stroke-width": 1.4 }));
      g.appendChild(sv("ellipse", { cx: -6, cy: -16, rx: 4, ry: 7, fill: "rgba(255,255,255,.45)" }));
    },
    wall: function (g, e) {
      var w = e.w || 26, h = e.h || 96;
      g.appendChild(sv("rect", { x: 0, y: -h / 2, width: w, height: h, fill: "#eef0f3", stroke: C.line, "stroke-width": 1.5 }));
      for (var yy = -h / 2 + 12; yy < h / 2; yy += 14) g.appendChild(sv("line", { x1: 0, y1: yy, x2: w, y2: yy, stroke: C.line, "stroke-width": 1 }));
    },
    person: function (g, e) {
      var c = col(e.color || "slate"), skin = "#e8b58f";
      g.appendChild(sv("path", { d: "M-20,40 Q -20,14 0,14 Q 20,14 20,40 Z", fill: c }));
      g.appendChild(sv("circle", { cx: 0, cy: -6, r: 14, fill: skin, stroke: "rgba(0,0,0,.1)", "stroke-width": 1 }));
      if (e.hair === "up") { for (var i = -3; i <= 3; i++) { var rad = i * 11 * Math.PI / 180; g.appendChild(sv("line", { x1: Math.sin(rad) * 9, y1: -18, x2: Math.sin(rad) * 26, y2: -18 - 24 * Math.cos(rad), stroke: "#5b4636", "stroke-width": 2, "stroke-linecap": "round" })); } }
      else g.appendChild(sv("path", { d: "M-14,-10 Q -14,-24 0,-24 Q 14,-24 14,-10 Q 8,-17 0,-17 Q -8,-17 -14,-10 Z", fill: "#5b4636" }));
      g.appendChild(sv("circle", { cx: -5, cy: -6, r: 1.6, fill: C.ink })); g.appendChild(sv("circle", { cx: 5, cy: -6, r: 1.6, fill: C.ink }));
    },
    hand: function (g, e) {
      var skin = col(e.color || "#e8b58f");
      g.appendChild(sv("path", { d: "M-16,12 L-16,-6 Q-16,-12 -10,-12 L-10,-8 L-8,-16 Q-8,-22 -2,-22 L-2,-10 L2,-20 Q2,-26 8,-26 L8,-8 L12,-16 Q15,-20 18,-15 L14,10 Q10,20 -2,20 Q-12,20 -16,12 Z", fill: skin, stroke: "rgba(0,0,0,.12)", "stroke-width": 1 }));
    },
    chip: function (g, e) {
      g.appendChild(sv("rect", { x: -22, y: -14, width: 44, height: 28, rx: 3, fill: "#2b3a42", stroke: "#1b2429", "stroke-width": 1.5 }));
      for (var i = -2; i <= 2; i++) { g.appendChild(sv("rect", { x: i * 8 - 2, y: -19, width: 4, height: 6, fill: C.soft })); g.appendChild(sv("rect", { x: i * 8 - 2, y: 13, width: 4, height: 6, fill: C.soft })); }
      g.appendChild(sv("circle", { cx: -14, cy: -6, r: 2.4, fill: "#8b93a1" }));
      g.appendChild(tnode(2, 2, "IC", "#cfd6dd", 8));
    },
    car: function (g, e) {
      var c = col(e.color || "#e03131");
      g.appendChild(sv("path", { d: "M-34,8 L-30,-2 L-18,-2 L-10,-14 L14,-14 L22,-2 L32,-2 L34,8 L34,14 L-34,14 Z", fill: c, stroke: "rgba(0,0,0,.15)", "stroke-width": 1.5, "stroke-linejoin": "round" }));
      g.appendChild(sv("path", { d: "M-8,-11 L12,-11 L18,-3 L-14,-3 Z", fill: "#cfe8f5", stroke: "rgba(0,0,0,.1)", "stroke-width": 1 }));
      g.appendChild(sv("line", { x1: 2, y1: -11, x2: 4, y2: -3, stroke: "rgba(0,0,0,.2)", "stroke-width": 1 }));
      [-18, 20].forEach(function (wx) { g.appendChild(sv("circle", { cx: wx, cy: 14, r: 8, fill: "#2b3038" })); g.appendChild(sv("circle", { cx: wx, cy: 14, r: 3.4, fill: "#9aa1ac" })); });
      g.appendChild(sv("circle", { cx: 33, cy: 4, r: 2, fill: "#ffe08a" }));
    },
    cloud: function (g, e) {
      var c = col(e.color || "#9aa6b2");
      g.appendChild(sv("path", { d: "M-30,10 Q-38,10 -38,2 Q-38,-6 -28,-6 Q-26,-18 -10,-16 Q-2,-26 12,-18 Q28,-20 28,-6 Q38,-6 38,2 Q38,10 30,10 Z", fill: c, stroke: "rgba(0,0,0,.08)", "stroke-width": 1 }));
    },
    lightning: function (g, e) {
      g.appendChild(sv("path", { d: "M4,-24 L-8,2 L0,2 L-6,24 L14,-6 L4,-6 L12,-24 Z", fill: col(e.color || "velocity"), stroke: "rgba(0,0,0,.15)", "stroke-width": 1, "stroke-linejoin": "round" }));
    },
    paper: function (g, e) {
      g.appendChild(sv("rect", { x: -18, y: -24, width: 36, height: 48, rx: 2, fill: "#fff", stroke: C.line, "stroke-width": 1.5 }));
      for (var yy = -16; yy <= 16; yy += 8) g.appendChild(sv("line", { x1: -12, y1: yy, x2: 12, y2: yy, stroke: C.line, "stroke-width": 1 }));
    },
    dome: function (g, e) {
      var c = col(e.color || "#c7cdd6");
      g.appendChild(sv("rect", { x: -6, y: -6, width: 12, height: 44, fill: C.soft }));
      g.appendChild(sv("rect", { x: -22, y: 34, width: 44, height: 8, rx: 2, fill: C.slate }));
      g.appendChild(sv("ellipse", { cx: 0, cy: -16, rx: 26, ry: 18, fill: c, stroke: "rgba(0,0,0,.12)", "stroke-width": 1.5 }));
      g.appendChild(sv("ellipse", { cx: -8, cy: -20, rx: 6, ry: 4, fill: "rgba(255,255,255,.5)" }));
    },
    droplet: function (g, e) {
      g.appendChild(sv("path", { d: "M0,-16 C 10,-2 10,8 0,12 C -10,8 -10,-2 0,-16 Z", fill: col(e.color || "field"), stroke: "rgba(0,0,0,.1)", "stroke-width": 1 }));
      g.appendChild(sv("ellipse", { cx: -3, cy: 2, rx: 2, ry: 3, fill: "rgba(255,255,255,.5)" }));
    },
    sphere: function (g, e) {
      var r = e.r || 34, fc = col("field");
      g.appendChild(sv("circle", { cx: 0, cy: 0, r: r, fill: "rgba(12,166,110,.06)", stroke: fc, "stroke-width": 1.6, "stroke-dasharray": "6 5" }));
      g.appendChild(sv("ellipse", { cx: 0, cy: 0, rx: r, ry: r * 0.34, fill: "none", stroke: "rgba(12,166,110,.5)", "stroke-width": 1, "stroke-dasharray": "4 4" }));
    },
    cylinder: function (g, e) {
      var w = e.w || 30, h = e.h || 60, fc = col("field");
      g.appendChild(sv("rect", { x: -w, y: -h / 2, width: w * 2, height: h, fill: "rgba(12,166,110,.06)", stroke: fc, "stroke-width": 1.6, "stroke-dasharray": "6 5" }));
      g.appendChild(sv("ellipse", { cx: 0, cy: -h / 2, rx: w, ry: w * 0.32, fill: "rgba(12,166,110,.10)", stroke: fc, "stroke-width": 1.4, "stroke-dasharray": "5 4" }));
      g.appendChild(sv("ellipse", { cx: 0, cy: h / 2, rx: w, ry: w * 0.32, fill: "none", stroke: fc, "stroke-width": 1.4, "stroke-dasharray": "5 4" }));
    },
    mesh: function (g, e) {
      var w = e.w || 44, h = e.h || 60;
      g.appendChild(sv("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 3, fill: "rgba(43,58,66,.08)", stroke: C.ink, "stroke-width": 1.5 }));
      for (var xx = -w / 2 + 8; xx < w / 2; xx += 8) g.appendChild(sv("line", { x1: xx, y1: -h / 2, x2: xx, y2: h / 2, stroke: C.soft, "stroke-width": 1 }));
      for (var yy = -h / 2 + 8; yy < h / 2; yy += 8) g.appendChild(sv("line", { x1: -w / 2, y1: yy, x2: w / 2, y2: yy, stroke: C.soft, "stroke-width": 1 }));
    }
  };

  function renderElements(container, elements) {
    (elements || []).forEach(function (e) {
      var g;
      switch (e.kind) {
        case "line":
          container.appendChild(sv("line", { x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, stroke: col(e.color), "stroke-width": e.width || 2, "stroke-dasharray": e.dash ? "5 4" : null, "stroke-linecap": "round" }));
          break;
        case "vector": case "arrow": case "ray": {
          var cc = e.color || (e.kind === "ray" ? "accent" : "ink");
          var mk = markerFor(cc);
          // RULE: arrows/annotations are always 50% opacity so they never hide
          // the objects underneath (override with "solid": true in rare cases).
          var aop = e.solid ? 1 : 0.5;
          container.appendChild(sv("line", { x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, stroke: col(cc), "stroke-width": e.width || 2.4, "stroke-linecap": "round", "marker-end": "url(#" + mk + ")", opacity: aop }));
          if (e.label) { var lb = lbl((e.x1 + e.x2) / 2 + (e.dx || 0), (e.y1 + e.y2) / 2 + (e.dy || -8), e.label, col(cc), 12); lb.setAttribute("opacity", aop); container.appendChild(lb); }
          break;
        }
        case "component": {
          var fn = LIB[e.name];
          var s = e.scale || 1, sx = (e.flip ? -s : s);
          var gc = sv("g", { transform: "translate(" + e.x + "," + e.y + ") scale(" + sx + "," + s + ")" });
          if (fn) { fn(gc, e); }
          else { // missing component — draw an obvious placeholder box (author should add it to LIB)
            gc.appendChild(sv("rect", { x: -24, y: -18, width: 48, height: 36, rx: 4, fill: "none", stroke: C.line, "stroke-width": 1.5, "stroke-dasharray": "4 4" }));
            gc.appendChild(txt(0, 0, "?" + (e.name || ""), C.soft, 10));
          }
          container.appendChild(gc);
          if (e.label) container.appendChild(lbl(e.x, e.y + (e.labelDy || 48), e.label, col(e.color || "ink"), e.labelSize || 12));
          break;
        }
        case "circle":
          container.appendChild(sv("circle", { cx: e.x, cy: e.y, r: e.r || 40, fill: "none", stroke: col(e.color || "soft"), "stroke-width": e.width || 1.8, "stroke-dasharray": e.dash ? "6 5" : null }));
          if (e.label) container.appendChild(lbl(e.x, e.y - (e.r || 40) - 8, e.label, col(e.color || "soft"), 12));
          break;
        case "charge": {
          var r = e.r || 15, cl = e.sign === "-" ? C.neg : C.pos;
          g = sv("g");
          g.appendChild(sv("circle", { cx: e.x, cy: e.y, r: r, fill: cl }));
          g.appendChild(sv("line", { x1: e.x - r * 0.5, y1: e.y, x2: e.x + r * 0.5, y2: e.y, stroke: "#fff", "stroke-width": 2.4, "stroke-linecap": "round" }));
          if (e.sign !== "-") g.appendChild(sv("line", { x1: e.x, y1: e.y - r * 0.5, x2: e.x, y2: e.y + r * 0.5, stroke: "#fff", "stroke-width": 2.4, "stroke-linecap": "round" }));
          if (e.label) g.appendChild(lbl(e.x, e.y + r + 13, e.label, C.ink, 12));
          container.appendChild(g);
          break;
        }
        case "region": {
          // a translucent material zone (dielectric, medium, region of interest) —
          // light enough that symbols/labels placed inside stay legible.
          var rw = e.w || 100, rh = e.h || 60;
          container.appendChild(sv("rect", { x: e.x, y: e.y, width: rw, height: rh, rx: e.rx != null ? e.rx : 4, fill: e.fill || "rgba(139,147,161,.14)", stroke: col(e.color || "soft"), "stroke-width": e.width || 1.5, "stroke-dasharray": e.dash ? "5 4" : null }));
          if (e.label) container.appendChild(lbl(e.x + rw / 2, e.y - 10, e.label, col(e.color || "soft"), 12));
          break;
        }
        case "plate": {
          var w = e.w || 12, h = e.h || 90;
          container.appendChild(sv("rect", { x: e.x, y: e.y, width: w, height: h, rx: 2, fill: e.charge === "-" ? C.neg : (e.charge === "+" ? C.pos : C.soft) }));
          if (e.label) container.appendChild(lbl(e.x + w / 2, e.y - 10, e.label, C.ink, 12));
          break;
        }
        case "point":
          container.appendChild(sv("circle", { cx: e.x, cy: e.y, r: e.r || 4, fill: col(e.color || "ink") }));
          if (e.label) container.appendChild(lbl(e.x, e.y - 12, e.label, col(e.color || "ink"), 12));
          break;
        case "lens": {
          var lh = e.h || 90, cx = e.x, cy = e.y;
          var bulge = e.kind === "concave" ? -10 : 14;
          container.appendChild(sv("path", { d: "M" + cx + " " + (cy - lh / 2) + " q " + bulge + " " + lh / 2 + " 0 " + lh + " q " + (-bulge) + " " + (-lh / 2) + " 0 " + (-lh), fill: "rgba(47,109,181,.14)", stroke: C.neg, "stroke-width": 1.8 }));
          container.appendChild(sv("line", { x1: cx, y1: cy - lh / 2 - 6, x2: cx, y2: cy + lh / 2 + 6, stroke: C.line, "stroke-width": 1, "stroke-dasharray": "3 3" }));
          break;
        }
        case "label":
          container.appendChild(lbl(e.x, e.y, e.text, col(e.color), e.size || 13, e.anchor));
          break;
      }
    });
  }

  function schematic(params) {
    var p = params || {}, vb = p.viewBox || [340, 210];
    var svg = sv("svg", { viewBox: "0 0 " + vb[0] + " " + vb[1], width: "100%", preserveAspectRatio: "xMidYMid meet" });
    svg.style.maxHeight = "300px";
    var defs = sv("defs");
    MARKER_NAMES.forEach(function (name) {
      var m = sv("marker", { id: "arh-" + name, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
      m.appendChild(sv("path", { d: "M0 0 L10 5 L0 10 z", fill: col(name) }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);

    // Animated: cycle frames (each frame is its own element set). Otherwise static.
    if (p.frames && p.frames.length) {
      // RULE: animations run 5–10 frames. Warn under 5; cap at 10.
      var frames = p.frames;
      if (frames.length > 10) { if (window.console) console.warn("[figures] animation has " + frames.length + " frames; capping at 10 (rule: 5–10)."); frames = frames.slice(0, 10); }
      else if (frames.length < 5 && window.console) console.warn("[figures] animation has " + frames.length + " frames; rule is a 5-frame minimum.");
      var stage = sv("g"); svg.appendChild(stage);
      var fi = 0, frameMs = p.frameMs || 1100;
      function drawFrame() { while (stage.firstChild) stage.removeChild(stage.firstChild); renderElements(stage, frames[fi]); }
      drawFrame();
      var last = 0;
      function tick(t) {
        if (!svg.isConnected) return;               // stop when removed from the DOM
        if (!last) last = t;
        if (t - last >= frameMs) { fi = (fi + 1) % frames.length; drawFrame(); last = t; }
        requestAnimationFrame(tick);
      }
      if (frames.length > 1) requestAnimationFrame(tick);
      svg.classList.add("is-animated");
    } else {
      renderElements(svg, p.elements || []);
    }
    return svg;
  }

  // A prebuilt SVG from the Diagram Generation Engine (build-time). The lesson
  // references a committed file (fig.src) or carries the markup inline (fig.svg).
  // Math is already baked into the SVG (KaTeX→MathML) so it needs no runtime KaTeX.
  function dgeEmbed(fig) {
    var host = document.createElement("div"); host.className = "dge-svg";
    function inject(markup) {
      host.innerHTML = markup;
      var s = host.querySelector("svg");
      if (s) { s.style.width = "100%"; s.style.height = "auto"; s.style.maxHeight = "320px"; s.removeAttribute("height"); }
    }
    if (fig.svg) inject(fig.svg);
    else if (fig.src) {
      fetch(fig.src, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
        .then(inject).catch(function () { host.textContent = ""; });
    }
    return host;
  }

  function draw(fig) {
    if (fig.type === "coordinate-plane") return coordinatePlane(fig.params);
    if (fig.type === "number-line") return numberLine(fig.params);
    if (fig.type === "schematic") return schematic(fig.params);
    if (fig.type === "svg" || fig.type === "dge") return dgeEmbed(fig);
    return null;
  }

  // Build a .figure element (canvas/svg + caption) for a figure spec.
  function element(fig) {
    if (!fig) return null;
    var wrap = document.createElement("div"); wrap.className = "figure";
    var node = draw(fig); if (node) wrap.appendChild(node);
    if (fig.caption) {
      var cap = document.createElement("p"); cap.className = "cap"; cap.textContent = fig.caption;
      wrap.appendChild(cap); StudyMath.render(cap);
    }
    return wrap;
  }

  return { element: element, draw: draw, colors: STD, LIB: LIB, hasComponent: function (n) { return !!LIB[n]; } };
})();
