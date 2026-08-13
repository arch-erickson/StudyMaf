# StudyMAF — subject visual libraries

Each **subject** has its own curated library of approved diagram primitives. The
Diagram Generation Engine (DGE) composes lesson diagrams **only** from the library
of the subject a diagram declares — so a physics diagram can never pull in a
calculus asset or a generic filler icon (business/briefcase/contact/etc.).

```
assets/
  physics/
    registry.json        semantic metadata for every approved asset
    primitives/*.svg      the approved SVGs (committed, StudyMAF-authored, MIT)
  calculus/               registry scaffold (empty — routing established)
  chemistry/              registry scaffold (empty — routing established)
```

## registry.json

```jsonc
{
  "subject": "physics",
  "version": 1,
  "assets": {
    "charge-positive": {
      "id": "charge-positive",
      "subject": "physics",
      "topic": "electricity",
      "roles": ["charge", "positive", "source"],
      "bounds": { "w": 30, "h": 30 },
      "anchors": { "center": [15, 15], "n": [15, 0], "s": [15, 30], "e": [30, 15], "w": [0, 15] },
      "source": "studymaf",
      "license": "MIT",
      "file": "primitives/charge-positive.svg"
    }
  }
}
```

- **roles** — the semantic parts the primitive can play (a DGE spec can request by role).
- **bounds** — the asset's intrinsic width/height (its viewBox), used for placement/scale.
- **anchors** — named attachment points in the asset's local coordinate space
  (`center`, edge midpoints, plus curated points like `gap-center` for plates).
- **source / license** — carried into each diagram's attribution manifest.

## Adding a new subject library later (e.g. Calculus)

The routing already exists — you only add assets:

1. **Author the primitives.** Add StudyMAF-authored SVGs (monochrome, `fill:none`,
   `stroke:currentColor`) to a source module, e.g. `tools/visual-library/authored-calculus.js`
   exporting `{ CALCULUS }` — the same `S()/T()` style contract as
   `tools/visual-library/authored.js`. Only approved, on-topic primitives; no filler.
2. **Register them.** In `tools/build-subject-libraries.js`, import the module and add a
   `buildSubject("calculus", Object.entries(CALCULUS), {…})` call (replacing the
   `emptySubject("calculus", …)` scaffold). Add `roles`/`anchors` overrides for key ids.
3. **Rebuild:** `node tools/build-subject-libraries.js` — writes `assets/calculus/primitives/*.svg`
   and `assets/calculus/registry.json`.
4. **Use it.** A DGE spec sets `subject: "calculus"`; the DGE validates every requested
   asset against the calculus registry and fails clearly if a non-calculus/unapproved
   asset is requested.

No DGE/engine code changes are required to add a subject — only assets + one build call.

## Regenerating

```bash
node tools/build-subject-libraries.js     # rebuild all subject libraries from source
```

Source of truth = the authored modules under `tools/visual-library/`. Do not hand-edit
files in `assets/*/primitives/` — they are generated.
