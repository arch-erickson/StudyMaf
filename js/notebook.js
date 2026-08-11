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
  var overlay, canvas, ctx, dpr = 1;
  var strokes = [], history = [], future = [], cur = null;
  var tool = "brush", color = "#2D3142", size = 3, opacity = 1, zoom = 1, layout = "full";
  var curvePts = [], curveDoneBtn = null;  // Illustrator-style curvature tool: click to add anchor points
  var grid = { type: "ruled", size: 40, color: "#c3ccd9", opacity: 0.7 };
  var ctxInfo = null;

  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function ic(n) { return window.Icons ? Icons.get(n) : ""; }

  // ---------------- open ----------------
  function openScratch(info) {
    ctxInfo = info || {};
    tool = "brush"; zoom = 1; history = []; future = [];
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
      ["brush", "brush", "Brush — write freely"], ["pen", "pen", "Pen — tap points for straight lines"],
      ["curve", "curve", "Curvature — tap points for a smooth curve"], ["highlighter", "edit", "Highlighter"],
      ["eraser", "eraser", "Eraser"]
    ];
    var toolBtns = {};
    tools.forEach(function (t) {
      var b = el("button", "nb-tbtn" + (tool === t[0] ? " on" : "")); b.innerHTML = ic(t[1]); b.title = t[2];
      b.onclick = function () { finishCurve(); setTool(t[0], toolBtns); }; toolBtns[t[0]] = b; bar.appendChild(b);
    });
    var col = document.createElement("input"); col.type = "color"; col.value = color; col.className = "nb-color"; col.title = "Color";
    col.oninput = function () { color = col.value; if (tool === "eraser") setTool("pen", toolBtns); };
    bar.appendChild(col);
    var range = document.createElement("input"); range.type = "range"; range.min = "1"; range.max = "20"; range.value = String(size);
    range.className = "nb-size"; range.title = "Stroke width"; range.oninput = function () { size = +range.value; };
    bar.appendChild(range);
    var opWrap = el("span", "nb-op"); opWrap.title = "Opacity"; opWrap.innerHTML = ic("droplet");
    var opRange = document.createElement("input"); opRange.type = "range"; opRange.min = "10"; opRange.max = "100"; opRange.value = String(Math.round(opacity * 100));
    opRange.className = "nb-size"; opRange.oninput = function () { opacity = +opRange.value / 100; };
    opWrap.appendChild(opRange); bar.appendChild(opWrap);
    var doneCurveB = el("button", "nb-tbtn nb-curve-done"); doneCurveB.innerHTML = ic("check2"); doneCurveB.title = "Finish curve"; doneCurveB.style.display = "none";
    doneCurveB.onclick = finishCurve; bar.appendChild(doneCurveB);
    curveDoneBtn = doneCurveB;
    var undoB = el("button", "nb-tbtn"); undoB.innerHTML = ic("undo"); undoB.title = "Undo"; undoB.onclick = undo;
    var redoB = el("button", "nb-tbtn"); redoB.innerHTML = ic("undo"); redoB.title = "Redo";
    redoB.querySelector("svg").style.transform = "scaleX(-1)"; redoB.onclick = redo;
    var clearB = el("button", "nb-tbtn"); clearB.innerHTML = ic("trash"); clearB.title = "Delete all"; clearB.onclick = deleteAll;
    bar.append(undoB, redoB, clearB);
    var gridB = el("button", "nb-tbtn"); gridB.innerHTML = ic("grid"); gridB.title = "Grid & guides"; gridB.onclick = function (e) { toggleGridPanel(gridB); e.stopPropagation(); };
    bar.appendChild(gridB);
    if (ctxInfo.hasSession) {
      var splitB = el("button", "nb-tbtn" + (layout === "right" ? " on" : "")); splitB.innerHTML = ic("columns");
      splitB.title = "Side-by-side with the problem";
      splitB.onclick = function () { setLayout(layout === "right" ? "full" : "right"); splitB.classList.toggle("on", layout === "right"); };
      bar.appendChild(splitB);
    }
    var zoomOut = el("button", "nb-tbtn"); zoomOut.innerHTML = ic("zoomOut"); zoomOut.title = "Zoom out"; zoomOut.onclick = function () { setZoom(zoom / 1.25); };
    var zoomIn = el("button", "nb-tbtn"); zoomIn.innerHTML = ic("zoomIn"); zoomIn.title = "Zoom in"; zoomIn.onclick = function () { setZoom(zoom * 1.25); };
    var zLabel = el("span", "nb-zoom"); zLabel.id = "nb-zoom";
    bar.append(zoomOut, zoomIn, zLabel);
    shell.appendChild(bar);

    // scroll + canvas
    var scroller = el("div", "nb-scroller");
    canvas = document.createElement("canvas"); canvas.className = "nb-canvas";
    scroller.appendChild(canvas); shell.appendChild(scroller);
    overlay.appendChild(shell);

    calcBtn.onclick = function () { Calculator.open(); };
    saveBtn.onclick = openSaveAs;
    closeBtn.onclick = function () { autoSaveAndClose(); };

    setupCanvas();
    setZoom(1);
    setupInput();
  }

  function setTool(t, btns) {
    tool = t;
    Object.keys(btns).forEach(function (k) { btns[k].classList.toggle("on", k === t); });
  }

  // ---------------- canvas + render ----------------
  function setupCanvas() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = PAGE_W * dpr; canvas.height = PAGE_H * dpr;
    ctx = canvas.getContext("2d");
    render();
  }
  function setZoom(z) {
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
    canvas.style.width = (PAGE_W * zoom) + "px";
    canvas.style.height = (PAGE_H * zoom) + "px";
    curRect = null; // canvas resized, cached rect is stale
    var lab = document.getElementById("nb-zoom"); if (lab) lab.textContent = Math.round(zoom * 100) + "%";
  }
  // full re-render (used on setup, zoom, undo/redo) — not on every move
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, PAGE_W, PAGE_H);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    drawGrid();
    strokes.forEach(drawStroke);
    drawCurvePreview();
  }
  // live preview of the curvature tool's anchor points + smooth curve
  function drawCurvePreview() {
    if (!curvePts.length) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (curvePts.length >= 2) {
      ctx.globalAlpha = opacity; ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.lineJoin = "round";
      var d = tool === "pen" ? curvePts : catmullRom(curvePts); ctx.beginPath(); ctx.moveTo(d[0].x, d[0].y);
      for (var i = 1; i < d.length; i++) ctx.lineTo(d[i].x, d[i].y);
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "#EF8354";
    curvePts.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); });
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
  function finishCurve() {
    if (curveDoneBtn) curveDoneBtn.style.display = "none";
    if (curvePts.length >= 2) {
      pushHistory();
      if (tool === "pen") strokes.push({ tool: "pen", straight: true, color: color, size: size, opacity: opacity, points: curvePts.slice() });
      else strokes.push({ tool: "pen", color: color, size: size, opacity: opacity, points: catmullRom(curvePts) });
    }
    curvePts = []; render();
  }
  function drawGrid() {
    if (!grid || grid.type === "none") return;
    var s = Math.max(8, grid.size || 40);
    ctx.globalAlpha = grid.opacity != null ? grid.opacity : 0.7;
    ctx.strokeStyle = grid.color || "#c3ccd9"; ctx.fillStyle = grid.color || "#c3ccd9"; ctx.lineWidth = 1;
    var x, y;
    if (grid.type === "ruled") {
      for (y = s; y < PAGE_H; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PAGE_W, y); ctx.stroke(); }
    } else if (grid.type === "grid") {
      for (y = s; y < PAGE_H; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PAGE_W, y); ctx.stroke(); }
      for (x = s; x < PAGE_W; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, PAGE_H); ctx.stroke(); }
    } else if (grid.type === "dots") {
      for (y = s; y < PAGE_H; y += s) for (x = s; x < PAGE_W; x += s) { ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  function styleFor(s) {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.globalCompositeOperation = s.tool === "eraser" ? "destination-out" : "source-over";
    ctx.globalAlpha = (s.tool === "highlighter" ? 0.3 : 1) * (s.opacity != null ? s.opacity : 1);
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.tool === "highlighter" ? s.size * 5 : (s.tool === "eraser" ? s.size * 6 : s.size);
  }
  function brushWidth(s, p) { return s.size * (0.35 + 1.3 * (p != null ? p : 0.5)); }
  function drawStroke(s) {
    var pts = s.points; if (!pts.length) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); styleFor(s);
    if (s.straight) { // pen tool: straight segments between anchor points
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.stroke(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; return;
    }
    if (s.tool === "brush") { // variable width by pen pressure — draw pair by pair
      for (var b = 1; b < pts.length; b++) {
        ctx.lineWidth = brushWidth(s, (pts[b - 1].p + pts[b].p) / 2);
        ctx.beginPath(); ctx.moveTo(pts[b - 1].x, pts[b - 1].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; return;
    }
    ctx.beginPath();
    if (pts.length < 3) { ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y); }
    else {
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length - 1; i++) { ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2); }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    }
    ctx.stroke(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  // incremental: draw only the newest smoothed segment (keeps ink continuous & fast)
  function drawLiveSegment(s) {
    var pts = s.points, n = pts.length; if (n < 2) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); styleFor(s);
    if (s.tool === "brush") {
      ctx.lineWidth = brushWidth(s, (pts[n - 2].p + pts[n - 1].p) / 2);
      ctx.beginPath(); ctx.moveTo(pts[n - 2].x, pts[n - 2].y); ctx.lineTo(pts[n - 1].x, pts[n - 1].y); ctx.stroke();
      ctx.globalAlpha = 1; return;
    }
    ctx.beginPath();
    if (n === 2) { ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); }
    else { var p0 = pts[n - 3], p1 = pts[n - 2], p2 = pts[n - 1];
      ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
      ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2); }
    ctx.stroke(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }

  // ---------------- input: pen/mouse draws, 1 finger pans, 2 fingers pinch-zoom ----------------
  // Cache the canvas rect during a stroke. Calling getBoundingClientRect() on every
  // pointer/coalesced event forces a layout reflow that janks fast writing on iPad.
  var curRect = null;
  function invalidateRect() { curRect = null; }
  function toPage(cx, cy) { var r = curRect || (curRect = canvas.getBoundingClientRect()); return { x: (cx - r.left) / zoom, y: (cy - r.top) / zoom }; }
  function setupInput() {
    var pointers = {}, drawingId = null, gesture = null, erasing = false;
    var scroller = canvas.parentElement;
    // any movement of the canvas invalidates the cached rect
    scroller.addEventListener("scroll", invalidateRect, { passive: true });
    window.addEventListener("resize", invalidateRect);
    function touches() { return Object.keys(pointers).filter(function (id) { return pointers[id].type === "touch"; }).map(function (id) { return pointers[id]; }); }

    var lastTap = 0, lastTapXY = null;
    canvas.addEventListener("pointerdown", function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY, type: e.pointerType };
      if (e.pointerType === "pen" || e.pointerType === "mouse") {
        curRect = canvas.getBoundingClientRect(); // fresh rect once per stroke
        if (tool === "curve" || tool === "pen") { // tap to place anchor points (vector tools)
          var cp = toPage(e.clientX, e.clientY), now = Date.now();
          if (lastTapXY && now - lastTap < 400 && Math.hypot(cp.x - lastTapXY.x, cp.y - lastTapXY.y) < 16) { finishCurve(); lastTapXY = null; e.preventDefault(); return; }
          curvePts.push(cp); lastTap = now; lastTapXY = cp;
          if (curveDoneBtn) curveDoneBtn.style.display = curvePts.length ? "" : "none";
          render(); e.preventDefault(); return;
        }
        drawingId = e.pointerId; pushHistory();
        if (tool === "eraser") { erasing = true; eraseAt(toPage(e.clientX, e.clientY)); }
        else { var p0 = toPage(e.clientX, e.clientY); if (tool === "brush") p0.p = e.pressure || 0.5; cur = { tool: tool, color: color, size: size, opacity: opacity, points: [p0] }; }
        try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
        e.preventDefault();
      } else { gesture = null; }
    });

    canvas.addEventListener("pointermove", function (e) {
      var pt = pointers[e.pointerId]; if (!pt) return;
      pt.x = e.clientX; pt.y = e.clientY;
      if (e.pointerId === drawingId) {
        var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; if (!evs.length) evs = [e];
        if (erasing) { evs.forEach(function (ev) { eraseAt(toPage(ev.clientX, ev.clientY)); }); }
        else if (cur) { evs.forEach(function (ev) { var p = toPage(ev.clientX, ev.clientY); if (cur.tool === "brush") p.p = ev.pressure || 0.5; cur.points.push(p); drawLiveSegment(cur); }); }
        e.preventDefault(); return;
      }
      var ts = touches();
      if (ts.length >= 2) {
        var a = ts[0], b = ts[1], dist = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        if (gesture && gesture.dist) {
          setZoom(zoom * (dist / gesture.dist));
          scroller.scrollLeft -= (cx - gesture.cx); scroller.scrollTop -= (cy - gesture.cy);
        }
        gesture = { dist: dist, cx: cx, cy: cy }; e.preventDefault();
      } else if (ts.length === 1) {
        var p = ts[0];
        if (gesture && gesture.single) { scroller.scrollLeft -= (p.x - gesture.sx); scroller.scrollTop -= (p.y - gesture.sy); }
        gesture = { single: true, sx: p.x, sy: p.y }; e.preventDefault();
      }
    }, { passive: false });

    function end(e) {
      if (e.pointerId === drawingId) {
        if (!erasing && cur && cur.points.length) strokes.push(cur);
        else if (erasing || (cur && !cur.points.length)) { history.pop(); } // no-op erase/stroke: drop snapshot
        cur = null; drawingId = null; erasing = false;
      }
      delete pointers[e.pointerId];
      if (touches().length < 2) gesture = null;
    }
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
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
