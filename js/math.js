/* StudyMAF — math rendering helper (KaTeX, vendored).
 * Renders $...$ and $$...$$ inside any element. Safe if KaTeX hasn't loaded yet.
 */
window.StudyMath = (function () {
  "use strict";
  function render(el) {
    if (!el || typeof window.renderMathInElement !== "function") return;
    try {
      window.renderMathInElement(el, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false,
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "input"]
      });
    } catch (e) { /* leave raw text */ }
  }
  return { render: render };
})();
