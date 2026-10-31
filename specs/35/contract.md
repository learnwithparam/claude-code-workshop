# Interfaces the golden tests assume (specs/35/golden)

- `createApp({ env, client, run, fill })` builds its own prompt cache and template store. `fill(client, { slots }) -> { kind: "slots", values: string[], usage } | { kind: "failed", usage }`.
- Cache key: normalised (trim, collapse whitespace, lowercase) last user prompt with the grade phrase that `parseBand` matched removed, + band. So "x for grade 3" and "x for grade 4" share an entry; the prompt without the grade phrase is the text half of the key. Only worksheets are cached; entries failing `checkBand` are dropped.
- The `worksheet` SSE event gains `sheetId`. `POST /templates/good` takes `{ sheetId }`: 400 bad body, 404 unknown sheet id, 422 failing `checkBand`, 200 stored, idempotent.
- `api/src/templates/distill-template.ts`: `distillTemplate(sheet) -> { ok: true, template } | { ok: false, problems }`; template has `band`, `slots` (one per item), `sections` (heading/instruction kept).
- `api/src/templates/template-store.ts`: `createTemplateStore()` with `add`, `size`.
- `shared/src/template.ts`: `fillSlotsSchema(template)` (`{ values: string[] }`, length = slots), `fillTemplate(template, values) -> Worksheet`, throws on length mismatch.
- `api/src/agent/live-cap.ts`: `withinLiveCap(spent, next, cap) -> boolean`. `eval.ts` logs without- and with-template output tokens.
- Live cap in `/chat`: `env.LIVE_SPENT_USD` (default 0) is dollars already spent. A cache miss with `LIVE_SPENT_USD >= 60` makes no model call and emits a generic `error` event; cache hits never consult the cap.
- `createApp({ templates })`: optional template store override (default `createTemplateStore()`); a template whose slot count exceeds the band's `maxItems` is never matched.
- `api/src/agent/template-eval.ts`: `runTemplateEval({ prompt, spentUsd, estimateUsd, capUsd, run, fill })` -> `{ kind: "over-budget", message }` (no model call; message says the budget cap would be exceeded) or `{ kind: "report", without, withTemplate, ok }` where both are output-token numbers and `ok` is `withTemplate < without`. `eval.ts` calls it and exits non-zero when `ok` is false.
- The tool offered on a template fill is `submit_slots`, whose schema has only `values`; a full generation offers `submit_worksheet`.
- Spec says "grade 5" for another band; grade 5 shares band `grade-3-5` with grade 3, so goldens use grade 7.
