# StudyMAF Visual Asset Library

A local, searchable bank of SVG assets the **diagram engine** composes class
diagrams from — generate a class's diagrams once, then offload the library until
the next class. It lives at `studymaf-visual-library/` (repo root) and is
**gitignored**: it's large and fully reproducible, so it never bloats the static
Pages repo. This later moves to the backend/object storage and works the same way.

## Rebuild
```bash
node tools/build-visual-library.js            # write authored SVGs + rebuild asset-index.json
node tools/build-visual-library.js --download # also (re)download core icons + chemistry
```

## What's inside
| Path | Source | License | Use |
|---|---|---|---|
| `core/phosphor/` | [@phosphor-icons/core](https://phosphoricons.com) (9,072) | MIT | mono general objects — cars, people, tools, buildings, sports… |
| `core/tabler/` | [@tabler/icons](https://tabler.io/icons) (6,184) | MIT | mono technical/diagram primitives, arrows, charts, UI |
| `core/lucide/` | [Lucide](https://lucide.dev) (2,025) | ISC | mono, clean general set (more shape variety) |
| `core/iconoir/` | [Iconoir](https://iconoir.com) (1,671) | MIT | mono, professional regular + solid |
| `core/flat-color-icons/` | [icons8 flat-color-icons](https://github.com/icons8/flat-color-icons) (329) | MIT | **colored**, professional flat objects (education, science, data, transport…) |
| `chemistry/bioicons/` | [Bioicons](https://bioicons.com) chemistry (276) | per-icon (see `_licenses.json`) | **colored/shaded** atoms, molecules, bonds, lab glassware, reagents |
| `illustrations/bioicons/` | Bioicons non-biology (409) | per-icon | **colored/shaded** professional illustrations — general items, people, scientific graphs, safety, hardware, imaging, nanotech. **No biology imported.** |
| `mathematics/` `physics/` `engineering/` `architecture/` `diagram-components/` | **StudyMAF-authored** (152) | MIT | the mono STEM primitives generic icons lack |

Two visual registers coexist by design: **mono `currentColor` line art** (Phosphor,
Tabler, Lucide, Iconoir, the authored primitives — recolorable to fit any diagram)
and **colored, shaded illustration** (Bioicons + flat-color — the "feels 3D" look).
The engine picks per need.

### Every subcategory carries 100+ graphics
`build-visual-library.js` runs a **distributor**: for each leaf subcategory
(`physics/optics`, `engineering/civil`, `mathematics/calculus`, …) it keyword-matches
the whole icon pool and copies ~100 relevant, on-aesthetic graphics into the folder
(keeping the authored primitives). Copies are named `<id>__<origin>.svg` so
attribution/licensing survives (the index maps each back to its real source). Tune
the keyword tiers in `SUBCATS`; a shared fallback guarantees the count is always met.

The 152 authored SVGs are the value-add and are version-controlled as data in
`tools/visual-library/authored*.js` (not as loose files). Style contract:
monochrome `stroke:currentColor`, `fill:none`, round caps/joins — so the diagram
engine recolors them freely and everything reads as one clean system.

## asset-index.json
`studymaf-visual-library/asset-index.json` — the searchable map the engine reads
instead of scanning the tree. One record per asset:
```json
{ "id": "coordinate-plane", "file": "mathematics/coordinate-systems/coordinate-plane.svg",
  "category": "coordinate-systems", "tags": ["coordinate","plane"],
  "subjects": ["mathematics","calculus","word-problems"], "source": "studymaf", "license": "MIT" }
```
Tags are auto-derived from filenames. **`subjects` routing** is how the engine
finds on-topic assets: colored Bioicons categories map to subjects
(`Scientific_graphs`→mathematics, `Imaging`→physics/optics, `Computer_hardware`→engineering…),
and a keyword booster tags genuinely relevant objects from the big Phosphor/Tabler
sets (`car`→physics, `gear`→engineering, `buildings`→architecture, `chart`→mathematics).
That lifts every top-level subject (physics, mathematics, engineering, architecture,
chemistry) well past 100 searchable, on-aesthetic assets. Extend the maps in
`build-visual-library.js` (`SUBJECT_KEYWORDS`, `BIOICON_SUBJECTS`, `flatColorSubjects`).

## Adding authored assets
Add an entry to the relevant `tools/visual-library/authored*.js` map (`"<path>": S(w,h,inner)`),
then rerun the builder. Keep the monochrome currentColor contract so styles never clash.
