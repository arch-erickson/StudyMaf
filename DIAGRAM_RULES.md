# StudyMAF — Diagram Rules

Rules every diagram (concept figure, example figure, animation) must follow. The
**code** in `js/figures.js` enforces or provides these; **JSON** only supplies
parameters. Read this before authoring or generating any new figure.

---

## 1. Arrows & annotations are always 50% opacity

Any arrow-like element (`vector`, `arrow`, `ray`) and standalone annotation marks
render at **50% opacity** so they never hide the objects underneath. The engine
applies this automatically — do not bake opacity into the JSON. (Solid structural
lines, object bodies, and text labels stay full-opacity so they remain legible.)

If an arrow genuinely must be solid (rare), pass `"solid": true` on that element.

## 2. Standard colors for notations & symbols

Use the shared palette so a symbol means the same thing in every diagram. Authors
reference these by **name** (the engine resolves them); never hard-code a hex for a
standard notation. Available via `Figures.colors`:

| Meaning | Name | Hex |
|---|---|---|
| Positive charge / proton | `positive` | `#E8553A` |
| Negative charge / electron | `negative` | `#2F6DB5` |
| Force **F** | `force` | `#7048E8` |
| Electric field **E** | `field` | `#0CA678` |
| Velocity / motion **v** | `velocity` | `#F59F00` |
| Current **I** | `current` | `#E8553A` |
| Magnetic field **B** | `magnetic` | `#1098AD` |
| Distance / measurement | `measure` | `#8B93A1` |
| Neutral object / body | `ink` | `#2D3142` |
| Highlight (per-lesson accent) | `accent` | user accent |

## 3. Animations: 5–10 frames

Every animation has a **minimum of 5** and a **maximum of 10** frames. The engine
warns in the console if a figure has fewer than 5, and only plays the first 10 if
given more. Aim for smooth, readable motion within that budget. Use `frameMs`
(~700–1100ms) for pacing.

## 4. Detail level: ~20%, not 5%

Objects should be **recognizable**, not abstract boxes. A car looks like a car
(body + roofline + wheels + windows), a balloon looks like a balloon (teardrop +
knot + string). This is what the **component library** is for.

## 5. Component library — reuse, don't redraw

`js/figures.js` holds a registry `LIB` of reusable, parameterized components. A
figure references one with:

```json
{ "kind": "component", "name": "car", "x": 120, "y": 90, "scale": 1, "color": "ink", "label": "car" }
```

**Before drawing a new object, check the library first** (`Figures.hasComponent(name)`
or scan the `LIB` keys below). If the object already exists, reuse it — adjust
`scale`, `color`, or `flip` instead of authoring a new shape. Only when nothing fits
do you add a **new** component to `LIB` (one definition, reused everywhere after).

Each component is a function `(g, e) => void` that appends detailed SVG primitives
to a group translated/scaled to `(x, y, scale)`. Keep the local coordinate system
roughly ±40 around the origin so `scale` behaves predictably.

### Current components
Run `Object.keys(Figures.LIB)` for the live list. As of the electrostatics set
(lessons 1–3): `balloon`, `wall`, `person`, `hand`, `chip`, `car`, `cloud`,
`lightning`, `paper`, `dome` (Van de Graaff), `droplet`, `sphere` (Gaussian
surface), `cylinder` (Gaussian surface), `mesh`.

When you add a component, append it to `LIB` **and** list it here.
