# Rho online-mode — backend handoff (for Codex)

The **frontend** for online-mode Learn / Practice / Quiz is built in `js/app.js`
(commit `1ebd4a6`). It already calls the tutor endpoint and renders responses. This
doc is the exact backend contract it expects so you can wire `api/tutor/**` to it.
Frontend needs **no further changes** once these land.

---

## 1. What the frontend sends

Helper `askRho(question, opts)` in `js/app.js` does:

```
POST  https://studymaf-tutor.vercel.app/api/tutor/chat
{
  "question":   "<prompt string>",
  "context":    { ...tutorContext, page: "<see below>", ... },
  "history":    [],                       // reserved; currently empty
  "image_data": "data:image/jpeg;base64,…"   // ONLY for step-grading
}
```

`context.page` tells you which surface is calling:

| `context.page`        | Surface                     | What the student expects back |
|-----------------------|-----------------------------|-------------------------------|
| `learn concept`       | Learn — concept panel        | Short explanation + one check question; MAY use `[[CHOICES]]`/`[[INPUT]]`/`[[CONTINUE]]` |
| `learn practice`      | Learn — hints-first check     | A single hint or the method — **never the final answer** |
| `online practice`     | Practice session AI coach     | Hint-first; obey "harder / easier / explain / straightforward" asks |
| `quiz step grading`   | Quiz review — uploaded work    | Per-step grading of the image (see §4) |

Other useful context fields already populated: `lesson_id`, `lesson_title`,
`lesson_summary`, `chapter`, `textbook`, `question_prompt`, `difficulty`, `source`.

## 2. Response shape (unchanged — keep it)

Non-streamed JSON `{ "answer": "<text>" }`. The frontend parses the existing
plain-text format with `parseRhoResponse`:

```
ANSWER: <1–4 sentences>
STEPS:
1. …
2. …
FINAL: <highlighted result>
```

Keep emitting this. The changes below are **additive**.

## 3. Directive contract — let the AI drive the UI  ← main ask

The frontend already parses these tags out of `answer` (`parseRhoDirectives` /
`renderControlledResponse`) and renders real controls. **Update the system prompt so
the model emits them when it would help** (especially for `learn concept`):

| Tag (model writes it verbatim)      | Renders as |
|-------------------------------------|------------|
| `[[CONTINUE]]`                      | A **Continue →** button that advances the lesson |
| `[[CHOICES] a \| b \| *c \| d]`     | **Multiple choice**; the option prefixed `*` is correct |
| `[[INPUT] prompt \| answer]`        | A **text field** checked against `answer` |

Rules to put in the prompt:
- Put a tag on its **own line**, after the normal ANSWER/STEPS/FINAL text.
- Exactly one correct option (`*`) per `[[CHOICES]]`.
- Use them to make concept learning interactive; don't spam them on every reply.
- If unsure, omit tags — plain text still renders fine.

## 4. Step-grading of uploaded work (Quiz review)

When `context.page === "quiz step grading"`, `image_data` is a photo of the
student's handwritten solution and `question` lists the missed questions + answers.
Needs:
- A **vision-capable** model path (the current image validation already exists).
- Return, per question: which steps are **correct** (award partial credit per step,
  not just the final answer) and how to fix the wrong steps. Use `STEPS:` for the
  per-step breakdown so it renders as a list.

## 5. Two infra items this depends on

1. **`max_tokens`** is currently ~180 — too small for MC generation, multi-step
   concept teaching, and step-grading. Raise it for these `page` values (a per-page
   cap is fine; chat can stay short).
2. **CORS**: allow the deployed StudyMAF origin for these calls. (Localhost stays
   blocked, which is why the live round-trip can't be tested from dev — the frontend
   degrades gracefully there.)

## 6. Unrelated but pending (also yours)

`dashboard/index.html` still references `js/app.js?v=4` and `js/store.js?v=4`. Bump
both to **`?v=5`** so the Learn/Practice/Quiz + online-mode updates aren't served
stale.

---

**Summary:** keep the JSON `{answer}` + ANSWER/STEPS/FINAL format; add the three
directive tags to the prompt, raise `max_tokens`, support vision step-grading for
`quiz step grading`, and open CORS for the deployed origin. The frontend consumes
all of it today.
