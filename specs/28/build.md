# Build 28

Added `shared/src/activity-kinds.ts` and `render-activity.ts`, per-band `kinds`, the kind check in `checkBand`, optional `items`/`activity` on sections, `features/activity-kinds.feature`, and `features/**` in levels.json.

Golden tests pass (29). Red and not from this change: `factory/engine/real-host.test.ts`, biome format of `specs/28/lock.json`, and `api/.env` / `astro check`, which the sandbox blocks.

## Holdout check

`.factory/holdout/28` does not exist in this worktree and the sandbox hides `.factory/holdout`, so vitest found no files. That is a missing input for the harness, not a code failure. I did not create holdout tests. Re-run the holdout check once the harness has put them there.
Re-run in this stage: golden plus `shared/` tests pass (39).

## Re-run after the golden tests changed

The updated golden test wants a single `_` to be the blank. `shared/src/render-activity.ts` split on `___`, so the fill-blank scenario failed. It now splits on `/_+/`. Golden plus `shared/` tests pass (75) and biome is clean on `shared/`. I did not run the full `make check`.
