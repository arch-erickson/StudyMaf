/* StudyMAF — SOFT access gate.
 *
 * ⚠️ THIS IS NOT REAL SECURITY. It is a client-side passphrase prompt whose only
 * job is to stop a casual visitor from reading the site. The passphrase lives in
 * this file, which anyone can view — do NOT put anything sensitive behind it.
 * That's fine here: there is nothing sensitive on this site (it's study material).
 *
 * Change the passphrase below to whatever you like. Set it to "" to disable the gate.
 */
(function () {
  "use strict";
  var PASSPHRASE = "studymaf";              // <-- change this to your own soft passphrase
  var SESSION_KEY = "studymaf.gate.ok";

  if (!PASSPHRASE) return;                   // gate disabled
  try { if (sessionStorage.getItem(SESSION_KEY) === "1") return; } catch (e) { return; }

  // Build a blocking overlay before the app is usable.
  var overlay = document.createElement("div");
  overlay.setAttribute("style",
    "position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#4F5D75,#2D3142);" +
    "display:grid;place-items:center;padding:20px;font-family:Inter,-apple-system,Segoe UI,sans-serif;");
  overlay.innerHTML =
    "<div style='background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.35);" +
      "padding:34px 30px;max-width:360px;width:100%;text-align:center'>" +
      "<div style='font-size:1.7rem;font-weight:800;color:#2D3142;margin-bottom:4px'>Study<span style='color:#EF8354'>MAF</span></div>" +
      "<p style='color:#6b7280;font-size:.9rem;margin:0 0 20px'>Enter the passphrase to continue.</p>" +
      "<input id='gate-input' type='password' placeholder='Passphrase' autocomplete='off' " +
        "style='width:100%;font:inherit;font-size:1rem;padding:12px 14px;border:2px solid #e4e7ec;border-radius:10px;box-sizing:border-box'>" +
      "<p id='gate-err' style='color:#e03131;font-size:.82rem;height:16px;margin:8px 0 0'></p>" +
      "<button id='gate-go' style='margin-top:12px;width:100%;font:inherit;font-weight:700;padding:12px;border:none;" +
        "border-radius:10px;background:#EF8354;color:#fff;cursor:pointer'>Enter</button>" +
    "</div>";

  function mount() {
    document.body.appendChild(overlay);
    var input = overlay.querySelector("#gate-input");
    var err = overlay.querySelector("#gate-err");
    var go = overlay.querySelector("#gate-go");
    input.focus();
    function attempt() {
      if (input.value === PASSPHRASE) {
        try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) {}
        overlay.remove();
      } else {
        err.textContent = "Not quite — try again.";
        input.value = ""; input.focus();
      }
    }
    go.addEventListener("click", attempt);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
