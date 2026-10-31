# Fix: template id boundary (issue 37)

- `api/src/templates/template-id.ts`: `templateIdSchema`, an allowlist `[A-Za-z0-9_-]{1,100}`. Not hex-only: specs/35 requires a well-formed unknown id (`does-not-exist`) to stay a 404.
- `api/src/server.ts`: `goodSchema.sheetId` now uses it, so a bad id gets the generic 400 before any lookup.
- No `templates/<id>.json` path join exists in `api/` today; any future one must take its id from this schema.
- Tests: the golden `specs/37/golden/template-id.golden.test.ts` was not edited. It failed on the old schema (404) and passes now.

## Gate

Vitest (31 tests) passes. The api typecheck output only a sandbox EPERM on `api/.env.example`, not a type error. `make check` stops at lint: biome flags the formatting of `specs/37/lock.json` (not edited here), and biome also hit the EPERM. The remaining gate steps (build, e2e, prove) did not run.
