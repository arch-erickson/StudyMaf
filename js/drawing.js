/* StudyMAF — drawing board. Work out a problem by hand (iPad-first, works on
 * desktop with mouse). Save the work to the problem, or "send to tutor" (stubbed).
 * Pointer events cover touch + pen + mouse.
 */
window.Drawing = (function () {
  "use strict";
  var overlay, canvas, ctx, ctxScale = 1;
  var tool = "pen", color = "#2D3142", size = 3, drawing = false, last = null;
  var undoStack = [], ctxRef = null;

  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }

  function open(context) {
    ctxRef = context || {};
    overlay = document.getElementById("draw-overlay");
    overlay.innerHTML = ""; overlay.hidden = false; overlay.setAttribute("aria-hidden", "false");

    var modal = el("div", "draw-modal");
    // head
    var head = el("div", "draw-head");
    head.appendChild(el("span", "title", "Scratch work" + (ctxRef.title ? " — " + ctxRef.title : "")));
    var tools = el("div", "draw-tools");
    var ic = function (n) { return window.Icons ? Icons.get(n) : ""; };
    var penBtn = el("button"); penBtn.innerHTML = ic("pen"); penBtn.title = "Pen"; penBtn.setAttribute("aria-pressed", "true");
    var eraBtn = el("button"); eraBtn.innerHTML = ic("eraser"); eraBtn.title = "Eraser"; eraBtn.setAttribute("aria-pressed", "false");
    var colorInp = el("input", "pen-color"); colorInp.type = "color"; colorInp.value = color; colorInp.title = "Pen color";
    var sizeInp = el("input"); sizeInp.type = "range"; sizeInp.min = "1"; sizeInp.max = "16"; sizeInp.value = String(size); sizeInp.title = "Size"; sizeInp.style.width = "90px";
    var undoBtn = el("button"); undoBtn.innerHTML = ic("undo"); undoBtn.title = "Undo";
    var clearBtn = el("button"); clearBtn.innerHTML = ic("trash"); clearBtn.title = "Clear";
    tools.append(penBtn, eraBtn, colorInp, sizeInp, undoBtn, clearBtn);
    head.appendChild(tools); modal.appendChild(head);

    // canvas
    var wrap = el("div", "draw-canvas-wrap");
    canvas = document.createElement("canvas"); canvas.id = "draw-canvas";
    wrap.appendChild(canvas); modal.appendChild(wrap);

    // foot
    var foot = el("div", "draw-foot");
    var closeBtn = el("button", "btn subtle", "Close");
    var sendBtn = el("button", "btn ghost"); sendBtn.innerHTML = ic("send") + "<span>Send to tutor</span>";
    var saveBtn = el("button", "btn primary"); saveBtn.innerHTML = ic("save") + "<span>Save to problem</span>";
    foot.append(closeBtn, sendBtn, saveBtn); modal.appendChild(foot);

    overlay.appendChild(modal);

    // sizing after layout
    requestAnimationFrame(function () { setupCanvas(); });

    // interactions
    penBtn.onclick = function () { tool = "pen"; penBtn.setAttribute("aria-pressed", "true"); eraBtn.setAttribute("aria-pressed", "false"); };
    eraBtn.onclick = function () { tool = "eraser"; eraBtn.setAttribute("aria-pressed", "true"); penBtn.setAttribute("aria-pressed", "false"); };
    colorInp.oninput = function () { color = colorInp.value; tool = "pen"; penBtn.setAttribute("aria-pressed", "true"); eraBtn.setAttribute("aria-pressed", "false"); };
    sizeInp.oninput = function () { size = +sizeInp.value; };
    undoBtn.onclick = undo;
    clearBtn.onclick = function () { pushUndo(); ctx.clearRect(0, 0, canvas.width, canvas.height); };
    closeBtn.onclick = close;
    saveBtn.onclick = function () {
      if (ctxRef.classId) {
        Store.saveDrawing(ctxRef.classId, ctxRef.lessonId, ctxRef.problemId, canvas.toDataURL("image/png"));
        App.toast("Saved scratch work ✓");
      }
      close();
    };
    sendBtn.onclick = function () {
      // Stub: real upload to an AI tutor requires the backend stage.
      App.modal(
        "<h2>Send to tutor</h2>" +
        "<div class='notice'><strong>Coming in the tutor stage.</strong>" +
        "Uploading your handwritten work to the AI tutor needs the backend + API stage " +
        "(out of scope for this static MVP). Your work is saved to the problem in the meantime.</div>" +
        "<div class='modal-actions'><button class='btn primary' data-close>Got it</button></div>"
      );
      if (ctxRef.classId) Store.saveDrawing(ctxRef.classId, ctxRef.lessonId, ctxRef.problemId, canvas.toDataURL("image/png"));
    };
  }

  function setupCanvas() {
    var wrap = canvas.parentElement, r = wrap.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1; ctxScale = dpr;
    canvas.width = Math.max(300, r.width) * dpr;
    canvas.height = Math.max(300, r.height) * dpr;
    ctx = canvas.getContext("2d"); ctx.scale(dpr, dpr);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    // load prior drawing if present
    var prior = ctxRef.classId && Store.getDrawing(ctxRef.classId, ctxRef.lessonId, ctxRef.problemId);
    if (prior) { var img = new Image(); img.onload = function () { ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr); }; img.src = prior; }

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function pos(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left), y: (e.clientY - r.top) };
  }
  function pushUndo() {
    try { undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); if (undoStack.length > 20) undoStack.shift(); } catch (e) {}
  }
  function undo() { if (!undoStack.length) return; ctx.putImageData(undoStack.pop(), 0, 0); }

  function down(e) { drawing = true; pushUndo(); last = pos(e); canvas.setPointerCapture(e.pointerId); e.preventDefault(); }
  function move(e) {
    if (!drawing) return;
    var p = pos(e);
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = color; ctx.lineWidth = tool === "eraser" ? size * 4 : size;
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p; e.preventDefault();
  }
  function up() { drawing = false; }

  function close() { overlay.hidden = true; overlay.setAttribute("aria-hidden", "true"); undoStack = []; }

  return { open: open, close: close };
})();
