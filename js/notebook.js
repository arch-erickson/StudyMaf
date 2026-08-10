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
  var strokes = [], redoStack = [], cur = null;
  var tool = "pen", color = "#2D3142", size = 3, zoom = 1;
  var ctxInfo = null, needsRender = false, rafPending = false;

  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function ic(n) { return window.Icons ? Icons.get(n) : ""; }

  // ---------------- open ----------------
  function openScratch(info) {
    ctxInfo = info || {};
    tool = "pen"; zoom = 1; redoStack = [];
    strokes = loadStrokes();
    overlay = document.getElementById("draw-overlay");
    overlay.innerHTML = ""; overlay.hidden = false; overlay.setAttribute("aria-hidden", "false");
    overlay.className = "nb-overlay";

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
      ["pen", "pen", "Pen"], ["highlighter", "edit", "Highlighter"], ["eraser", "eraser", "Eraser"]
    ];
    var toolBtns = {};
    tools.forEach(function (t) {
      var b = el("button", "nb-tbtn" + (tool === t[0] ? " on" : "")); b.innerHTML = ic(t[1]); b.title = t[2];
      b.onclick = function () { setTool(t[0], toolBtns); }; toolBtns[t[0]] = b; bar.appendChild(b);
    });
    var col = document.createElement("input"); col.type = "color"; col.value = color; col.className = "nb-color"; col.title = "Color";
    col.oninput = function () { color = col.value; if (tool === "eraser") setTool("pen", toolBtns); };
    bar.appendChild(col);
    var range = document.createElement("input"); range.type = "range"; range.min = "1"; range.max = "14"; range.value = String(size);
    range.className = "nb-size"; range.title = "Thickness"; range.oninput = function () { size = +range.value; };
    bar.appendChild(range);
    var undoB = el("button", "nb-tbtn"); undoB.innerHTML = ic("undo"); undoB.title = "Undo"; undoB.onclick = undo;
    var redoB = el("button", "nb-tbtn"); redoB.innerHTML = ic("undo"); redoB.title = "Redo";
    redoB.querySelector("svg").style.transform = "scaleX(-1)"; redoB.onclick = redo;
    bar.append(undoB, redoB);
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
    var lab = document.getElementById("nb-zoom"); if (lab) lab.textContent = Math.round(zoom * 100) + "%";
  }
  function scheduleRender() { needsRender = true; if (!rafPending) { rafPending = true; requestAnimationFrame(function () { rafPending = false; if (needsRender) { needsRender = false; render(); } }); } }
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, PAGE_W, PAGE_H);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    // faint ruled lines for a notebook feel
    ctx.strokeStyle = "#eef1f5"; ctx.lineWidth = 1;
    for (var y = 60; y < PAGE_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PAGE_W, y); ctx.stroke(); }
    strokes.forEach(drawStroke);
    if (cur) drawStroke(cur);
  }
  function drawStroke(s) {
    var pts = s.points; if (!pts.length) return;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.globalCompositeOperation = s.tool === "eraser" ? "destination-out" : "source-over";
    ctx.globalAlpha = s.tool === "highlighter" ? 0.32 : 1;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.tool === "highlighter" ? s.size * 5 : (s.tool === "eraser" ? s.size * 6 : s.size);
    ctx.beginPath();
    if (pts.length < 3) { ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y); }
    else {
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my); // smooth through midpoints
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }

  // ---------------- input (pointer, coalesced for smoothness) ----------------
  function toPage(e) { var r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom }; }
  function setupInput() {
    var drawing = false;
    canvas.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch" && e.isPrimary === false) return;
      drawing = true; redoStack = [];
      cur = { tool: tool, color: color, size: size, points: [toPage(e)] };
      canvas.setPointerCapture(e.pointerId); e.preventDefault();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drawing || !cur) return;
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      if (!evs.length) evs = [e];
      evs.forEach(function (ev) { cur.points.push(toPage(ev)); });
      scheduleRender(); e.preventDefault();
    }, { passive: false });
    function end() { if (drawing && cur) { if (cur.points.length) strokes.push(cur); cur = null; scheduleRender(); } drawing = false; }
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("pointerleave", function (e) { /* keep drawing while captured */ });
  }
  function undo() { if (!strokes.length) return; redoStack.push(strokes.pop()); scheduleRender(); }
  function redo() { if (!redoStack.length) return; strokes.push(redoStack.pop()); scheduleRender(); }

  // ---------------- persistence ----------------
  function loadStrokes() {
    try { var j = Store.getScratch(ctxInfo.classId, ctxInfo.lessonId, ctxInfo.problemId); return j ? JSON.parse(j) : []; }
    catch (e) { return []; }
  }
  function persist() {
    try { Store.saveScratch(ctxInfo.classId, ctxInfo.lessonId, ctxInfo.problemId, strokes.length ? JSON.stringify(strokes) : null); } catch (e) {}
  }
  function autoSaveAndClose() { persist(); close(); }
  function close() { if (overlay) { overlay.hidden = true; overlay.setAttribute("aria-hidden", "true"); overlay.innerHTML = ""; } }

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
