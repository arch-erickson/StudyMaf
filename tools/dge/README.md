# Diagram Generation Engine (DGE)

Composes a **self-contained SVG diagram** from the visual library. Runs at
build/authoring time (Node): generate a class's diagrams from the library, then
offload the library — the emitted SVGs are what get served. Later this lives in
the backend and works the same way.

```bash
node tools/build-dge-examples.js   # render the demo diagrams -> studymaf-visual-library/_dge-examples/
```

## Pipeline (matches the design brief)
1. **Library graphics** — pull objects/icons/illustrations from `asset-index.json`
   for detailed context. Optional: skip for purely abstract diagrams (see the
   calculus example). Mono assets are **recolored to the diagram's palette**;
   already-colored illustrations (bioicons / flat-color) are kept as-is.
2. **Annotations, symbols & text** — sized to fit and placed to **avoid
   obstructing content** (`geometry.placeNear` tries a ring of positions and picks
   the least-overlapping). Annotation colors are **fixed and consistent**: a
   pointing arrow is always the same neutral, `+` is green, `−` is red, and
   semantic vectors keep their role color (force purple, field green, velocity
   amber…). See `palette.js` → `ANNOT`.
3. **Extra graphics/marks** — add freely (callouts, guides, focal points) while
   preserving spacing and composition.

## Files
- `palette.js` — `ANNOT` (fixed annotation colors) + `PALETTES` (content palettes; a
  diagram commits to one, chosen deterministically from a seed so a topic keeps its look).
- `assets.js` — search the index, load + parse an SVG (viewBox + inner), recolor mono.
- `geometry.js` — bounding boxes, overlap, collision-aware label/object placement.
- `dge.js` — the `Diagram` composer (`place`, `arrow`, `symbol`, `text`, `dimension`,
  `line`, `callout`, `toSVG`) **and** `render(spec)`.

## Spec format (what the AI stage emits)
```js
render({
  canvas: { width: 480, height: 260, seed: "physics-mechanics" },   // seed picks the palette
  items: [
    { type: "asset", query: "car", cx: 120, cy: 150, width: 118, color: "#4F5D75" },
    { type: "arrow", from: [182,130], to: [300,130], role: "velocity", label: "v" },
    { type: "dimension", from: [120,210], to: [410,210], label: "d" },
    { type: "symbol", kind: "plus", x: 90, y: 200 },
    { type: "text", text: "Constant velocity", x: 240, y: 26, anchor: "middle", weight: 700 }
  ]
})  // -> "<svg …>…</svg>"
```
`asset` accepts `query` (searched) or `id` (exact), plus `colored:true|false` to
force the colored/mono register, `role` for a semantic color, `size|width|height`,
`x,y` (top-left) or `cx,cy` (center), `opacity`, `flip`, `label`.

## Next: animation
Animation is added **after** the DGE is proven — a separate ability that keyframes
an existing diagram/spec (e.g. moving the velocity arrow, growing the field), not a
rewrite. The composer already separates content / annotation / label layers to make
that clean.
