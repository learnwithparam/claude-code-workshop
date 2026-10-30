# Tests for issue 34 (stage: tests)

No `golden` file exists under specs/34/, so `spec.md` R1 to R21 is the golden list. All tests fail on the base commit
(modules and fields do not exist yet). No source was written.

Interface the tests pin (the build stage must provide it):

- `bands.ts`: `Band.maxItemsPerPage` (positive int, <= maxItems, non-decreasing with band age).
- `workbook-schema.ts`: `workbookContentSchema` (model fills: title, band, subject, cover, chapters), `workbookSchema`
  (adds `contents`, `answerKey: {chapter, item, answer}[]`), `buildWorkbook(content)`.
- `workbook-plan.ts`: `planWorkbook(wb)` -> `{pages, totalPages, contents: {title, page}[]}`; page kinds
  `cover | contents | chapter | answer-key`, each with `number`; chapter pages have `chapter`, `items`; key pages `entries`.
- `workbook-check.ts`: `checkWorkbook(wb)` -> `{ok, problems}`.
- `render-workbook.ts`: `renderWorkbook(wb)` HTML, `.workbook-page` with `data-page-kind`, `break-before: page`.
- `workbook-pdf.ts`: `renderWorkbookPdf(wb)` -> Uint8Array, `countPdfPages(bytes)`.
- `api/src/agent/workbook-agent.ts`: `runWorkbookAgent(client, sheet)` -> `{kind:"workbook"|"failed", ...}`, tool `submit_workbook`.
- `api/src/server.ts`: `POST /workbook {sheet}`, dep `runWorkbook`, SSE `workbook` / `error`, shares the daily budget.
- `web/src/lib/workbook-action.ts`: `showWorkbookAction(sheet|null)`, `makeWorkbook(sheet, fetch?)` -> Workbook | null.

Coverage: R1,R2,R4 schema; R3,R6,R7,R8,R9 plan properties (fast-check); R3,R4,R16 check; R9,R11 render; R10,R21 PDF property;
R12-R16 agent, server, web; R5 bands; R17-R20 `tests/structure/workbook-boundaries.test.ts`.
Caveat: the PDF property needs a browser (Playwright), so it may not run in a sandbox without local port or browser access.
