/* StudyMAF — floating calculator: scientific + graphing.
 * Toggle either or both tabs; the dock can be minimized, maximized, and dragged
 * (floats over the lesson). No external libs.
 *
 * Expression evaluation: input is restricted to a math whitelist, then compiled.
 * This is the user's own local tool (no untrusted input); the whitelist blocks
 * anything that isn't math.
 */
window.Calculator = (function () {
  "use strict";
  var dock, display, graphCanvas, graphInput, current = "", activeTab = "sci", maximized = false;

  // ---- safe-ish math compile ----
  function compile(expr) {
    var e = String(expr)
      .replace(/\bpi\b/gi, "Math.PI").replace(/\be\b/g, "Math.E")
      .replace(/\bsin\b/g, "Math.sin").replace(/\bcos\b/g, "Math.cos").replace(/\btan\b/g, "Math.tan")
      .replace(/\basin\b/g, "Math.asin").replace(/\bacos\b/g, "Math.acos").replace(/\batan\b/g, "Math.atan")
      .replace(/\bsqrt\b/g, "Math.sqrt").replace(/\bln\b/g, "Math.log").replace(/\blog\b/g, "Math.log10")
      .replace(/\babs\b/g, "Math.abs").replace(/\^/g, "**");
    // whitelist: digits, operators, parens, dot, x, comma, Math.<fn>, whitespace
    if (/Math\.[a-zA-Z0-9]+|[-+*/(). ,0-9x]/.test(e) === false) throw new Error("empty");
    var stripped = e.replace(/Math\.[a-zA-Z0-9]+/g, "").replace(/[-+*/(). ,0-9x]|\*\*/g, "");
    if (stripped.length) throw new Error("bad chars");
    /* eslint-disable no-new-func */
    return new Function("x", "return (" + e + ");");
  }
  function evalNumber(expr) { return compile(expr)(0); }

  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }

  function build() {
    dock.innerHTML = "";
    dock.hidden = false; dock.setAttribute("aria-hidden", "false");

    var head = el("div", "calc-head");
    head.appendChild(el("span", "title", "Calculator"));
    var bMin = el("button", null, "—"); bMin.title = "Minimize";
    var bMax = el("button", null, "▢"); bMax.title = "Maximize";
    var bClose = el("button", null, "✕"); bClose.title = "Close";
    head.appendChild(bMin); head.appendChild(bMax); head.appendChild(bClose);
    dock.appendChild(head);

    var tabs = el("div", "calc-tabs");
    var tSci = el("button", null, "Scientific"); var tGraph = el("button", null, "Graphing");
    tabs.appendChild(tSci); tabs.appendChild(tGraph); dock.appendChild(tabs);

    var body = el("div", "calc-body"); dock.appendChild(body);

    function renderTab() {
      tSci.setAttribute("aria-selected", activeTab === "sci");
      tGraph.setAttribute("aria-selected", activeTab === "graph");
      body.innerHTML = "";
      if (activeTab === "sci") renderSci(body); else renderGraph(body);
    }
    tSci.onclick = function () { activeTab = "sci"; renderTab(); };
    tGraph.onclick = function () { activeTab = "graph"; renderTab(); };

    bMin.onclick = function () { dock.classList.toggle("min"); };
    bMax.onclick = function () { toggleMax(); };
    bClose.onclick = function () { close(); };

    makeDraggable(dock, head);
    renderTab();
    positionDefault();
  }

  function renderSci(body) {
    display = el("div", "calc-display", current || "0");
    body.appendChild(display);
    var grid = el("div", "calc-grid");
    var keys = [
      ["sin", "fn"], ["cos", "fn"], ["tan", "fn"], ["(", "fn"], [")", "fn"],
      ["ln", "fn"], ["log", "fn"], ["sqrt", "fn"], ["^", "op"], ["C", "op"],
      ["7"], ["8"], ["9"], ["/", "op"], ["⌫", "op"],
      ["4"], ["5"], ["6"], ["*", "op"],  ["pi", "fn"],
      ["1"], ["2"], ["3"], ["-", "op"],  ["e", "fn"],
      ["0"], ["."], ["+", "op", "wide"], ["=", "eq"]
    ];
    keys.forEach(function (k) {
      var b = el("button", k[1] || "", k[0]);
      if (k[2]) b.classList.add(k[2]);
      b.onclick = function () { press(k[0]); };
      grid.appendChild(b);
    });
    body.appendChild(grid);
  }

  function press(k) {
    if (k === "C") { current = ""; }
    else if (k === "⌫") { current = current.slice(0, -1); }
    else if (k === "=") {
      try { current = String(round(evalNumber(current))); }
      catch (e) { current = "Error"; }
    } else {
      if (current === "Error") current = "";
      var fns = ["sin", "cos", "tan", "ln", "log", "sqrt"];
      current += (fns.indexOf(k) >= 0) ? (k + "(") : k;
    }
    if (display) display.textContent = current || "0";
  }
  function round(n) { return Math.round(n * 1e10) / 1e10; }

  function renderGraph(body) {
    var controls = el("div", "graph-controls");
    graphInput = el("input"); graphInput.type = "text"; graphInput.placeholder = "y = e.g.  2*x + 1  or  x^2 - 3";
    graphInput.value = graphInput.value || "2*x + 1";
    var plot = el("button", "btn primary", "Plot"); plot.style.padding = "8px 14px";
    controls.appendChild(graphInput); controls.appendChild(plot); body.appendChild(controls);

    var wrap = el("div", "graph-canvas-wrap");
    graphCanvas = document.createElement("canvas");
    var w = 336, h = 260, dpr = window.devicePixelRatio || 1;
    graphCanvas.width = w * dpr; graphCanvas.height = h * dpr;
    graphCanvas.style.width = "100%"; graphCanvas.style.aspectRatio = w + " / " + h;
    graphCanvas.getContext("2d").scale(dpr, dpr);
    wrap.appendChild(graphCanvas); body.appendChild(wrap);
    body.appendChild(el("p", "graph-hint", "Use x as the variable. Functions: sin, cos, tan, ln, log, sqrt, ^, pi, e."));

    plot.onclick = function () { drawGraph(graphInput.value); };
    graphInput.addEventListener("keydown", function (ev) { if (ev.key === "Enter") drawGraph(graphInput.value); });
    drawGraph(graphInput.value);
  }

  function drawGraph(expr) {
    var ctx = graphCanvas.getContext("2d");
    var W = 336, H = 260, pad = 6;
    var xR = [-10, 10], yR = [-10, 10];
    function X(x) { return pad + (x - xR[0]) / (xR[1] - xR[0]) * (W - pad * 2); }
    function Y(y) { return pad + (yR[1] - y) / (yR[1] - yR[0]) * (H - pad * 2); }
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#eef0f3"; ctx.lineWidth = 1;
    for (var g = -10; g <= 10; g++) {
      ctx.beginPath(); ctx.moveTo(X(g), pad); ctx.lineTo(X(g), H - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, Y(g)); ctx.lineTo(W - pad, Y(g)); ctx.stroke();
    }
    ctx.strokeStyle = "#2D3142"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(pad, Y(0)); ctx.lineTo(W - pad, Y(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(0), pad); ctx.lineTo(X(0), H - pad); ctx.stroke();

    var f; try { f = compile(expr); } catch (e) {
      ctx.fillStyle = "#e8590c"; ctx.font = "12px Inter"; ctx.textAlign = "center";
      ctx.fillText("Can't plot that expression", W / 2, H / 2); return;
    }
    var accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#EF8354";
    ctx.strokeStyle = accent; ctx.lineWidth = 2.4; ctx.beginPath();
    var started = false;
    for (var px = 0; px <= W; px++) {
      var xv = xR[0] + (px / W) * (xR[1] - xR[0]); var yv;
      try { yv = f(xv); } catch (e2) { started = false; continue; }
      if (!isFinite(yv)) { started = false; continue; }
      var sy = Y(yv);
      if (sy < -50 || sy > H + 50) { started = false; continue; }
      if (!started) { ctx.moveTo(X(xv), sy); started = true; } else { ctx.lineTo(X(xv), sy); }
    }
    ctx.stroke();
  }

  function positionDefault() {
    dock.style.right = "24px"; dock.style.bottom = "24px";
    dock.style.left = "auto"; dock.style.top = "auto";
    dock.style.width = "360px"; dock.style.height = "auto"; maximized = false;
  }
  function toggleMax() {
    maximized = !maximized;
    if (maximized) {
      dock.classList.remove("min");
      dock.style.left = "50%"; dock.style.top = "50%"; dock.style.right = "auto"; dock.style.bottom = "auto";
      dock.style.transform = "translate(-50%,-50%)"; dock.style.width = "min(560px, 94vw)";
    } else { dock.style.transform = "none"; positionDefault(); }
  }

  function makeDraggable(node, handle) {
    var ox = 0, oy = 0, dragging = false;
    handle.addEventListener("pointerdown", function (e) {
      if (maximized) return;
      dragging = true; var r = node.getBoundingClientRect();
      node.style.left = r.left + "px"; node.style.top = r.top + "px";
      node.style.right = "auto"; node.style.bottom = "auto"; node.style.transform = "none";
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      node.style.left = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - ox)) + "px";
      node.style.top = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - oy)) + "px";
    });
    handle.addEventListener("pointerup", function () { dragging = false; });
  }

  function open(tab) {
    dock = document.getElementById("calc-dock");
    if (tab) activeTab = tab;
    if (dock.hidden) build(); else { dock.classList.remove("min"); }
  }
  function close() { dock.hidden = true; dock.setAttribute("aria-hidden", "true"); }

  return { open: open, close: close };
})();
