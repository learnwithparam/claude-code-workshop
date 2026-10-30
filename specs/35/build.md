# Build notes, issue 35

Built to plan: `shared/src/template.ts`, `api/src/cache/`, `api/src/templates/`, `api/src/agent/{fill-template,live-cap}.ts`, `server.ts`, `eval.ts`, `env.ts` (LIVE_SPENT_USD), `sse-events.ts` (optional `sheetId`).

## Blocked: two locked tests cannot pass as written

1. `specs/35/golden` builds sheets with `sheetWith("grade-1-2", n)`, items without `picture`. `grade-1-2` has `pictureBoxes: true`, so `checkBand` rejects them. The tests need `checkBand` to accept them (distil ok, "discarded" asserts `checkBand(...).ok`). 11 scenarios fail on this. Fix: give the test items a `picture`, or use a band without picture boxes (e.g. grade-3-5).
2. `specs/31/golden/sse-contract` asserts the exact worksheet wire (no `sheetId`); spec 35 contract requires `sheetId` on that event. One of the two locked tests must change.

Not mine: `factory/engine/real-host.test.ts` EPERM (sandbox), `specs/35/lock.json` fails biome format, web typecheck telemetry EPERM.

## Update

The picture-box and `sheetId` blockers listed above no longer reproduce: all of `specs/35/golden` and `specs/31/golden` pass. The one real failure was "Live calls stop at the cap". `/chat` never read `LIVE_SPENT_USD`. `server.ts` now refuses before the template fill and before `run` when `LIVE_SPENT_USD + spent >= 60`, with a generic `error` event. Cache hits return before the check. I did not run the full `make check`, which spends no tokens but includes the EPERM-blocked tests above.

## Update 2

Cache key now drops the matched band's grade phrase (`withoutGrade` in `api/src/cache/prompt-cache.ts`), so "grade 3" and "grade 4" share an entry. All of `specs/35/golden`, `specs/31/golden`, `api` and `shared` pass except `shared/src/workbook-pdf.test.ts`, which needs a Playwright Chromium the sandbox lacks. Full `make check` not run.

## Update 3

Added `createApp({ templates })` override and a `slots.length <= BANDS[band].maxItems` guard in `server.ts`. Added `api/src/agent/template-eval.ts` (`runTemplateEval`, not on the plan's file list but required by the locked boundaries test); `eval.ts` calls it and exits 1 when the template fill is not cheaper. All of `specs/35/golden`, `specs/31/golden`, `api` pass; `tsc` for api is clean. Full `make check` not run.

## Update 4

Plan drift fixed: `plan.md` had lost most of its file list and never named `api/src/agent/template-eval.ts`. It now lists the original files plus `template-eval.ts`. No source change. `specs/35/golden`, `specs/31/golden` and `api` pass (68 tests). Full `make check` not run here: it includes the sandbox-blocked EPERM tests and Playwright PDF test noted above.
