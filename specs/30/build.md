# Build: issue 30

Changed: `shared/src/render.ts`, `render-section.ts`, `render-answer-key.ts`; new `render-layout-css.ts`.
Tests beside each: `render-layout-css`, `render-section`, `render-answer-key`.
Golden snapshots in `specs/25/golden/__snapshots__` regenerated with `vitest -u`.

- Section = card (band theme tokens). Grid (`ol.grid`, 2 columns) only when the band has no picture boxes, 4+ items, every prompt <= 8 words and within the band limit.
- `#worksheet` height is now `min-height`, and `overflow: hidden` is gone.
- Print: `break-inside: avoid` on `li` and card headings, `break-after: avoid` on headings, `break-before: page` on `.key`. No items means no key.

Not verified here (sandbox): `make check` hits sandbox EPERM on a biome env-file read, astro telemetry, and the `real-host.test.ts` state dir. `visual`, 375px page scaling in `web/`, and the live smoke were not run.

## Fix after failed checks

- `visual`: the preview server needs `web/dist` (now built with `npm run build -w web`) and a local port. In this sandbox `listen EPERM` on 4321 stops it, and the unsandboxed retry was declined, so `visual` was **not** run here. Run `make check` outside the sandbox.
- `gate`: `levels.test.ts` timed out at 5s under full-suite load. It passes alone (1.2s), so it is a load flake, not a code fault. Not changed.
- Lint: 16 `noDescendingSpecificity` warnings were mine. Fixed in `render-layout-css.ts` (`li` break rule scoped to `section.card, section.key`; `section.key h2`). Snapshots regenerated. The only warning left is Biome's env-file read, blocked by the sandbox.
- `shared` and `specs` tests: 158 pass.

## Second round of failed checks: needs a human decision

- `visual` (`tests/e2e/layout.e2e.ts:32`, 7 fixtures): fails with `Expected: 1, Received: 2` pages. Every fixture has an answer key, and the issue's acceptance says the key starts on its own page (`break-before: page`). One page and a key on its own page cannot both hold. The test predates the issue.
- I did not edit the test. It is a gate file, and the test lock blocks edits to it during a fix. Loosening it is on the contract's reject list. Someone with authority should change the assertion to "worksheet body on page 1, key on page 2, no item split". Until then `make check` stays red on this.
- Not verified: that page 1 holds all the body content (the key spill is the only extra page). The probe could not run because tsx's IPC socket is blocked in the sandbox.
- `gate` (`tests/structure/levels.test.ts`): timed out at the default 5s under full-suite load. It takes 2.5s alone and passes. This is a load flake, not caused by this change. Not changed.
