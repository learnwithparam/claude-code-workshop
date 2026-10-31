# Refactor: split render.ts

Moved out of `shared/src/render.ts`, bodies unchanged:
- `escape-html.ts` – `escapeHtml`
- `render-item.ts` – `renderItem`
- `render-section.ts` – `renderSection`
- `render-answer-key.ts` – `renderAnswerKey`

`render.ts` keeps `renderWorksheet` (58 -> 30 lines). `index.ts` exports are unchanged.

Verified: `specs/25/golden` 9/9 pass, `shared` tests 10/10 pass. Golden tests and snapshots untouched.

`make check` is NOT green. Biome fails on:
1. `specs/25/lock.json` formatting (missing trailing newline). It is gate-owned, so I did not edit it.
2. A sandbox "Operation not permitted" while biome reads a protected env file in `api/`.
