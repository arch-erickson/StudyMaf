/* StudyMAF — Notebook: high-end scratch-work surface (iPad-first, Apple-Pencil-smooth).
 *
 * - Shows the problem while you work; the calculator floats above (higher z-index).
 * - Vector strokes → crisp at any zoom, clean undo/redo, smooth quadratic rendering.
 * - Tools: pen, highlighter, eraser, color, size, undo, redo, zoom out/in, scroll.
 * - Zoom + scroll are bounded to a generous virtual page.
 * - "Save As" stores a page to your Notebook (thumbnail + title + date) and can Share
 *   (native sheet → WhatsApp / Photos) or open ChatGPT.
 * - Auto-saves your strokes on close so nothing is lost; resumes when you reopen.
 */
window.Notebook = (function () {
  "use strict";
  var PAGE_W = 1100, PAGE_H = 1500, MIN_ZOOM = 0.4, MAX_ZOOM = 2.5;
  var overlay, canvas, ctx, base, baseCtx, dpr = 1, active = {};
  var strokes = [], history = [], future = [], cur = null;
  var tool = "pencil", color = "#2D3142", size = 2.4, opacity = 1, smoothing = 0.35, zoom = 1, layout = "full";
  var curvePts = [], curveDoneBtn = null;  // Illustrator-style curvature tool: click to add anchor points
  var shapeType = "rect", shapeFill = null, selected = null;  // shapes + select/move tools
  var grid = { type: "ruled", size: 40, color: "#c3ccd9", opacity: 0.7 };
  var ctxInfo = null;

  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function ic(n) { return window.Icons ? Icons.get(n) : ""; }
  function labeledSlider(label, min, max, val, oninput) {
    var wrap = el("span", "nb-slider"); wrap.appendChild(el("span", "nb-slider-lbl", label));
    var r = document.createElement("input"); r.type = "range"; r.min = min; r.max = max; r.value = val; r.className = "nb-size";
    r.oninput = function () { oninput(+r.value); }; wrap.appendChild(r); return wrap;
  }

  // ---------------- open ----------------
  function openScratch(info) {
    ctxInfo = info || {};
    tool = "pencil"; zoom = 1; history = []; future = []; selected = null; curvePts = []; active = {};
    grid = Store.getGrid();
    strokes = loadStrokes();
    overlay = document.getElementById("draw-overlay");
    overlay.innerHTML = ""; overlay.hidden = false; overlay.setAttribute("aria-hidden", "false");
    overlay.className = "nb-overlay" + (layout === "right" ? " split" : "");
    if (layout === "right" && ctxInfo.hasSession) document.body.classList.add("nb-split");

    var shell = el("div", "nb-shell");

    // top bar
    var top = el("div", "nb-top");
    var closeBtn = el("button", "nb-x"); closeBtn.innerHTML = ic("x"); closeBtn.title = "Close (auto-saves)";
    var title = el("div", "nb-title", ctxInfo.lessonName || "Scratch work");
    var calcBtn = el("button", "btn ghost"); calcBtn.innerHTML = ic("calculator") + "<span>Calculator</span>";
    var saveBtn = el("button", "btn primary"); saveBtn.innerHTML = ic("save") + "<span>Save As</span>";
    top.append(closeBtn, title, calcBtn, saveBtn); shell.appendChild(top);

    // question banner
    if (ctxInfo.prompt) {
      var q = el("div", "nb-question");
      q.appendChild(el("span", "nb-qtag", ctxInfo.problemLabel || "Problem"));
      var qt = el("span", "nb-qtext"); qt.textContent = ctxInfo.prompt; q.appendChild(qt);
      shell.appendChild(q); requestAnimationFrame(function () { StudyMath.render(qt); });
    }

    // tool bar
    var bar = el("div", "nb-tools");
    var tools = [
      ["pencil", "pencil", "Pencil — smooth handwriting"], ["brush", "brush", "Brush — pressure"],
      ["highlighter", "highlighter", "Highlighter"], ["pen", "polyline", "Pen — tap points for straight lines (tap the first point to close a shape)"],
      ["curve", "curve", "Curvature — tap points for a smooth curve"], ["shapes", "shapes", "Shapes"],
      ["select", "cursor", "Select & move"], ["eraser", "eraser", "Eraser"]
    ];
    var toolBtns = {};
    tools.forEach(function (t) {
      var b = el("button", "nb-tbtn" + (tool === t[0] ? " on" : "")); b.innerHTML = ic(t[1]); b.title = t[2];
      b.onclick = function () { finishCurve(); setTool(t[0], toolBtns); }; toolBtns[t[0]] = b; bar.appendChild(b);
    });
    var col = document.createElement("input"); col.type = "color"; col.value = color; col.className = "nb-color"; col.title = "Color";
    col.oninput = function () { color = col.value; if (tool === "eraser") setTool("pen", toolBtns); };
    bar.appendChild(col);
    bar.appendChild(labeledSlider("Size", 1, 20, size, function (v) { size = v; }));
    bar.appendChild(labeledSlider("Opacity", 10, 100, Math.round(opacity * 100), function (v) { opacity = v / 100; }));
    bar.appendChild(labeledSlider("Smooth", 0, 90, Math.round(smoothing * 100), function (v) { smoothing = v / 100; }));
    var doneCurveB = el("button", "nb-tbtn nb-curve-done"); doneCurveB.innerHTML = ic("check2"); doneCurveB.title = "Finish curve"; doneCurveB.style.display = "none";
    doneCurveB.onclick = finishCurve; bar.appendChild(doneCurveB);
    curveDoneBtn = doneCurveB;
    shell.appendChild(bar);

    // canvas area = scroller + a VERTICAL settings toolbar on the right
    var area = el("div", "nb-area");
    var scroller = el("div", "nb-scroller");
    canvas = document.createElement("canvas"); canvas.className = "nb-canvas";
    scroller.appendChild(canvas); area.appendChild(scroller);

    var side = el("div", "nb-side");
    var undoB = el("button", "nb-tbtn"); undoB.innerHTML = ic("undo"); undoB.title = "Undo"; undoB.onclick = undo;
    var redoB = el("button", "nb-tbtn"); redoB.innerHTML = ic("undo"); redoB.title = "Redo";
    redoB.querySelector("svg").style.transform = "scaleX(-1)"; redoB.onclick = redo;
    var clearB = el("button", "nb-tbtn"); clearB.innerHTML = ic("trash"); clearB.title = "Delete all"; clearB.onclick = deleteAll;
    var gridB = el("button", "nb-tbtn"); gridB.innerHTML = ic("grid"); gridB.title = "Grid & guides"; gridB.onclick = function (e) { toggleGridPanel(gridB); e.stopPropagation(); };
    side.append(undoB, redoB, clearB, gridB);
    if (ctxInfo.hasSession) {
      var splitB = el("button", "nb-tbtn" + (layout === "right" ? " on" : "")); splitB.innerHTML = ic("columns");
      splitB.title = "Side-by-side with the problem";
      splitB.onclick = function () { setLayout(layout === "right" ? "full" : "right"); splitB.classList.toggle("on", layout === "right"); };
      side.appendChild(splitB);
    }
    var zoomIn = el("button", "nb-tbtn"); zoomIn.innerHTML = ic("zoomIn"); zoomIn.title = "Zoom in"; zoomIn.onclick = function () { setZoom(zoom * 1.25); };
    var zoomOut = el("button", "nb-tbtn"); zoomOut.innerHTML = ic("zoomOut"); zoomOut.title = "Zoom out"; zoomOut.onclick = function () { setZoom(zoom / 1.25); };
    var zLabel = el("span", "nb-zoom"); zLabel.id = "nb-zoom";
    side.append(zoomIn, zoomOut, zLabel);
    area.appendChild(side); shell.appendChild(area);
    overlay.appendChild(shell);

    calcBtn.onclick = function () { Calculator.open(); };
    saveBtn.onclick = openSaveAs;
    closeBtn.onclick = function () { autoSaveAndClose(); };

    setupCanvas();
    setZoom(1);
    setupInput();
  }

  var toolBtnsRef = null;
  function setTool(t, btns) {
    tool = t; if (btns) toolBtnsRef = btns;
    if (toolBtnsRef) Object.keys(toolBtnsRef).forEach(function (k) { toolBtnsRef[k].classList.toggle("on", k === t); });
    closeShapesPicker();
    if (t !== "select") { selected = null; closePropsPanel(); paint && ctx && paint(); }
    if (t === "shapes" && toolBtnsRef && toolBtnsRef.shapes) openShapesPicker(toolBtnsRef.shapes);
  }

  // ---- shapes picker ----
  var shapesPicker = null;
  var PRIMS = [["rect", "▭"], ["square", "◻"], ["ellipse", "◯"], ["circle", "●"], ["triangle", "△"], ["line", "／"], ["cylinder", "⌭"], ["pyramid", "△"]];
  function openShapesPicker(anchor) {
    closeShapesPicker();
    shapesPicker = el("div", "nb-shapes-picker");
    PRIMS.forEach(function (p) {
      var b = el("button", "nb-prim" + (shapeType === p[0] ? " on" : ""), p[1]); b.title = p[0];
      b.onclick = function () { shapeType = p[0]; shapesPicker.querySelectorAll(".nb-prim").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); };
      shapesPicker.appendChild(b);
    });
    document.querySelector(".nb-shell").appendChild(shapesPicker);
    var r = anchor.getBoundingClientRect();
    shapesPicker.style.top = (r.bottom + 6) + "px"; shapesPicker.style.left = Math.max(8, r.left) + "px";
  }
  function closeShapesPicker() { if (shapesPicker) { shapesPicker.remove(); shapesPicker = null; } }

  // ---- selection properties (stroke + fill editor) ----
  var propsPanel = null;
  function openPropsPanel() {
    closePropsPanel(); if (selected == null || !strokes[selected]) return;
    var s = strokes[selected];
    propsPanel = el("div", "nb-props-panel");
    var canFill = s.shape || s.closed;
    var col = document.createElement("input"); col.type = "color"; col.value = s.color || "#2D3142"; col.className = "nb-color";
    col.oninput = function () { s.color = col.value; render(); };
    var strokeRow = el("div", "nb-gp-row"); strokeRow.appendChild(el("span", "nb-gp-label", "Stroke")); strokeRow.appendChild(col);
    var wr = document.createElement("input"); wr.type = "range"; wr.min = "1"; wr.max = "20"; wr.value = String(s.size || 2); wr.className = "nb-gp-slider";
    wr.oninput = function () { s.size = +wr.value; render(); }; strokeRow.appendChild(wr);
    propsPanel.appendChild(strokeRow);
    propsPanel.appendChild(sliderRow("Opacity", 10, 100, Math.round((s.opacity != null ? s.opacity : 1) * 100), function (v) { s.opacity = v / 100; render(); }, "%"));
    if (canFill) {
      var frow = el("div", "nb-gp-row"); frow.appendChild(el("span", "nb-gp-label", "Fill"));
      var fc = document.createElement("input"); fc.type = "color"; fc.value = s.fill || "#EF8354"; fc.className = "nb-color";
      fc.oninput = function () { s.fill = fc.value; if (s.fillOpacity == null) s.fillOpacity = 0.35; render(); }; frow.appendChild(fc);
      var noFill = el("button", "nb-seg-btn", "none"); noFill.onclick = function () { s.fill = null; render(); }; frow.appendChild(noFill);
      propsPanel.appendChild(frow);
      propsPanel.appendChild(sliderRow("Fill α", 5, 100, Math.round((s.fillOpacity != null ? s.fillOpacity : 0.35) * 100), function (v) { s.fillOpacity = v / 100; render(); }, "%"));
    }
    var del = el("button", "btn subtle", "Delete"); del.style.width = "100%";
    del.onclick = function () { pushHistory(); strokes.splice(selected, 1); selected = null; closePropsPanel(); render(); };
    propsPanel.appendChild(del);
    document.querySelector(".nb-shell").appendChild(propsPanel);
  }
  function closePropsPanel() { if (propsPanel) { propsPanel.remove(); propsPanel = null; } }

  // ---------------- canvas + render ----------------
  function setupCanvas() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = PAGE_W * dpr; canvas.height = PAGE_H * dpr;
    ctx = canvas.getContext("2d");
    base = document.createElement("canvas"); base.width = canvas.width; base.height = canvas.height;
    baseCtx = base.getContext("2d");
    render();
  }
  function setZoom(z) {
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
    canvas.style.width = (PAGE_W * zoom) + "px";
    canvas.style.height = (PAGE_H * zoom) + "px";
    curRect = null; // canvas resized, cached rect is stale
    var lab = document.getElementById("nb-zoom"); if (lab) lab.textContent = Math.round(zoom * 100) + "%";
  }
  // render() bakes the committed strokes onto an offscreen base, then paint() blits
  // that base and draws in-progress strokes on top as ONE smooth path each. Drawing a
  // stroke as a single path (instead of stacking incremental segments) keeps lines
  // continuous AND keeps opacity/highlighter consistent between live and re-render.
  function render() { rebuildBase(); paint(); }
  // draw only the newest segment of the active stroke directly on the main canvas —
  // no full re-blit, so contact is instant while writing (committed strokes stay on
  // the base layer and are re-rendered correctly on commit).
  function drawLiveSegment(s) {
    var pts = s.points, n = pts.length; if (n < 2) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); styleOn(ctx, s);
    if (s.tool === "brush") {
      ctx.lineWidth = brushWidth(s, (pts[n - 2].p + pts[n - 1].p) / 2);
      ctx.beginPath(); ctx.moveTo(pts[n - 2].x, pts[n - 2].y); ctx.lineTo(pts[n - 1].x, pts[n - 1].y); ctx.stroke();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; return;
    }
    ctx.beginPath();
    if (n === 2) { ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); }
    else { var p0 = pts[n - 3], p1 = pts[n - 2], p2 = pts[n - 1];
      ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2); ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2); }
    ctx.stroke(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  function rebuildBase() {
    baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    baseCtx.clearRect(0, 0, PAGE_W, PAGE_H);
    baseCtx.fillStyle = "#ffffff"; baseCtx.fillRect(0, 0, PAGE_W, PAGE_H);
    drawGridOn(baseCtx);
    strokes.forEach(function (s) { drawStrokeOn(baseCtx, s); });
  }
  function paint() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);
    for (var id in active) { var st = active[id].stroke; if (st && (st.shape || (st.points && st.points.length))) drawStrokeOn(ctx, st); }
    drawCurvePreviewOn(ctx);
    if (selected != null && strokes[selected]) drawSelection(ctx, strokes[selected]);
  }
  function drawSelection(c, s) {
    var bb = bboxOf(s); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.strokeStyle = "#EF8354"; c.lineWidth = 1.5; c.globalAlpha = 1; c.setLineDash([6, 4]);
    c.strokeRect(bb.x - 6, bb.y - 6, bb.w + 12, bb.h + 12); c.setLineDash([]);
  }
  function bboxOf(s) {
    if (s.shape) { return { x: Math.min(s.x, s.x + s.w), y: Math.min(s.y, s.y + s.h), w: Math.abs(s.w), h: Math.abs(s.h) }; }
    var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    (s.points || []).forEach(function (p) { if (p.x < minx) minx = p.x; if (p.y < miny) miny = p.y; if (p.x > maxx) maxx = p.x; if (p.y > maxy) maxy = p.y; });
    return { x: minx, y: miny, w: maxx - minx, h: maxy - miny };
  }
  function hitTest(p) {
    for (var i = strokes.length - 1; i >= 0; i--) {
      var s = strokes[i], bb = bboxOf(s);
      if (s.shape || s.closed) { if (p.x >= bb.x - 8 && p.x <= bb.x + bb.w + 8 && p.y >= bb.y - 8 && p.y <= bb.y + bb.h + 8) return i; }
      else if (s.points) { for (var j = 0; j < s.points.length; j++) { if (Math.hypot(s.points[j].x - p.x, s.points[j].y - p.y) <= (s.size || 3) + 9) return i; } }
    }
    return null;
  }
  function translateSelected(dx, dy) { var s = strokes[selected]; if (!s) return; if (s.shape) { s.x += dx; s.y += dy; } else (s.points || []).forEach(function (p) { p.x += dx; p.y += dy; }); }
  function drawCurvePreviewOn(c) {
    if (!curvePts.length) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (curvePts.length >= 2) {
      c.globalAlpha = opacity; c.strokeStyle = color; c.lineWidth = size; c.lineCap = "round"; c.lineJoin = "round";
      var d = tool === "pen" ? curvePts : catmullRom(curvePts); c.beginPath(); c.moveTo(d[0].x, d[0].y);
      for (var i = 1; i < d.length; i++) c.lineTo(d[i].x, d[i].y);
      c.stroke(); c.globalAlpha = 1;
    }
    c.fillStyle = "#EF8354";
    curvePts.forEach(function (p) { c.beginPath(); c.arc(p.x, p.y, 5, 0, Math.PI * 2); c.fill(); });
  }
  // Catmull-Rom spline through the anchor points -> dense polyline
  function catmullRom(ps) {
    if (ps.length < 3) return ps.slice();
    var out = [], p;
    for (var i = 0; i < ps.length - 1; i++) {
      var p0 = ps[i - 1] || ps[i], p1 = ps[i], p2 = ps[i + 1], p3 = ps[i + 2] || ps[i + 1];
      for (var t = 0; t < 1; t += 0.1) {
        var t2 = t * t, t3 = t2 * t;
        p = { x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
              y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3) };
        out.push(p);
      }
    }
    out.push(ps[ps.length - 1]);
    return out;
  }
  // ---- primitive shapes (drawn from a bounding box x,y,w,h) ----
  function shapePath(c, s) {
    var x = s.x, y = s.y, w = s.w, h = s.h; c.beginPath();
    switch (s.shape) {
      case "rect": c.rect(x, y, w, h); break;
      case "square": { var m = Math.min(Math.abs(w), Math.abs(h)) * (w < 0 ? -1 : 1), m2 = Math.min(Math.abs(w), Math.abs(h)) * (h < 0 ? -1 : 1); c.rect(x, y, m, m2); break; }
      case "ellipse": c.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2); break;
      case "circle": { var r = Math.min(Math.abs(w), Math.abs(h)) / 2; c.arc(x + (w < 0 ? -r : r), y + (h < 0 ? -r : r), r, 0, Math.PI * 2); break; }
      case "triangle": c.moveTo(x + w / 2, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); break;
      case "line": c.moveTo(x, y); c.lineTo(x + w, y + h); break;
      case "cylinder": { var ry = Math.abs(h) * 0.14; c.moveTo(x, y + ry); c.lineTo(x, y + h - ry); c.ellipse(x + w / 2, y + h - ry, Math.abs(w / 2), ry, 0, Math.PI, 0, true); c.moveTo(x + w, y + ry); c.lineTo(x + w, y + h - ry); c.moveTo(x, y + ry); c.ellipse(x + w / 2, y + ry, Math.abs(w / 2), ry, 0, 0, Math.PI * 2); break; }
      case "pyramid": c.moveTo(x + w / 2, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.moveTo(x + w / 2, y); c.lineTo(x + w * 0.62, y + h * 0.86); c.moveTo(x, y + h); c.lineTo(x + w * 0.62, y + h * 0.86); break;
    }
  }
  function drawShapeOn(c, s) {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.lineCap = "round"; c.lineJoin = "round"; c.globalCompositeOperation = "source-over";
    shapePath(c, s);
    if (s.fill) { c.globalAlpha = (s.fillOpacity != null ? s.fillOpacity : 1); c.fillStyle = s.fill; c.fill(); }
    c.globalAlpha = (s.opacity != null ? s.opacity : 1); c.strokeStyle = s.color; c.lineWidth = s.size || 2; c.stroke();
    c.globalAlpha = 1;
  }

  function finishCurve(closed) {
    if (curveDoneBtn) curveDoneBtn.style.display = "none";
    if (curvePts.length >= 2) {
      pushHistory();
      if (tool === "pen") strokes.push({ tool: "pen", straight: true, closed: !!closed, fill: closed ? shapeFill : null, color: color, size: size, opacity: opacity, points: curvePts.slice() });
      else strokes.push({ tool: "pen", color: color, size: size, opacity: opacity, points: catmullRom(curvePts) });
    }
    curvePts = []; render();
  }
  function drawGridOn(c) {
    if (!grid || grid.type === "none") return;
    var s = Math.max(8, grid.size || 40);
    c.globalAlpha = grid.opacity != null ? grid.opacity : 0.7;
    c.strokeStyle = grid.color || "#c3ccd9"; c.fillStyle = grid.color || "#c3ccd9"; c.lineWidth = 1;
    var x, y;
    if (grid.type === "ruled") {
      for (y = s; y < PAGE_H; y += s) { c.beginPath(); c.moveTo(0, y); c.lineTo(PAGE_W, y); c.stroke(); }
    } else if (grid.type === "grid") {
      for (y = s; y < PAGE_H; y += s) { c.beginPath(); c.moveTo(0, y); c.lineTo(PAGE_W, y); c.stroke(); }
      for (x = s; x < PAGE_W; x += s) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, PAGE_H); c.stroke(); }
    } else if (grid.type === "dots") {
      for (y = s; y < PAGE_H; y += s) for (x = s; x < PAGE_W; x += s) { c.beginPath(); c.arc(x, y, 1.4, 0, Math.PI * 2); c.fill(); }
    }
    c.globalAlpha = 1;
  }
  function styleOn(c, s) {
    c.lineCap = "round"; c.lineJoin = "round";
    c.globalCompositeOperation = s.tool === "eraser" ? "destination-out" : "source-over";
    c.globalAlpha = (s.tool === "highlighter" ? 0.32 : 1) * (s.opacity != null ? s.opacity : 1);
    c.strokeStyle = s.color; c.fillStyle = s.color;
    c.lineWidth = s.tool === "highlighter" ? s.size * 6 : (s.tool === "eraser" ? s.size * 6 : s.size);
  }
  function brushWidth(s, p) { return s.size * (0.35 + 1.4 * (p != null ? p : 0.5)); }
  function drawStrokeOn(c, s) {
    if (s.shape) { drawShapeOn(c, s); return; }
    var pts = s.points; if (!pts || !pts.length) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); styleOn(c, s);
    if (s.straight) { // pen tool: straight segments between anchor points (optionally closed)
      c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
      for (var k = 1; k < pts.length; k++) c.lineTo(pts[k].x, pts[k].y);
      if (s.closed) c.closePath();
      if (s.closed && s.fill) { c.fillStyle = s.fill; c.globalAlpha = (s.fillOpacity != null ? s.fillOpacity : 1); c.fill(); c.globalAlpha = (s.opacity != null ? s.opacity : 1); }
      c.stroke(); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; return;
    }
    if (s.tool === "brush") { // pressure-varying width, drawn as connected round segments
      for (var b = 1; b < pts.length; b++) {
        c.lineWidth = brushWidth(s, (pts[b - 1].p + pts[b].p) / 2);
        c.beginPath(); c.moveTo(pts[b - 1].x, pts[b - 1].y); c.lineTo(pts[b].x, pts[b].y); c.stroke();
      }
      c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; return;
    }
    // pencil / highlighter / finished curve: one smooth path through the points
    c.beginPath();
    if (pts.length < 3) { c.moveTo(pts[0].x, pts[0].y); c.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y); }
    else {
      c.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length - 1; i++) { c.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2); }
      c.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    }
    c.stroke(); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
  }

  // ---------------- input: pen/mouse draws, 1 finger pans, 2 fingers pinch-zoom ----------------
  // Cache the canvas rect during a stroke. Calling getBoundingClientRect() on every
  // pointer/coalesced event forces a layout reflow that janks fast writing on iPad.
  var curRect = null;
  function invalidateRect() { curRect = null; }
  function toPage(cx, cy) { var r = curRect || (curRect = canvas.getBoundingClientRect()); return { x: (cx - r.left) / zoom, y: (cy - r.top) / zoom }; }
  function setupInput() {
    var pointers = {}, gesture = null;
    var scroller = canvas.parentElement;
    // any movement of the canvas invalidates the cached rect
    scroller.addEventListener("scroll", invalidateRect, { passive: true });
    window.addEventListener("resize", invalidateRect);
    // CRITICAL for iPad: swallow the raw touch/gesture events on the canvas so Safari
    // never runs its double-tap / pinch / Scribble recognizer here. Without this it
    // CANCELS the quick second pen-down while it "waits to see" if you're gesturing,
    // which is why the stroke right after the first one gets dropped. Pointer events
    // still fire, so drawing/panning keep working.
    var stop = function (e) { e.preventDefault(); };
    ["touchstart", "touchmove", "touchend", "touchcancel", "gesturestart", "gesturechange", "gestureend"].forEach(function (ev) {
      canvas.addEventListener(ev, stop, { passive: false });
    });
    canvas.style.touchAction = "none"; canvas.style.webkitUserSelect = "none"; canvas.style.webkitTouchCallout = "none";
    function touches() { return Object.keys(pointers).filter(function (id) { return pointers[id].type === "touch"; }).map(function (id) { return pointers[id]; }); }

    // Each pen/mouse pointer gets its OWN in-progress stroke, so a fast second
    // pen-down can never overwrite the first stroke's buffer (the cause of dropped
    // strokes when writing quickly). `active[id]` = { stroke } or { erase:true }.
    var active = {}, lastTap = 0, lastTapXY = null;
    canvas.addEventListener("pointerdown", function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY, type: e.pointerType };
      if (e.pointerType === "pen" || e.pointerType === "mouse") {
        curRect = canvas.getBoundingClientRect();
        var pp = toPage(e.clientX, e.clientY);
        if (tool === "select") { // click to select a shape/stroke, drag to move it
          selected = hitTest(pp);
          if (selected != null) { pushHistory(); active[e.pointerId] = { move: true, last: pp }; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} openPropsPanel(); }
          else { closePropsPanel(); }
          paint(); e.preventDefault(); return;
        }
        if (tool === "shapes") { // drag out a primitive from its bounding box
          pushHistory();
          active[e.pointerId] = { shapeDraw: true, stroke: { shape: shapeType, x: pp.x, y: pp.y, w: 0, h: 0, color: color, size: size, opacity: opacity, fill: shapeFill } };
          try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
          e.preventDefault(); return;
        }
        if (tool === "curve" || tool === "pen") { // tap to place anchor points (vector tools)
          var now = Date.now();
          if (tool === "pen" && curvePts.length > 2 && Math.hypot(pp.x - curvePts[0].x, pp.y - curvePts[0].y) < 16) { finishCurve(true); e.preventDefault(); return; } // tap first point to close
          if (lastTapXY && now - lastTap < 400 && Math.hypot(pp.x - lastTapXY.x, pp.y - lastTapXY.y) < 16) { finishCurve(); lastTapXY = null; e.preventDefault(); return; }
          curvePts.push(pp); lastTap = now; lastTapXY = pp;
          if (curveDoneBtn) curveDoneBtn.style.display = curvePts.length ? "" : "none";
          render(); e.preventDefault(); return;
        }
        pushHistory();
        if (tool === "eraser") { active[e.pointerId] = { erase: true }; eraseAt(pp); }
        else { if (tool === "brush") pp.p = e.pressure || 0.5; active[e.pointerId] = { stroke: { tool: tool, color: color, size: size, opacity: opacity, points: [pp] } }; }
        try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
        e.preventDefault();
      } else { gesture = null; }
    });

    canvas.addEventListener("pointermove", function (e) {
      var pt = pointers[e.pointerId]; if (!pt) return;
      pt.x = e.clientX; pt.y = e.clientY;
      var a = active[e.pointerId];
      if (a) {
        if (a.shapeDraw) { var sp = toPage(e.clientX, e.clientY); a.stroke.w = sp.x - a.stroke.x; a.stroke.h = sp.y - a.stroke.y; paint(); e.preventDefault(); return; }
        if (a.move && selected != null) { var mp = toPage(e.clientX, e.clientY); translateSelected(mp.x - a.last.x, mp.y - a.last.y); a.last = mp; paint(); e.preventDefault(); return; }
        var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; if (!evs.length) evs = [e];
        if (a.erase) { evs.forEach(function (ev) { eraseAt(toPage(ev.clientX, ev.clientY)); }); }
        else {
          evs.forEach(function (ev) {
            var p = toPage(ev.clientX, ev.clientY);
            if (a.stroke.tool === "brush") p.p = ev.pressure || 0.5;
            var last = a.stroke.points[a.stroke.points.length - 1];
            if (last) {
              if (Math.abs(last.x - p.x) < 0.7 && Math.abs(last.y - p.y) < 0.7) return; // skip micro-jitter
              // real-time smoothing: ease the new point toward the last one
              var k = (a.stroke.tool === "pencil" || a.stroke.tool === "brush") ? smoothing : 0;
              p.x = last.x * k + p.x * (1 - k); p.y = last.y * k + p.y * (1 - k);
            }
            a.stroke.points.push(p);
            drawLiveSegment(a.stroke);   // instant incremental draw (no full re-blit)
          });
        }
        e.preventDefault(); return;
      }
      var ts = touches();
      if (ts.length >= 2) {
        var t0 = ts[0], t1 = ts[1], dist = Math.hypot(t0.x - t1.x, t0.y - t1.y), cx = (t0.x + t1.x) / 2, cy = (t0.y + t1.y) / 2;
        if (gesture && gesture.dist) { setZoom(zoom * (dist / gesture.dist)); scroller.scrollLeft -= (cx - gesture.cx); scroller.scrollTop -= (cy - gesture.cy); }
        gesture = { dist: dist, cx: cx, cy: cy }; e.preventDefault();
      } else if (ts.length === 1) {
        var p = ts[0];
        if (gesture && gesture.single) { scroller.scrollLeft -= (p.x - gesture.sx); scroller.scrollTop -= (p.y - gesture.sy); }
        gesture = { single: true, sx: p.x, sy: p.y }; e.preventDefault();
      }
    }, { passive: false });

    function end(e) {
      var a = active[e.pointerId];
      if (a) {
        if (a.shapeDraw) { if (Math.abs(a.stroke.w) > 3 || Math.abs(a.stroke.h) > 3) { strokes.push(a.stroke); selected = strokes.length - 1; delete active[e.pointerId]; render(); openPropsPanel(); } else { history.pop(); delete active[e.pointerId]; paint(); } }
        else if (a.move) { delete active[e.pointerId]; render(); }
        else if (a.stroke && a.stroke.points.length > 0) { strokes.push(a.stroke); delete active[e.pointerId]; render(); }
        else { history.pop(); delete active[e.pointerId]; }   // erase, or empty stroke: drop the snapshot
      }
      delete pointers[e.pointerId];
      if (touches().length < 2) gesture = null;
    }
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    window.addEventListener("pointerup", end);   // safety net if a pointerup misses the canvas
  }

  // object eraser: removes whole strokes the eraser touches (keeps the grid intact)
  function eraseAt(p) {
    var r = Math.max(10, size * 4), before = strokes.length;
    strokes = strokes.filter(function (s) { return !strokeNear(s, p, r); });
    if (strokes.length !== before) render();
  }
  function strokeNear(s, p, r) {
    var pts = s.points; for (var i = 0; i < pts.length; i++) { if (Math.abs(pts[i].x - p.x) <= r && Math.abs(pts[i].y - p.y) <= r) { if (Math.hypot(pts[i].x - p.x, pts[i].y - p.y) <= r) return true; } } return false;
  }

  function pushHistory() { history.push(strokes.slice()); if (history.length > 60) history.shift(); future = []; }
  function undo() { if (!history.length) return; future.push(strokes.slice()); strokes = history.pop(); render(); }
  function redo() { if (!future.length) return; history.push(strokes.slice()); strokes = future.pop(); render(); }
  function deleteAll() { if (!strokes.length) return; pushHistory(); strokes = []; render(); }
  function setLayout(mode) {
    layout = mode;
    overlay.classList.toggle("split", mode === "right");
    document.body.classList.toggle("nb-split", mode === "right" && !!ctxInfo.hasSession);
    requestAnimationFrame(setupCanvas);
  }

  // ---------------- grid & guides panel ----------------
  var gridPanel = null;
  function toggleGridPanel(anchor) {
    if (gridPanel) { gridPanel.remove(); gridPanel = null; return; }
    gridPanel = el("div", "nb-grid-panel");
    var types = [["none", "None"], ["ruled", "Ruled"], ["grid", "Graph"], ["dots", "Dots"]];
    var typeRow = el("div", "nb-gp-row");
    typeRow.appendChild(el("span", "nb-gp-label", "Type"));
    var seg = el("div", "nb-seg");
    types.forEach(function (t) {
      var b = el("button", "nb-seg-btn" + (grid.type === t[0] ? " on" : ""), t[1]);
      b.onclick = function () { grid.type = t[0]; seg.querySelectorAll(".nb-seg-btn").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); applyGrid(); };
      seg.appendChild(b);
    });
    typeRow.appendChild(seg); gridPanel.appendChild(typeRow);

    gridPanel.appendChild(sliderRow("Scale", 12, 100, grid.size, function (v) { grid.size = v; applyGrid(); }, "px"));
    gridPanel.appendChild(sliderRow("Opacity", 10, 100, Math.round(grid.opacity * 100), function (v) { grid.opacity = v / 100; applyGrid(); }, "%"));

    var colorRow = el("div", "nb-gp-row");
    colorRow.appendChild(el("span", "nb-gp-label", "Color"));
    var swatches = ["#c3ccd9", "#9fb2cc", "#a7d3b6", "#e2b7a0", "#c9b8e0", "#2D3142"];
    var sw = el("div", "nb-swatches");
    swatches.forEach(function (c) {
      var b = el("button", "nb-sw"); b.style.background = c;
      b.onclick = function () { grid.color = c; applyGrid(); };
      sw.appendChild(b);
    });
    var custom = document.createElement("input"); custom.type = "color"; custom.value = grid.color; custom.className = "nb-color";
    custom.oninput = function () { grid.color = custom.value; applyGrid(); };
    sw.appendChild(custom);
    colorRow.appendChild(sw); gridPanel.appendChild(colorRow);

    document.querySelector(".nb-shell").appendChild(gridPanel);
    var r = anchor.getBoundingClientRect();
    gridPanel.style.top = (r.bottom + 6) + "px";
    gridPanel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 280)) + "px";
    setTimeout(function () { document.addEventListener("pointerdown", closeGridOnOutside, true); }, 0);
  }
  function sliderRow(label, min, max, val, oninput, unit) {
    var row = el("div", "nb-gp-row");
    row.appendChild(el("span", "nb-gp-label", label));
    var rng = document.createElement("input"); rng.type = "range"; rng.min = min; rng.max = max; rng.value = val; rng.className = "nb-gp-slider";
    var out = el("span", "nb-gp-val", val + (unit || ""));
    rng.oninput = function () { out.textContent = rng.value + (unit || ""); oninput(+rng.value); };
    row.append(rng, out); return row;
  }
  function applyGrid() { Store.setGrid(grid); render(); }
  function closeGridOnOutside(e) {
    if (gridPanel && !gridPanel.contains(e.target) && !e.target.closest(".nb-tbtn")) {
      gridPanel.remove(); gridPanel = null; document.removeEventListener("pointerdown", closeGridOnOutside, true);
    }
  }

  // ---------------- persistence ----------------
  function loadStrokes() {
    try { var j = Store.getScratch(ctxInfo.classId, ctxInfo.lessonId, ctxInfo.problemId); return j ? JSON.parse(j) : []; }
    catch (e) { return []; }
  }
  function persist() {
    try { Store.saveScratch(ctxInfo.classId, ctxInfo.lessonId, ctxInfo.problemId, strokes.length ? JSON.stringify(strokes) : null); } catch (e) {}
  }
  function autoSaveAndClose() { persist(); close(); }
  function close() {
    if (overlay) { overlay.hidden = true; overlay.setAttribute("aria-hidden", "true"); overlay.innerHTML = ""; overlay.className = "nb-overlay"; }
    document.body.classList.remove("nb-split");
    if (gridPanel) { gridPanel.remove(); gridPanel = null; }
    closePropsPanel(); closeShapesPicker(); selected = null;
    // never leave a blank page: if no problem session is open, re-render the current route
    if (!document.querySelector(".session") && window.App && App.rerender) App.rerender();
  }

  // ---------------- export image ----------------
  function exportImage(maxW) {
    var scale = (maxW || PAGE_W) / PAGE_W;
    var c = document.createElement("canvas"); c.width = PAGE_W * scale; c.height = PAGE_H * scale;
    var x = c.getContext("2d"); x.scale(scale, scale);
    x.fillStyle = "#fff"; x.fillRect(0, 0, PAGE_W, PAGE_H);
    var savedCtx = ctx; ctx = x; strokes.forEach(drawStroke); ctx = savedCtx;
    return c.toDataURL("image/png");
  }
  function dataURLtoFile(dataURL, name) {
    var arr = dataURL.split(","), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8 = new Uint8Array(n);
    while (n--) u8[n] = bstr.charCodeAt(n);
    return new File([u8], name, { type: mime });
  }

  // ---------------- Save As ----------------
  function openSaveAs() {
    persist(); // keep resume data current
    var thumb = exportImage(360);
    var defTitle = (ctxInfo.lessonName || "Scratch work") + (ctxInfo.problemLabel ? " — " + ctxInfo.problemLabel : "");
    var m = App.modal(
      "<h2>Save As</h2>" +
      "<div class='field'><label>Title</label><input id='sa-title' value='" + defTitle.replace(/'/g, "&#39;") + "'></div>" +
      "<div class='sa-preview'><img src='" + thumb + "' alt='preview'></div>" +
      "<div class='field'><label>Share</label><div class='sa-share'>" +
      "<button class='btn ghost' id='sa-photos'>Photos</button>" +
      "<button class='btn ghost' id='sa-wa'>WhatsApp</button>" +
      "<button class='btn ghost' id='sa-gpt'>ChatGPT</button>" +
      "</div></div>" +
      "<div class='modal-actions'><button class='btn subtle' data-close>Cancel</button>" +
      "<button class='btn primary' id='sa-save'>Save to Notebook</button></div>"
    );
    m.querySelector("#sa-save").onclick = function () {
      var title = m.querySelector("#sa-title").value.trim() || defTitle;
      Store.addNotebookEntry({ lessonId: ctxInfo.lessonId, lessonName: ctxInfo.lessonName || "Scratch work", title: title, image: exportImage(900) });
      App.closeModal(); App.toast("Saved to Notebook");
    };
    m.querySelector("#sa-photos").onclick = function () { shareImage("photos"); };
    m.querySelector("#sa-wa").onclick = function () { shareImage("whatsapp"); };
    m.querySelector("#sa-gpt").onclick = function () { shareImage("chatgpt"); };
  }

  function shareImage(target) {
    var dataURL = exportImage(1100);
    var file = dataURLtoFile(dataURL, "studymaf-work.png");
    var title = (ctxInfo.lessonName || "StudyMAF") + " scratch work";
    // Native share sheet (iPad): includes WhatsApp, Save to Photos, etc.
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: title, text: title }).catch(function () {});
      if (target === "chatgpt") window.open("https://chatgpt.com/", "_blank", "noopener");
      return;
    }
    // Fallbacks when the file-share API isn't available
    if (target === "chatgpt") { downloadImage(dataURL); window.open("https://chatgpt.com/", "_blank", "noopener"); return; }
    if (target === "whatsapp") { downloadImage(dataURL); window.open("https://web.whatsapp.com/", "_blank", "noopener"); return; }
    downloadImage(dataURL); // Photos fallback = download the PNG
  }
  function downloadImage(dataURL) {
    var a = document.createElement("a"); a.href = dataURL; a.download = "studymaf-work.png"; document.body.appendChild(a); a.click(); a.remove();
  }

  // auto-save if the tab is hidden or closed while a page is open
  function persistIfOpen() { if (overlay && !overlay.hidden && ctxInfo) persist(); }
  window.addEventListener("pagehide", persistIfOpen);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") persistIfOpen(); });

  return { openScratch: openScratch, exportImage: exportImage };
})();
