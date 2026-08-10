# StudyMAF — Lesson Data

The **AI fills in data; the code owns the structure.** Every lesson is a JSON file that
conforms to [`lesson.schema.json`](lesson.schema.json). The page reads the JSON and renders
it — lesson text is **never** baked into HTML.

## Folder layout

```
data/
  lesson.schema.json     <- source-of-truth schema (do not change casually)
  index.json             <- list of lessons the site shows
  lessons/
    sample.json          <- one lesson per file
    <your-lesson>.json
```

## How to add a new lesson

1. **Copy an existing lesson** to start from a valid shape:
   `data/lessons/sample.json` → `data/lessons/quadratics.json` (pick your own filename, lowercase, no spaces).

2. **Fill in the content.** Keep it conforming to the schema:
   - `title`, `summary` — strings.
   - `concept_sections` — ordered array of `{ level, heading, explanation }`.
     Start simple at level 1 and grow in complexity as `level` increases.
   - `real_world_examples` — **exactly 3**, each `{ title, scenario, how_the_math_applies }`.
   - `videos` — `{ concept_query, math_query, combined_query }`.
     These are **YouTube search queries, not URLs.** Do not invent links; real links get pasted by hand later.
   - `problems` — **exactly 20**, each `{ id, difficulty, prompt, correct_answer, solution_steps, hint }`.
     `difficulty` is one of `easy | medium | hard | stretch`. Aim for roughly
     **6 easy / 8 medium / 4 hard / 2 stretch**, none exceeding the class's level.
     `solution_steps` is an array of strings (one step per entry). `id` must be unique within the lesson.

3. **Register it in `index.json`** so the site picks it up. Add an entry to the `lessons` array:
   ```json
   {
     "id": "quadratics",
     "title": "Quadratic Equations",
     "file": "lessons/quadratics.json"
   }
   ```
   - `id` — short unique slug; it also becomes the `?lesson=` URL parameter.
   - `title` — what shows in the lesson picker.
   - `file` — path to the JSON, relative to the `data/` folder.

4. **Commit both files** (the new lesson + updated `index.json`) and push. The lesson appears
   automatically in the picker — no code changes needed.

## Validating before you commit (optional)

The site tolerates minor issues, but to be safe you can validate a lesson against the schema
with any JSON Schema validator (e.g. the VS Code "JSON" extension, or an online Draft-07 validator).
Point it at `lesson.schema.json`.

## Notes

- This is the MVP stage: static site, no backend, no API keys, nothing secret.
- Because lessons load via `fetch()`, the site must be served over `http(s)://`
  (GitHub Pages does this). Opening `index.html` directly from disk (`file://`) will block the fetch.
