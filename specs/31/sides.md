# Stage: sides

## Changed

- `shared/src/sse-events.ts` (new, exported from `shared/src/index.ts`): one zod schema per SSE event
  (`question`, `worksheet {sheet, html}`, `usage`, `error`) plus `ChatEvent` and `Usage` derived from them.
- `web/src/lib/api.ts`: `parseSse` validates each frame with those schemas. A changed shape, bad JSON or
  an unknown event becomes one generic `error` event ("Something went wrong. Try again."), with no
  detail from zod. The worksheet event now carries the whole `sheet`, so the client keeps it.
- `api/src/server.ts`: no change needed; it already writes `{ sheet, html }`.

## Results

- `npx vitest run specs/31/golden`: 14 passed (api wire, web replay, drift refusal).
- lint 0 errors, typecheck 0 errors/warnings.
- `npm test`: 1 failure, `factory/engine/real-host.test.ts` (mkdirSync denied by the sandbox,
  not related to this change). Not run: build, e2e, prove.

## Contract check

- `tests/contract/sse-events.test.ts` (new) is one import of the locked
  `specs/31/golden/sse-contract.golden.test.ts`, so the `contract` check (vitest on `tests/contract`)
  runs the locked test unedited. `npx vitest run tests/contract`: 14 passed.

## Open

- `tests/contract/recorded-events.json` from plan.md was not created; the test reads the one beside
  the golden file. Say if the plan wants it copied.
