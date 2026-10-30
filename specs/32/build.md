# Build: issue 32, page strip and example picker

## Files

- `web/src/lib/example-prompts.ts` + test: zod-validated list of 5 constants (4 to 6, unique, non-blank).
- `web/src/lib/page-strip.ts` + test: pure slot model (`stripSlots`, `pageLabel`). Empty is `[]`, one page is one thumbnail, loading pads with skeleton slots, the active index is clamped.
- `web/src/pages/index.astro`: example picker and page strip.

## Decisions

- An example only fills the input, sets `aria-pressed`, and moves focus there. It never submits.
- Examples and Send are disabled while a generation streams.
- One page shows a single thumbnail, so the strip height stays stable when a second page arrives.
- Thumbnails are inert, scaled iframes of `renderWorksheet` output. The click target is a native `<button>` laid over each thumbnail, so there is no iframe inside a button. The active page has `aria-current="page"` and a "Viewing" tag in addition to the outline, so colour is not the only cue.
- The strip is a labelled `<nav>`, one row that scrolls inside its own box, with its height reserved. Print hides the strip and the picker.
- The removed `window.__examples` script and fixture-swap buttons are replaced by the picker.

## Verification

- `npm run typecheck`: 0 errors, 0 warnings. `npm run build -w web` succeeds.
- `biome ci web/src shared`: clean. `vitest run web/src/lib`: 14 tests pass.
- `tests/structure/levels.test.ts` passes alone in about 3.6 s. The gate failure was the 5 s default timeout under load, not a change in this diff.
- `visual` failed because `astro preview` could not bind: `listen EPERM ::1:4321`. This sandbox blocks local port binding. It is not a page error. `visual` at 375 and 1280 has not been run.
- Next: set `sandbox.network.allowLocalBinding: true`, or run `make check` outside the sandbox, then confirm `visual`.
