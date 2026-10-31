# F3 Build: explore, plan, code inside a fence

**Stage:** build. **Layers:** execution and delivery. **Workflows:** every one of them has a `plan` step; the build step differs (`feature-atdd`, `bug-tdd`, `refactor`, `ui-visual`).

## Goal

Let a builder change code with the smallest reach. The plan lists the files, the builder works in an isolated worktree with limited tools, and a check fails the run if the diff leaves the plan.

## Explore, plan, code

The order comes from Anthropic's Claude Code best practices: explore first, plan second, code third, then commit. The factory splits those into agents with different powers.

| agent      | tools (from `.claude/agents/`)                                                              | job                                               |
| ---------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `planner`  | `Read, Grep, Glob`                                                                          | read the repo and the ticket, reply with the plan |
| `builder`  | `Read, Edit, Write, Bash, Grep, Glob`, `isolation: worktree`, `permissionMode: acceptEdits` | change the files the plan lists                   |
| `verifier` | `Read, Grep, Glob, Bash`, `permissionMode: plan`                                            | run the gate, change nothing                      |

The planner cannot write. In the workflow the `plan` step has `writes: plan.md`, and the runner saves the reply as `specs/<n>/plan.md`. A reply that is prose instead of paths is refused with the reason and the planner tries again.

## plan.md is an allowlist

`plan.md` is one repo path per line (a bullet or backticks are fine). `badPlanLines` in `factory/engine/artifacts.ts` refuses a plan line that is not an ordinary repo path:

- globs, absolute paths and `..` segments;
- anything under `.github`, `.claude`, `.factory`, `factory` or `scripts`, plus `package.json`, lockfiles, `biome.json`, `vitest` and `tsconfig` files, and any glob in `protected` of `.factory/config.yaml`. Only a workflow with `manifests: true` (the `deps` one) may list `package.json` and the lockfile;
- lines under `specs/<n>/`, which the runner drops because it always allows them.

Two plans to read, from the real runs: `specs/25/plan.md` lists the split of `render.ts` plus `levels.json`; `specs/31/plan.md` lists both sides of the SSE contract and `tests/contract/`.

Why `levels.json` shows up: a new source file needs an owner there, so a plan that adds a file must list it. The plan brief says so. It is written once, as `planBrief` in `.factory/config.yaml`, and `loadWorkflow` gives it to every plan step that sets none of its own. `workflows.test.ts` asserts every plan brief contains that sentence.

## Plan drift

`plan-drift` is a small check. It reads `plan.md`, asks the host for the changed files, and fails when a changed file is not listed.

```
plan-drift fails: files outside plan.md: api/src/agent/template-eval.ts. Update plan.md in the same change.
```

- A missing `plan.md` is a failed check, not a crash, so the loop can act on it.
- Editing `plan.md` is not itself a pass: the plan file is in every diff, so the check reads the listed paths and not the file's own change.
- Regenerated golden snapshots under `specs/<n>/golden/__snapshots__/` pass, because a human reviews them at the feedback gate.

## Worktrees

Two kinds, both real.

- `builder.md` sets `isolation: worktree`, so an agent run happens in its own checkout and the main tree stays clean.
- The `red` check runs the new tests against the base commit. `real-host.ts` adds a detached `git worktree` at the base inside the repo (`.factory-base/`, gitignored), copies the `specs` files into it, runs the command, then removes the worktree.

## The builder's fence

The builder is limited by files the runner does not let it edit.

