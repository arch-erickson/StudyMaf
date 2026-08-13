#!/usr/bin/env node
/* DGE test suite (no framework): safe SVG composition, subject purity, spec
 * validation, and attribution manifest. Run: node tools/dge/test-dge.js */
"use strict";
const assert = require("assert");
const { render, validateSpec } = require("./dge.js");
const { namespaceSvg } = require("./assets.js");

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log("  ✓ " + name); };

console.log("SVG composition safety:");
test("two SVGs with the SAME original ids render safely together", () => {
  // both assets define <linearGradient id="g"> and reference it via url(#g)
  const frag = `<defs><linearGradient id="g"><stop offset="0"/></linearGradient></defs><rect fill="url(#g)" class="c"/><use href="#g"/>`;
  const a = namespaceSvg(frag, "a0");
  const b = namespaceSvg(frag, "a1");
  const combined = `<g class="${a.scope}">${a.body}</g><g class="${b.scope}">${b.body}</g>`;
  // each placement got its own id, and its fill/use point at ITS OWN gradient
  assert(a.body.includes('id="a0__g"') && b.body.includes('id="a1__g"'), "ids namespaced per placement");
  assert(a.body.includes("url(#a0__g)") && b.body.includes("url(#a1__g)"), "url(#..) rewritten to own id");
  assert(a.body.includes('href="#a0__g"') && b.body.includes('href="#a1__g"'), "href=#.. rewritten to own id");
  assert(!/url\(#g\)|href="#g"|id="g"/.test(combined), "no bare original id 'g' leaks into the combined SVG");
  assert(a.body.includes('class="a0__c"'), "classes namespaced");
});

test("embedded <style> is scoped so one asset can't style another", () => {
  const frag = `<style>.c{fill:red}</style><rect class="c"/>`;
  const a = namespaceSvg(frag, "a0");
  assert(a.body.includes(".a0__scope .a0__c"), "style selector scoped + class namespaced: " + a.body);
});

console.log("Subject purity + validation:");
test("valid physics spec renders and returns a manifest", () => {
  const { svg, manifest } = render({
    subject: "physics", id: "test-1", canvas: { width: 300, height: 160 },
    items: [
      { type: "asset", id: "charge-positive", cx: 80, cy: 80, size: 40, role: "positive" },
      { type: "arrow", from: [110, 80], to: [220, 80], role: "field", label: "E" }
    ]
  });
  assert(svg.startsWith("<svg"), "produced an svg");
  assert(manifest.subject === "physics" && manifest.assets.some(a => a.id === "charge-positive"), "manifest lists the asset");
});

test("unknown subject fails clearly", () => {
  assert.throws(() => validateSpec({ subject: "biology", items: [] }), /unknown subject "biology"/);
});

test("a physics diagram may NOT use a non-physics / unapproved asset", () => {
  assert.throws(
    () => validateSpec({ subject: "physics", canvas: { width: 200, height: 200 }, items: [{ type: "asset", id: "briefcase", cx: 50, cy: 50 }] }),
    /no approved "physics" asset for "briefcase"/
  );
});

test("bad coordinates / off-canvas fail clearly", () => {
  assert.throws(() => validateSpec({ subject: "physics", canvas: { width: 100, height: 100 }, items: [{ type: "arrow", from: [0, 0], to: [500, 9] }] }), /outside the 100×100 canvas/);
  assert.throws(() => validateSpec({ subject: "physics", items: [{ type: "text", text: "x", x: "nope", y: 10 }] }), /must be a finite number/);
});

test("unknown item type and unsupported property fail clearly", () => {
  assert.throws(() => validateSpec({ subject: "physics", items: [{ type: "sparkle", x: 1, y: 1 }] }), /unknown item type "sparkle"/);
  assert.throws(() => validateSpec({ subject: "physics", items: [{ type: "text", text: "x", x: 1, y: 1, wobble: true }] }), /unsupported property "wobble"/);
});

test("invalid anchor / role on an asset fail clearly", () => {
  assert.throws(() => validateSpec({ subject: "physics", canvas: { width: 200, height: 200 }, items: [{ type: "asset", id: "parallel-plates", cx: 100, cy: 100, anchor: "nowhere" }] }), /has no anchor "nowhere"/);
});

console.log(`\n${passed} tests passed.`);
