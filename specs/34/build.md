# Build notes, issue 34

Added: `maxItemsPerPage` in `bands.ts` (3,4,5,6,7,8,10 for early-reader..university), `workbook-schema`, `workbook-plan`,
`workbook-check`, `render-workbook`, `workbook-pdf` (Playwright Chromium), `workbook-agent` + `buildWorkbookPrompt`,
`POST /workbook` (shared `admit()` guard with `/chat`, so one daily budget), web `workbook-action` and a hidden-until-sheet
button in `index.astro`, a workbook run in `smoke.ts` and `eval.ts`.

Deviations from plan.md:
- `levels.json` got one line so `tests/structure/workbook-boundaries.test.ts` has an owner (levels test needs it).
- Not touched though listed: `sse-events.ts`, `web/src/lib/api.ts`, `api.test.ts`, `server.test.ts`. The web action parses
  the `workbook` event loosely (band + html) because its locked test sends a partial workbook.

Not verified here: `workbook-pdf.test.ts` (PDF pages == plan). Chromium cannot launch inside the sandbox
(Mach port permission denied) and the unsandboxed retry was declined. Run
`PLAYWRIGHT_BROWSERS_PATH=~/Library/Caches/ms-playwright npx vitest run shared/src/workbook-pdf` locally.
Fixed 816x1056 pages with `overflow: hidden` make an overflow impossible to count as an extra page, but unseen clipping
is possible at the per-page limits. `make e2e`, `make check` and live smoke/eval were not run.
`factory/engine/real-host.test.ts` fails on a sandbox EPERM, unrelated.
