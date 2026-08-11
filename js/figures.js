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
  var C = { pos: "#E8553A", neg: "#2F6DB5", ink: "#2D3142", soft: "#8b93a1", line: "#c7cdd6" };
  function col(c) { if (!c) return C.ink; if (c === "accent") return accent(); return C[c] || c; }
  function sv(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]); return e; }
  function txt(x, y, s, fill, size, anchor) { var t = sv("text", { x: x, y: y, fill: fill || C.ink, "font-size": size || 13, "font-family": "Inter, sans-serif", "font-weight": 600, "text-anchor": anchor || "middle", "dominant-baseline": "middle" }); t.textContent = s; return t; }

  function renderElements(container, elements) {
    (elements || []).forEach(function (e) {
      var g;
      switch (e.kind) {
        case "line":
          container.appendChild(sv("line", { x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, stroke: col(e.color), "stroke-width": e.width || 2, "stroke-dasharray": e.dash ? "5 4" : null, "stroke-linecap": "round" }));
          break;
        case "vector": case "arrow": case "ray": {
          var cc = e.color || (e.kind === "ray" ? "accent" : "ink");
          var mk = cc === "accent" ? "arh-accent" : ("arh-" + (C[cc] ? cc : "ink"));
          container.appendChild(sv("line", { x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, stroke: col(cc), "stroke-width": e.width || 2.4, "stroke-linecap": "round", "marker-end": "url(#" + mk + ")" }));
          if (e.label) container.appendChild(txt((e.x1 + e.x2) / 2 + (e.dx || 0), (e.y1 + e.y2) / 2 + (e.dy || -8), e.label, col(cc), 12));
          break;
        }
        case "circle":
          container.appendChild(sv("circle", { cx: e.x, cy: e.y, r: e.r || 40, fill: "none", stroke: col(e.color || "soft"), "stroke-width": e.width || 1.8, "stroke-dasharray": e.dash ? "6 5" : null }));
          if (e.label) container.appendChild(txt(e.x, e.y - (e.r || 40) - 8, e.label, col(e.color || "soft"), 12));
          break;
        case "charge": {
          var r = e.r || 15, cl = e.sign === "-" ? C.neg : C.pos;
          g = sv("g");
          g.appendChild(sv("circle", { cx: e.x, cy: e.y, r: r, fill: cl }));
          g.appendChild(sv("line", { x1: e.x - r * 0.5, y1: e.y, x2: e.x + r * 0.5, y2: e.y, stroke: "#fff", "stroke-width": 2.4, "stroke-linecap": "round" }));
          if (e.sign !== "-") g.appendChild(sv("line", { x1: e.x, y1: e.y - r * 0.5, x2: e.x, y2: e.y + r * 0.5, stroke: "#fff", "stroke-width": 2.4, "stroke-linecap": "round" }));
          if (e.label) g.appendChild(txt(e.x, e.y + r + 13, e.label, C.ink, 12));
          container.appendChild(g);
          break;
        }
        case "plate": {
          var w = e.w || 12, h = e.h || 90;
          container.appendChild(sv("rect", { x: e.x, y: e.y, width: w, height: h, rx: 2, fill: e.charge === "-" ? C.neg : (e.charge === "+" ? C.pos : C.soft) }));
          if (e.label) container.appendChild(txt(e.x + w / 2, e.y - 10, e.label, C.ink, 12));
          break;
        }
        case "point":
          container.appendChild(sv("circle", { cx: e.x, cy: e.y, r: e.r || 4, fill: col(e.color || "ink") }));
          if (e.label) container.appendChild(txt(e.x, e.y - 12, e.label, col(e.color || "ink"), 12));
          break;
        case "lens": {
          var lh = e.h || 90, cx = e.x, cy = e.y;
          var bulge = e.kind === "concave" ? -10 : 14;
          container.appendChild(sv("path", { d: "M" + cx + " " + (cy - lh / 2) + " q " + bulge + " " + lh / 2 + " 0 " + lh + " q " + (-bulge) + " " + (-lh / 2) + " 0 " + (-lh), fill: "rgba(47,109,181,.14)", stroke: C.neg, "stroke-width": 1.8 }));
          container.appendChild(sv("line", { x1: cx, y1: cy - lh / 2 - 6, x2: cx, y2: cy + lh / 2 + 6, stroke: C.line, "stroke-width": 1, "stroke-dasharray": "3 3" }));
          break;
        }
        case "label":
          container.appendChild(txt(e.x, e.y, e.text, col(e.color), e.size || 13, e.anchor));
          break;
      }
    });
  }

  function schematic(params) {
    var p = params || {}, vb = p.viewBox || [340, 210];
    var svg = sv("svg", { viewBox: "0 0 " + vb[0] + " " + vb[1], width: "100%", preserveAspectRatio: "xMidYMid meet" });
    svg.style.maxHeight = "300px";
    var defs = sv("defs");
    ["ink", "pos", "neg", "soft", "accent"].forEach(function (name) {
      var m = sv("marker", { id: "arh-" + name, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
      m.appendChild(sv("path", { d: "M0 0 L10 5 L0 10 z", fill: name === "accent" ? accent() : C[name] }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);

    // Animated: cycle frames (each frame is its own element set). Otherwise static.
    if (p.frames && p.frames.length) {
      var stage = sv("g"); svg.appendChild(stage);
      var fi = 0, frameMs = p.frameMs || 1100;
      function drawFrame() { while (stage.firstChild) stage.removeChild(stage.firstChild); renderElements(stage, p.frames[fi]); }
      drawFrame();
      var last = 0;
      function tick(t) {
        if (!svg.isConnected) return;               // stop when removed from the DOM
        if (!last) last = t;
        if (t - last >= frameMs) { fi = (fi + 1) % p.frames.length; drawFrame(); last = t; }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      svg.classList.add("is-animated");
    } else {
      renderElements(svg, p.elements || []);
    }
    return svg;
  }

  function draw(fig) {
    if (fig.type === "coordinate-plane") return coordinatePlane(fig.params);
    if (fig.type === "number-line") return numberLine(fig.params);
    if (fig.type === "schematic") return schematic(fig.params);
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

  return { element: element, draw: draw };
})();
