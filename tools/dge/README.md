# Diagram Generation Engine (DGE)

Composes a **self-contained SVG diagram** from a subject's curated visual library.
Runs at **build/authoring time** (Node) — a diagram never depends on a runtime AI
call. Math is baked in as KaTeX **MathML**, so the emitted SVG needs no runtime
KaTeX either. The emitted SVGs are what the app serves.

```bash
node tools/build-subject-libraries.js   # (re)build assets/<subject>/ from source
node tools/build-lesson-diagrams.js      # render lesson diagrams -> data/diagrams/ + wire into lessons
node tools/dge/test-dge.js               # DGE test suite (composition safety, validation, manifest)
node tools/build-dge-examples.js         # legacy demo gallery (global library) -> studymaf-visual-library/_dge-examples/
```

## Subjects (curated libraries) — `assets/<subject>/`
Every diagram declares a **subject** and may use **only** that subject's approved
assets — so a physics diagram can't pull in a calculus asset or a generic filler
icon. See `assets/README.md` for the registry format and **how to add a subject**.

```js
render({
  subject: "physics",                    // REQUIRED — validated against assets/<subject>/
  id: "phys1442-02-uniform-field",
  title: "Uniform field between parallel plates",
  canvas: { width: 420, height: 230, seed: "physics-electricity" },  // seed picks the palette
  items: [
    { type: "asset", id: "parallel-plates", cx: 205, cy: 135, width: 210, color: "#3A4150" },
    { type: "text", text: "\\vec E", x: 285, y: 135, math: true, color: "#3FA98A" }, // raw LaTeX (or "$…$")
    { type: "dimension", from: [355, 82], to: [355, 188], label: "d" }
  ]
})  // -> { svg: "<svg …>…</svg>", manifest: { subject, assets, attributionRequired } }
```

`asset` takes `id` (exact) or `query` (searched **within the subject only**), plus
`cx,cy`|`x,y`, `size|width|height`, `color`|`role`, `opacity`, `flip`, `label`, `anchor`.

## Pipeline
1. **Library graphics** — approved subject assets, recolored to the palette (mono) or
   kept as-is (colored). Each placement's ids/refs/classes/styles are **namespaced**
   so two assets that share original ids never collide (`namespaceSvg` in `assets.js`).
2. **Annotations, symbols & text** — placed to avoid obstructing content
   (`geometry.placeNear`). Consistent annotation colors (`palette.js` → `ANNOT`): a
   pointing arrow is one neutral, `+` red / `−` blue, semantic vectors keep their role
   color (force purple, field green, velocity amber…). Equations use real notation
   (`math:true` → KaTeX MathML).
3. **Extra marks** — callouts, guides, focal points, while preserving spacing.

## Validation (fail clearly before rendering)
`render()` calls `validateSpec()` first; it throws one error listing every problem:
unknown subject, an asset not approved for the subject, unknown item type, non-finite
or off-canvas coords/dims, an anchor/role the asset doesn't have, and unsupported
properties.

## Attribution manifest
`render()` returns `{ svg, manifest }`. The manifest lists the assets used with their
`source`/`license` and the attribution strings any third-party assets require
(StudyMAF-authored assets need none). `build-lesson-diagrams.js` aggregates these into
`data/diagrams/manifest.json`.

## Reaching the app
`build-lesson-diagrams.js` writes each SVG to `data/diagrams/<id>.svg` and sets the
lesson's concept `figure` to `{ "type": "svg", "src": "data/diagrams/<id>.svg", "caption": … }`.
`js/figures.js` (`type:"svg"`) injects it responsively into the concept reader — the
same rendering path as the other figure types, so students see it in the real lesson
flow (no demo-only duplicate).

## Files
- `subjects.js` — subject router/loader (`loadSubject`, `knownSubjects`, scoped resolve).
- `palette.js` — `ANNOT` (fixed annotation colors) + `PALETTES` (content palettes).
- `assets.js` — `parseSvg`, `tintMono`, `namespaceSvg`, and the legacy global `Library`.
- `geometry.js` — bounding boxes, overlap, collision-aware placement.
- `dge.js` — the `Diagram` composer, `validateSpec`, and `render(spec)`.
- `test-dge.js` — test suite.

## Next: animation
Added **after** the DGE is proven — a separate ability that keyframes an existing
diagram/spec, not a rewrite. The composer already separates content / annotation /
label layers to make that clean.