| fence               | where                                    | what it stops                                                                                                      |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `FACTORY_PHASE=fix` | `.claude/hooks/pretooluse-test-lock.mjs` | an edit to any test file (`.test.ts`, `.e2e.ts`, `.feature`, `tests/`) in a fix step; exit 2                       |
| `lock` check        | `factory/engine/checks/lock.ts`          | a test edited by another route, such as `Bash`                                                                     |
| deny rules          | `.claude/settings.json`                  | reading `.env*` and `.factory/holdout/**`, and `git push *`                                                        |
| sandbox             | `.claude/settings.json`                  | `denyRead` on the same two paths                                                                                   |
| plan                | `plan-drift`                             | any file outside the plan                                                                                          |
| pinned commands     | `.factory/config.yaml`                   | a build that edits the gate or test commands; the file is read once, before the first agent                        |
| run spend cap       | `.factory/config.json` `spend`           | a run that keeps calling the builder: it stops at `stopAt` of `capUsd`, and each call gets only what is left (F13) |

A step with `phase: fix` runs with the test lock on from round one. Any retry of a step runs with it on too (`interpret.ts`).

## Visual iteration

For a UI change, `ui-visual.yaml` has the builder work against checks `visual` and `gate`, looping up to a cap. The `visual` check runs `playwright test tests/e2e`. See F4 for what those tests assert. A design contract is the first step, so the builder has words to compare a screenshot against.

## The pinned config

`pinPortable()` in `factory/engine/portable.ts` reads `.factory/config.yaml` and keeps the result. The CLI calls it before the first agent runs, and the checks read the cached copy, so the builder cannot change what `make check` means by editing the file. The test `keeps the commands it read at the start when the file changes later` in `factory/engine/models.test.ts` rewrites the file after pinning and asserts the gate command is unchanged. The same file names the key variable and the file that may define it, and holds no key.

## Steps

1. Read `planBrief` in `.factory/config.yaml`, which `bug-tdd.yaml` uses because its `plan` step sets no brief, and the three agent files above.
2. See the fence refuse an edit:

   ```
   echo '{"tool_input":{"file_path":"api/src/a.test.ts"}}' | FACTORY_PHASE=fix node .claude/hooks/pretooluse-test-lock.mjs; echo $?
   ```

   It prints the refusal and exits 2. Run it again with `FACTORY_PHASE` unset and it exits 0.
3. Run the plan and drift tests.

   ```
   npx vitest run factory/engine/checks/plan-drift.test.ts factory/engine/engine.test.ts
   ```
4. Read `specs/25/plan.md`, then `specs/25/refactor.md`. Every file named in the second is in the first.

## Proof that bites

`factory/engine/engine.test.ts` has the case "plan-drift fails on a stray file, even when plan.md is in the diff". It asserts `planDrift("a.ts", ["a.ts", "b.ts"], 1)` returns `["b.ts"]`. To see it fail, change `!listed.has(f)` in `planDrift` to `false` and run the file; the stray file now passes, and the test turns red. Revert it.

`tests/structure/review-and-test-lock.test.ts` pins the hook: a test edit is blocked in a fix and allowed elsewhere, and the hook is wired in `settings.json`.

## See it on a real run

- Spec 35: `specs/35/build.md` records four updates. The last one says plan drift was fixed: `plan.md` had lost its file list and never named `api/src/agent/template-eval.ts`. `specs/35/ci.md` quotes the failing line, `check plan-drift FAIL: files outside plan.md: api/src/agent/template-eval.ts`. The `run.log` it quotes is gitignored, so only the notes are in the repo.
- Spec 25, the refactor: `specs/25/refactor.md` lists the four functions moved out of `render.ts`, with bodies unchanged, and says the golden tests and snapshots were untouched.
- Spec 26, the bug: `specs/26/fix.md` is the smallest change that made the locked test pass.

## Exercise

Track A: add a stray file to a scratch branch's diff and watch `plan-drift` name it, then add the path to `plan.md` and watch it pass.

Track B: the builder has `Bash`, and the test lock hook matches only `Edit|Write|MultiEdit|NotebookEdit`. Name the check that still catches a test changed by `sed -i`, and write the test that proves it.

## Discussion

1. The plan is written by a model and used as an allowlist. What stops it from listing everything, and what would you add?
2. A fix needs a file the plan did not list. Who should be allowed to grow the plan, and when?
3. `isolation: worktree` protects your tree from the builder. What does it not protect you from?
