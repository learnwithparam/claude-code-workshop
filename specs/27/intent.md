The gate is red, and I haven't fixed it. The failure isn't in anything I changed, and plan mode blocks edits and runs outside the plan file.

**What failed:** `tests/structure/levels.test.ts > owns every file exactly once` timed out at the default 5000 ms. It didn't fail on an assertion. The test matches every file from `git ls-files` against each glob in `levels.json`, which is slow. The run was also under load: 26 s total, 33 s collecting tests, and a `MaxListenersExceededWarning`. The "file not in workshop-2026-10" and worktree lines are other tests' output. They didn't fail the gate.

**Why I think it's unrelated:** this stage only wrote the contract markdown to the plan file. I touched no code or test. I haven't confirmed it by re-running the test, so the timeout being load-related is my reading, not a result.

**What I'd do once plan mode is off:**
1. Re-run `npx vitest run tests/structure/levels.test.ts` on its own. If it passes, the timeout was load.
2. If it still times out, fix the test. Either pass a timeout as the last argument to `it`, or precompile the globs once. The 5 s limit isn't ideal, and `specs/27/` plus the new `shared/src/` files add to the file list.
3. Check that the untracked `shared/src/band-theme*.ts`, `render-header-art*.ts` and `specs/27/*` files each match exactly one level in `levels.json`. If one matches none or two, the test fails on its assertion once the timeout is gone.

Please tell me whether to go ahead with that, or whether this stop-gate failure should be ignored for the contract stage.
