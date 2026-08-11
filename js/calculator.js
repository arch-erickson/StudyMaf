/* StudyMAF — advanced calculator: a scientific calculator that expands into a
 * Desmos-style multi-equation graphing tool.
 *
 * - Scientific keypad with a "2nd" layer (inverse trig, hyperbolic, roots, logs…).
 * - "Graph" toggle expands the panel: add any number of equations of any
 *   complexity (polynomial, trig, exp, log, rational, abs…), each its own color.
 * - Pan (drag) and zoom (wheel / buttons) the plane.
 * - The scientific keypad inserts tokens into the focused equation row, so you
 *   build formulas with the same buttons.
 * - Minimize / maximize (enlarge for more room) / drag to float over the lesson.
 */
window.Calculator = (function () {
  "use strict";
  var dock, sciDisplay, sciPreview, sciExpr = "", sciCur = 0, second = false, graphOn = false, notepadOn = false, maximized = false;
  var mobileMode = false;
  var eqs = [], eqSeq = 0, activeInput = null, graphCanvas, view = null;
  var padCanvas, padCtx, padColor = "#2D3142", padTool = "pen", padImage = null;
  var EQ_COLORS = ["#EF8354", "#1971c2", "#0ca678", "#e64980", "#7048e8", "#f59f00", "#e03131", "#4F5D75"];

  function ic(n) { return window.Icons ? Icons.get(n) : ""; }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }

  // ---------- expression compiler (implicit mult + rich function set) ----------
  function compile(raw) {
    var e = String(raw).trim();
    if (!e) throw new Error("empty");
    // strip a leading "y =" / "f(x) ="
    e = e.replace(/^\s*[a-zA-Z]\w*\s*(\([^)]*\))?\s*=\s*/, "");
    // implicit multiplication: 2x -> 2*x, 3( -> 3*(, )( -> )*( , )x -> )*x
    e = e.replace(/(\d(?:\.\d+)?)\s*([a-zA-Z(])/g, "$1*$2").replace(/\)\s*([a-zA-Z0-9(])/g, ")*$1");
    // constants + functions
    e = e
      .replace(/\btau\b/gi, "(2*Math.PI)").replace(/\bpi\b/gi, "Math.PI").replace(/\be\b/g, "Math.E")
      .replace(/\basinh\b/g, "Math.asinh").replace(/\bacosh\b/g, "Math.acosh").replace(/\batanh\b/g, "Math.atanh")
      .replace(/\bsinh\b/g, "Math.sinh").replace(/\bcosh\b/g, "Math.cosh").replace(/\btanh\b/g, "Math.tanh")
      .replace(/\basin\b/g, "Math.asin").replace(/\bacos\b/g, "Math.acos").replace(/\batan\b/g, "Math.atan")
      .replace(/\bsin\b/g, "Math.sin").replace(/\bcos\b/g, "Math.cos").replace(/\btan\b/g, "Math.tan")
      .replace(/\bsqrt\b/g, "Math.sqrt").replace(/\bcbrt\b/g, "Math.cbrt").replace(/\bexp\b/g, "Math.exp")
      .replace(/\bln\b/g, "Math.log").replace(/\blog2\b/g, "Math.log2").replace(/\blog10\b/g, "Math.log10").replace(/\blog\b/g, "Math.log10")
      .replace(/\babs\b/g, "Math.abs").replace(/\bfloor\b/g, "Math.floor").replace(/\bceil\b/g, "Math.ceil")
      .replace(/\bround\b/g, "Math.round").replace(/\bsign\b/g, "Math.sign").replace(/\bmin\b/g, "Math.min").replace(/\bmax\b/g, "Math.max")
      .replace(/\^/g, "**");
    // whitelist check
    var stripped = e.replace(/Math\.[a-zA-Z0-9]+/g, "").replace(/\*\*/g, "").replace(/[-+*/%(). ,0-9x]/g, "");
    if (stripped.length) throw new Error("bad token: " + stripped);
    /* eslint-disable no-new-func */
    return new Function("x", "with(Math){return (" + e + ");}");
  }
  function round(n) { return Math.abs(n) < 1e-12 ? 0 : Math.round(n * 1e10) / 1e10; }

  // ================= build dock =================
  function build() {
    dock.innerHTML = "";
    dock.hidden = false; dock.setAttribute("aria-hidden", "false");
    dock.className = "calc-dock" + (graphOn ? " graph" : "") + (notepadOn ? " notepad" : "") + (maximized ? " max" : "") + (mobileMode ? " mobile" : "");

    var head = el("div", "calc-head");
    head.appendChild(el("span", "title", "Calculator"));
    var nTog = el("button", "head-btn np-toggle"); nTog.innerHTML = ic("edit"); nTog.title = "Toggle notepad";
    nTog.setAttribute("aria-pressed", String(notepadOn));
    var gTog = el("button", "head-btn graph-toggle"); gTog.innerHTML = ic("graph"); gTog.title = "Toggle graphing";
    gTog.setAttribute("aria-pressed", String(graphOn));
    var bMin = el("button", "head-btn"); bMin.innerHTML = ic("minus"); bMin.title = "Minimize";
    var bMax = el("button", "head-btn"); bMax.innerHTML = ic("maximize"); bMax.title = "Enlarge";
    var bClose = el("button", "head-btn"); bClose.innerHTML = ic("x"); bClose.title = "Close";
    head.append(nTog, gTog, bMin, bMax, bClose);
    dock.appendChild(head);

    var main = el("div", "calc-main");
    dock.appendChild(main);

    if (notepadOn) main.appendChild(buildNotepad());
    if (graphOn) main.appendChild(buildGraphPane());
    main.appendChild(buildSci());

    nTog.onclick = function () { if (notepadOn) padImage = snapshotPad(); notepadOn = !notepadOn; build(); };
    gTog.onclick = function () { if (notepadOn) padImage = snapshotPad(); graphOn = !graphOn; build(); };
    bMin.onclick = function () { dock.classList.toggle("min"); };
    bMax.onclick = toggleMax;
    bClose.onclick = close;

    if (!mobileMode) makeDraggable(dock, head);
    if (mobileMode) { dock.style.cssText = ""; dock.hidden = false; }
    else if (!maximized) positionDefault();
    if (graphOn) requestAnimationFrame(function () { if (!view) resetView(); redraw(); });
    if (notepadOn) requestAnimationFrame(setupPad);
  }

  // ---------- notepad (write while the calculator stays open) ----------
  function buildNotepad() {
    var pane = el("div", "calc-notepad");
    var bar = el("div", "np-bar");
    var penB = el("button", "np-btn" + (padTool === "pen" ? " on" : "")); penB.innerHTML = ic("pen"); penB.title = "Pen";
    var erB = el("button", "np-btn" + (padTool === "eraser" ? " on" : "")); erB.innerHTML = ic("eraser"); erB.title = "Eraser";
    var col = document.createElement("input"); col.type = "color"; col.value = padColor; col.className = "np-color"; col.title = "Ink color";
    var clr = el("button", "np-btn"); clr.innerHTML = ic("trash"); clr.title = "Clear";
    bar.append(penB, erB, col, clr);
    bar.appendChild(el("span", "np-label", "Notepad"));
    pane.appendChild(bar);
    var wrap = el("div", "np-canvas-wrap");
    padCanvas = document.createElement("canvas"); wrap.appendChild(padCanvas); pane.appendChild(wrap);

    penB.onclick = function () { padTool = "pen"; penB.classList.add("on"); erB.classList.remove("on"); };
    erB.onclick = function () { padTool = "eraser"; erB.classList.add("on"); penB.classList.remove("on"); };
    col.oninput = function () { padColor = col.value; padTool = "pen"; penB.classList.add("on"); erB.classList.remove("on"); };
    clr.onclick = function () { if (padCtx) padCtx.clearRect(0, 0, padCanvas.width, padCanvas.height); padImage = null; };
    return pane;
  }
  function snapshotPad() { try { return padCanvas ? padCanvas.toDataURL("image/png") : padImage; } catch (e) { return padImage; } }
  function setupPad() {
    if (!padCanvas) return;
    var wrap = padCanvas.parentElement, r = wrap.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    padCanvas.width = Math.max(240, r.width) * dpr; padCanvas.height = Math.max(200, r.height) * dpr;
    padCtx = padCanvas.getContext("2d"); padCtx.scale(dpr, dpr); padCtx.lineCap = "round"; padCtx.lineJoin = "round";
    if (padImage) { var img = new Image(); img.onload = function () { padCtx.drawImage(img, 0, 0, padCanvas.width / dpr, padCanvas.height / dpr); }; img.src = padImage; }
    var drawing = false, last = null;
    // iPad: swallow raw touch/gesture events so Safari doesn't cancel quick strokes.
    var stopPad = function (e) { e.preventDefault(); };
    ["touchstart", "touchmove", "touchend", "touchcancel", "gesturestart", "gesturechange", "gestureend"].forEach(function (ev) {
      padCanvas.addEventListener(ev, stopPad, { passive: false });
    });
    padCanvas.style.touchAction = "none"; padCanvas.style.webkitUserSelect = "none"; padCanvas.style.webkitTouchCallout = "none";
    function pos(e) { var b = padCanvas.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
    padCanvas.addEventListener("pointerdown", function (e) { drawing = true; last = pos(e); padCanvas.setPointerCapture(e.pointerId); e.preventDefault(); });
    padCanvas.addEventListener("pointermove", function (e) {
      if (!drawing) return; var p = pos(e);
      padCtx.globalCompositeOperation = padTool === "eraser" ? "destination-out" : "source-over";
      padCtx.strokeStyle = padColor; padCtx.lineWidth = padTool === "eraser" ? 16 : 2.4;
      padCtx.beginPath(); padCtx.moveTo(last.x, last.y); padCtx.lineTo(p.x, p.y); padCtx.stroke(); last = p; e.preventDefault();
    });
    window.addEventListener("pointerup", function () { if (drawing) { drawing = false; padImage = snapshotPad(); } });
  }

  // ---------- scientific side (live math preview + cursor editing) ----------
  function buildSci() {
    var wrap = el("div", "calc-sci");
    sciPreview = el("div", "calc-preview"); wrap.appendChild(sciPreview);
    sciDisplay = el("div", "calc-display"); wrap.appendChild(sciDisplay);

    var secRow = el("div", "calc-second-row");
    var secBtn = el("button", "calc-key mod" + (second ? " on" : ""), second ? "2nd ●" : "2nd");
    secBtn.onclick = function () { second = !second; build(); };
    var leftBtn = el("button", "calc-key op", "◀"); leftBtn.title = "Move left"; leftBtn.onclick = function () { moveCursor(-1); };
    var rightBtn = el("button", "calc-key op", "▶"); rightBtn.title = "Move right"; rightBtn.onclick = function () { moveCursor(1); };
    secRow.append(secBtn, leftBtn, rightBtn);
    if (graphOn) secRow.appendChild(el("span", "calc-mode-hint", "keys type into the focused equation"));
    wrap.appendChild(secRow);

    var grid = el("div", "calc-grid");
    keypad().forEach(function (k) {
      var b = el("button", "calc-key" + (k.cls ? " " + k.cls : ""), k.label);
      b.onclick = function () {
        if (k.tpl && graphOn && activeInput) { insertAtCursor(activeInput, k.tpl[0]); triggerEq(activeInput); return; }
        if (k.tpl) { insertTemplate(k.tpl[0], k.tpl[1]); return; }
        press(k.ins != null ? k.ins : k.label, k.act);
      };
      grid.appendChild(b);
    });
    wrap.appendChild(grid);
    renderSciDisplay();
    return wrap;
  }

  function keypad() {
    var trig = second
      ? [{ label: "sin⁻¹", ins: "asin(", cls: "fn" }, { label: "cos⁻¹", ins: "acos(", cls: "fn" }, { label: "tan⁻¹", ins: "atan(", cls: "fn" }]
      : [{ label: "sin", ins: "sin(", cls: "fn" }, { label: "cos", ins: "cos(", cls: "fn" }, { label: "tan", ins: "tan(", cls: "fn" }];
    var logs = second
      ? [{ label: "sinh", ins: "sinh(", cls: "fn" }, { label: "cosh", ins: "cosh(", cls: "fn" }, { label: "eˣ", ins: "exp(", cls: "fn" }]
      : [{ label: "ln", ins: "ln(", cls: "fn" }, { label: "log", ins: "log(", cls: "fn" }, { label: "log₂", ins: "log2(", cls: "fn" }];
    var special = second
      ? [{ label: "∛☐", tpl: ["cbrt()", 5], cls: "fn" }, { label: "☐ʸ", ins: "^", cls: "fn" }, { label: "|☐|", tpl: ["abs()", 4], cls: "fn" }]
      : [{ label: "√☐", tpl: ["sqrt()", 5], cls: "fn" }, { label: "☐²", ins: "^2", cls: "fn" }, { label: "a/b", tpl: ["()/()", 1], cls: "fn" }];
    return [].concat(
      [{ label: second ? "2nd ●" : "2nd", cls: "mod" + (second ? " on" : ""), act: "second" }], trig,
      [{ label: "(", cls: "fn" }, { label: ")", cls: "fn" }],
      logs, special,
      [{ label: "π", ins: "pi", cls: "fn" }, { label: "e", ins: "e", cls: "fn" }],
      [{ label: "7" }, { label: "8" }, { label: "9" }, { label: "÷", ins: "/", cls: "op" }, { label: "⌫", cls: "op", act: "del" }, { label: "C", cls: "op", act: "clear" }],
      [{ label: "4" }, { label: "5" }, { label: "6" }, { label: "×", ins: "*", cls: "op" }, { label: "%", ins: "%", cls: "op" }, { label: "x", ins: "x", cls: "var" }],
      [{ label: "1" }, { label: "2" }, { label: "3" }, { label: "−", ins: "-", cls: "op" }, { label: "!", ins: "!", cls: "op" }, { label: "=", cls: "eq", act: "equals" }],
      [{ label: "0", cls: "wide" }, { label: ".", }, { label: "+", ins: "+", cls: "op" }, { label: "Ans", cls: "op", act: "ans" }]
    );
  }

  var lastAns = "";
  function insertText(t) { sciExpr = sciExpr.slice(0, sciCur) + t + sciExpr.slice(sciCur); sciCur += t.length; }
  function insertTemplate(tpl, caretOffset) {
    if (sciExpr === "Error") { sciExpr = ""; sciCur = 0; }
    sciExpr = sciExpr.slice(0, sciCur) + tpl + sciExpr.slice(sciCur);
    sciCur += caretOffset; renderSciDisplay();
  }
  function moveCursor(d) { sciCur = Math.max(0, Math.min(sciExpr.length, sciCur + d)); renderSciDisplay(); }
  function press(token, act) {
    if (graphOn && activeInput && !act) { insertAtCursor(activeInput, token); triggerEq(activeInput); return; }
    if (act === "second") { second = !second; build(); return; }
    if (act === "clear") { sciExpr = ""; sciCur = 0; }
    else if (act === "del") { if (sciCur > 0) { sciExpr = sciExpr.slice(0, sciCur - 1) + sciExpr.slice(sciCur); sciCur--; } }
    else if (act === "ans") { insertText(lastAns); }
    else if (act === "equals") {
      try { var v = round(compile(sciExpr)(0)); lastAns = String(v); sciExpr = String(v); sciCur = sciExpr.length; }
      catch (e) { sciExpr = "Error"; sciCur = 0; }
    } else { if (sciExpr === "Error") { sciExpr = ""; sciCur = 0; } insertText(token); }
    renderSciDisplay();
  }

  function renderSciDisplay() {
    if (sciDisplay) {
      sciDisplay.innerHTML = "";
      if (!sciExpr) { sciDisplay.appendChild(el("span", "calc-caret")); sciDisplay.appendChild(document.createTextNode("")); }
      else {
        sciDisplay.appendChild(document.createTextNode(sciExpr.slice(0, sciCur)));
        sciDisplay.appendChild(el("span", "calc-caret"));
        sciDisplay.appendChild(document.createTextNode(sciExpr.slice(sciCur)));
      }
    }
    if (sciPreview) {
      if (!sciExpr) { sciPreview.textContent = ""; return; }
      if (sciExpr === "Error") { sciPreview.textContent = "Error"; sciPreview.style.color = "#e03131"; return; }
      sciPreview.style.color = "";
      try { window.katex.render(toLatex(sciExpr), sciPreview, { throwOnError: false, displayMode: false }); }
      catch (e) { sciPreview.textContent = sciExpr; }
    }
  }
  function insertAtCursor(input, token) {
    var s = input.selectionStart || input.value.length, en = input.selectionEnd || s;
    input.value = input.value.slice(0, s) + token + input.value.slice(en);
    var pos = s + token.length; input.setSelectionRange(pos, pos); input.focus();
  }

  // ---- expression -> LaTeX (best-effort live preview: fractions, powers, roots, functions) ----
  function matchRight(s, i) { // i points at '('; return index just past matching ')'
    var depth = 0; for (var j = i; j < s.length; j++) { if (s[j] === "(") depth++; else if (s[j] === ")") { depth--; if (!depth) return j + 1; } } return s.length;
  }
  function matchLeft(s, i) { // i points at ')'; return index of matching '('
    var depth = 0; for (var j = i; j >= 0; j--) { if (s[j] === ")") depth++; else if (s[j] === "(") { depth--; if (!depth) return j; } } return 0;
  }
  function rightAtom(s, i) { // atom starting at i+1
    var j = i + 1; if (s[j] === "(") return matchRight(s, j); while (j < s.length && /[\w.\\]/.test(s[j])) j++; return j;
  }
  function leftAtom(s, i) { // atom ending at i (exclusive)
    var j = i - 1; if (s[j] === ")") return matchLeft(s, j); while (j >= 0 && /[\w.\\]/.test(s[j])) j--; return j + 1;
  }
  function replaceFn(s, name, cb) {
    var idx, guard = 0;
    while ((idx = s.indexOf(name + "(")) !== -1 && guard++ < 40) {
      var open = idx + name.length, end = matchRight(s, open);
      s = s.slice(0, idx) + cb(s.slice(open + 1, end - 1)) + s.slice(end);
    }
    return s;
  }
  function fracLatex(s) {
    var guard = 0, i;
    while ((i = s.indexOf("/")) !== -1 && guard++ < 40) {
      var L = leftAtom(s, i), R = rightAtom(s, i);
      s = s.slice(0, L) + "\\frac{" + s.slice(L, i) + "}{" + s.slice(i + 1, R) + "}" + s.slice(R);
    }
    return s;
  }
  function powLatex(s) {
    var guard = 0, i;
    while ((i = s.indexOf("^")) !== -1 && guard++ < 40) {
      var R = rightAtom(s, i);
      s = s.slice(0, i) + "^{" + s.slice(i + 1, R) + "}" + s.slice(R);
    }
    return s;
  }
  function toLatex(s) {
    if (!s) return "";
    s = s.replace(/\basin\(/g, "arcsin(").replace(/\bacos\(/g, "arccos(").replace(/\batan\(/g, "arctan(");
    s = replaceFn(s, "sqrt", function (i) { return "\\sqrt{" + toLatex(i) + "}"; });
    s = replaceFn(s, "cbrt", function (i) { return "\\sqrt[3]{" + toLatex(i) + "}"; });
    s = replaceFn(s, "abs", function (i) { return "\\left|" + toLatex(i) + "\\right|"; });
    s = fracLatex(s); s = powLatex(s);
    s = s.replace(/\b(arcsin|arccos|arctan|sinh|cosh|tanh|sin|cos|tan|ln|log2|log10|log|exp)\b/g, function (m) {
      return m === "log2" ? "\\log_2" : m === "log10" ? "\\log_{10}" : "\\" + m;
    });
    s = s.replace(/\bpi\b/g, "\\pi").replace(/\*/g, "\\cdot ");
    return s;
  }

  // ---------- graphing pane ----------
  function buildGraphPane() {
    var pane = el("div", "calc-graphpane");

    var list = el("div", "eq-list"); pane.appendChild(list);
    if (!eqs.length) addEq("2x + 1");
    eqs.forEach(function (q) { list.appendChild(eqRow(q)); });
    var addBtn = el("button", "eq-add"); addBtn.innerHTML = ic("plus") + "<span>Add equation</span>";
    addBtn.onclick = function () { addEq(""); build(); };
    pane.appendChild(addBtn);

    var canvasWrap = el("div", "graph-canvas-wrap");
    graphCanvas = document.createElement("canvas");
    canvasWrap.appendChild(graphCanvas); pane.appendChild(canvasWrap);

    var bar = el("div", "graph-toolbar");
    var zi = el("button", "gt-btn"); zi.innerHTML = ic("zoomIn"); zi.title = "Zoom in";
    var zo = el("button", "gt-btn"); zo.innerHTML = ic("zoomOut"); zo.title = "Zoom out";
    var rs = el("button", "gt-btn"); rs.innerHTML = ic("refresh"); rs.title = "Reset view";
    zi.onclick = function () { zoom(0.8); }; zo.onclick = function () { zoom(1.25); }; rs.onclick = function () { resetView(); redraw(); };
    var readout = el("span", "graph-readout"); readout.id = "graph-readout";
    bar.append(zi, zo, rs, readout);
    pane.appendChild(bar);

    setupGraphInteractions(canvasWrap);
    return pane;
  }

  function addEq(expr) { eqs.push({ id: ++eqSeq, expr: expr, color: EQ_COLORS[eqs.length % EQ_COLORS.length], visible: true }); }
  function eqRow(q) {
    var row = el("div", "eq-row");
    var dot = el("button", "eq-dot"); dot.style.background = q.color; dot.title = q.visible ? "Hide" : "Show";
    dot.innerHTML = q.visible ? "" : ic("eyeOff");
    dot.onclick = function () { q.visible = !q.visible; dot.innerHTML = q.visible ? "" : ic("eyeOff"); redraw(); };
    var inp = document.createElement("input"); inp.type = "text"; inp.className = "eq-input";
    inp.value = q.expr; inp.placeholder = "y = …  (use x)"; inp.spellcheck = false;
    inp.addEventListener("focus", function () { activeInput = inp; });
    inp.addEventListener("input", function () { q.expr = inp.value; markValidity(inp, q.expr); redraw(); });
    inp._eq = q;
    var rm = el("button", "eq-rm"); rm.innerHTML = ic("trash"); rm.title = "Remove";
    rm.onclick = function () { eqs = eqs.filter(function (z) { return z.id !== q.id; }); if (activeInput === inp) activeInput = null; build(); };
    row.append(dot, inp, rm);
    markValidity(inp, q.expr);
    return row;
  }
  function markValidity(inp, expr) {
    if (!expr.trim()) { inp.classList.remove("bad"); return; }
    try { compile(expr); inp.classList.remove("bad"); } catch (e) { inp.classList.add("bad"); }
  }
  function triggerEq(inp) { if (inp._eq) { inp._eq.expr = inp.value; markValidity(inp, inp.value); redraw(); } }

  // ---------- view + drawing ----------
  function resetView() { view = { xmin: -10, xmax: 10, ymin: -10, ymax: 10 }; }
  function zoom(f) {
    if (!view) resetView();
    var cx = (view.xmin + view.xmax) / 2, cy = (view.ymin + view.ymax) / 2;
    var hw = (view.xmax - view.xmin) / 2 * f, hh = (view.ymax - view.ymin) / 2 * f;
    view = { xmin: cx - hw, xmax: cx + hw, ymin: cy - hh, ymax: cy + hh }; redraw();
  }
  function sizeCanvas() {
    var wrap = graphCanvas.parentElement, r = wrap.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = Math.max(240, r.width), hgt = Math.max(200, r.height || 260);
    graphCanvas.width = w * dpr; graphCanvas.height = hgt * dpr;
    graphCanvas.style.width = "100%";
    var ctx = graphCanvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: hgt };
  }
  function niceStep(range, target) {
    var raw = range / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
    var s = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10; return s * mag;
  }
  function redraw() {
    if (!graphOn || !graphCanvas) return; if (!view) resetView();
    var c = sizeCanvas(), ctx = c.ctx, W = c.w, H = c.h;
    function X(x) { return (x - view.xmin) / (view.xmax - view.xmin) * W; }
    function Y(y) { return H - (y - view.ymin) / (view.ymax - view.ymin) * H; }
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);

    var sx = niceStep(view.xmax - view.xmin, 10), sy = niceStep(view.ymax - view.ymin, 8);
    ctx.font = "11px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.strokeStyle = "#eef0f3"; ctx.fillStyle = "#9aa1ac"; ctx.lineWidth = 1;
    for (var gx = Math.ceil(view.xmin / sx) * sx; gx <= view.xmax; gx += sx) {
      ctx.beginPath(); ctx.moveTo(X(gx), 0); ctx.lineTo(X(gx), H); ctx.stroke();
      if (Math.abs(gx) > 1e-9) ctx.fillText(fmt(gx), X(gx), Math.min(H - 14, Math.max(2, Y(0) + 4)));
    }
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (var gy = Math.ceil(view.ymin / sy) * sy; gy <= view.ymax; gy += sy) {
      ctx.beginPath(); ctx.moveTo(0, Y(gy)); ctx.lineTo(W, Y(gy)); ctx.stroke();
      if (Math.abs(gy) > 1e-9) ctx.fillText(fmt(gy), Math.min(W - 4, Math.max(24, X(0) - 6)), Y(gy));
    }
    // axes
    ctx.strokeStyle = "#2D3142"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke();

    // curves
    eqs.forEach(function (q) {
      if (!q.visible || !q.expr.trim()) return;
      var f; try { f = compile(q.expr); } catch (e) { return; }
      ctx.strokeStyle = q.color; ctx.lineWidth = 2.2; ctx.beginPath();
      var started = false, prevY = null;
      for (var px = 0; px <= W; px++) {
        var xv = view.xmin + px / W * (view.xmax - view.xmin), yv;
        try { yv = f(xv); } catch (e2) { started = false; continue; }
        if (typeof yv !== "number" || !isFinite(yv)) { started = false; prevY = null; continue; }
        var sy2 = Y(yv);
        if (prevY !== null && Math.abs(sy2 - prevY) > H * 1.5) { started = false; } // asymptote break
        if (!started) { ctx.moveTo(px, sy2); started = true; } else ctx.lineTo(px, sy2);
        prevY = sy2;
      }
      ctx.stroke();
    });
  }
  function fmt(n) { n = round(n); return Math.abs(n) >= 1000 || (Math.abs(n) < 0.001 && n !== 0) ? n.toExponential(0) : String(n); }

  function setupGraphInteractions(wrap) {
    var dragging = false, lx = 0, ly = 0;
    wrap.addEventListener("pointerdown", function (e) { dragging = true; lx = e.clientX; ly = e.clientY; wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener("pointermove", function (e) {
      var r = graphCanvas.getBoundingClientRect();
      var ro = document.getElementById("graph-readout");
      if (ro) { var mx = view.xmin + (e.clientX - r.left) / r.width * (view.xmax - view.xmin); var my = view.ymin + (1 - (e.clientY - r.top) / r.height) * (view.ymax - view.ymin); ro.textContent = "(" + fmt(mx) + ", " + fmt(my) + ")"; }
      if (!dragging) return;
      var dx = (e.clientX - lx) / r.width * (view.xmax - view.xmin);
      var dy = (e.clientY - ly) / r.height * (view.ymax - view.ymin);
      view.xmin -= dx; view.xmax -= dx; view.ymin += dy; view.ymax += dy;
      lx = e.clientX; ly = e.clientY; redraw();
    });
    wrap.addEventListener("pointerup", function () { dragging = false; });
    wrap.addEventListener("wheel", function (e) { e.preventDefault(); zoom(e.deltaY > 0 ? 1.1 : 0.9); }, { passive: false });
  }

  // ---------- window controls ----------
  function positionDefault() {
    dock.style.left = "auto"; dock.style.top = "auto"; dock.style.transform = "none";
    dock.style.right = "24px"; dock.style.bottom = "24px"; dock.style.height = "";
    var w = 340 + (graphOn ? 420 : 0) + (notepadOn ? 340 : 0);
    dock.style.width = w + "px";  // capped by max-width:96vw in CSS
    maximized = false;
  }
  function toggleMax() {
    maximized = !maximized;
    if (maximized) {
      dock.classList.remove("min"); dock.classList.add("max");
      dock.style.left = "50%"; dock.style.top = "50%"; dock.style.right = "auto"; dock.style.bottom = "auto";
      dock.style.transform = "translate(-50%,-50%)";
    } else { dock.classList.remove("max"); dock.style.transform = "none"; positionDefault(); }
    if (graphOn) requestAnimationFrame(redraw);
    if (notepadOn) { padImage = snapshotPad(); requestAnimationFrame(setupPad); }
  }
  function makeDraggable(node, handle) {
    var d = false, ox = 0, oy = 0;
    handle.addEventListener("pointerdown", function (e) {
      if (maximized || e.target.closest(".head-btn")) return;
      d = true; var r = node.getBoundingClientRect();
      node.style.left = r.left + "px"; node.style.top = r.top + "px"; node.style.right = "auto"; node.style.bottom = "auto"; node.style.transform = "none";
      ox = e.clientX - r.left; oy = e.clientY - r.top; handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", function (e) {
      if (!d) return;
      node.style.left = Math.max(0, Math.min(window.innerWidth - 120, e.clientX - ox)) + "px";
      node.style.top = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - oy)) + "px";
    });
    handle.addEventListener("pointerup", function () { d = false; });
  }

  function open(mode) {
    dock = document.getElementById("calc-dock");
    if (mode === "graph") graphOn = true;
    if (mode === "notepad") notepadOn = true;
    if (dock.hidden) build();
    else { dock.classList.remove("min"); if (mode) build(); }
  }
  // Full-screen mobile calculator (dashboard feature): big keys, thumb-friendly.
  function openMobile() {
    dock = document.getElementById("calc-dock");
    mobileMode = true; graphOn = false; notepadOn = false; maximized = false;
    build();
  }
  function close() { dock.hidden = true; dock.setAttribute("aria-hidden", "true"); mobileMode = false; dock.className = "calc-dock"; }

  return { open: open, openMobile: openMobile, close: close };
})();
