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
| `core/phosphor/` | [@phosphor-icons/core](https://phosphoricons.com) (9,072) | MIT | general objects — cars, people, tools, buildings, sports… |
| `core/tabler/` | [@tabler/icons](https://tabler.io/icons) (6,184) | MIT | technical/diagram primitives, arrows, charts, UI |
| `chemistry/bioicons/` | [Bioicons](https://bioicons.com) chemistry only (276) | per-icon (see `_licenses.json`) | atoms, molecules, bonds, lab glassware, reagents. **No biology imported.** |
| `mathematics/` `physics/` `engineering/` `architecture/` `diagram-components/` | **StudyMAF-authored** (152) | MIT | the STEM primitives generic icons lack |

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
Core/chemistry tags are auto-derived from filenames (id + folder). To give a
high-value cross-subject object richer semantic tags (e.g. `car` → motion, speed,
distance), add a curated override — the index builder is the place to extend.

## Adding authored assets
Add an entry to the relevant `tools/visual-library/authored*.js` map (`"<path>": S(w,h,inner)`),
then rerun the builder. Keep the monochrome currentColor contract so styles never clash.
