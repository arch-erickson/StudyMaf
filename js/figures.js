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

  function draw(fig) {
    if (fig.type === "coordinate-plane") return coordinatePlane(fig.params);
    if (fig.type === "number-line") return numberLine(fig.params);
    return null;
  }

  // Build a .figure element (canvas + caption) for a figure spec.
  function element(fig) {
    var wrap = document.createElement("div"); wrap.className = "figure";
    var cv = draw(fig); if (cv) wrap.appendChild(cv);
    if (fig.caption) {
      var cap = document.createElement("p"); cap.className = "cap"; cap.textContent = fig.caption;
      wrap.appendChild(cap); StudyMath.render(cap);
    }
    return wrap;
  }

  return { element: element, draw: draw };
})();
