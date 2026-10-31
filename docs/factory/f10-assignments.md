# F10. Assignments: pick one, file it, run it

**Stage:** all of them. **Workflows shown:** whichever you choose below.

## What exists

Each assignment below has an issue template in `.github/ISSUE_TEMPLATE/` and a red test in `tests/assignments/`. Every red test is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start. `tests/structure/assignments.test.ts` checks that every section on this page names a template and a test that exist, that the template carries the `assignment` label, and that the test is gated on `ASSIGNMENT`.

Each red test imports the module you will write by a dynamic path, so it fails on a missing module until you create it, then on behaviour until you get it right. Because they are skipped, CI has never run them red. Run yours red first, as step 3 says.

## Goal

Choose one assignment, file it as an issue, write its red test first, and make your factory turn it green. Pick the workflow from F8.

## Steps (the same for every assignment)

1. Check you can run the factory: `make doctor`, then `npx vitest run factory/engine`.
2. File the issue from the template: `gh issue create --template assignment-<name>.md`, or pick it in the web form. Add the `factory:ready` label (the label in `.factory/config.json`) when you want the factory to take it. `npx tsx factory/engine/main.ts --watch` lists what carries it.
3. Run the red test with `ASSIGNMENT=1` and read the failure. It must fail for the reason the issue names. A test that passes before any work proves nothing, which is what the `red` check in `factory/engine/checks/red.ts` refuses.
4. Run the workflow: `npx tsx factory/engine/main.ts <issue> --workflow=<name>`. The script reads the variable named in `keySource` of `.factory/config.yaml` and loads the key inside its own process, so keep the key off the command line. The run stops as `needs-human` with the reason `spend cap` once it has spent `spend.stopAt` of `spend.capUsd` in `.factory/config.json`.
5. Read `specs/<issue>/run.log`, `specs/<issue>/cost.json` and `.factory/runs/<issue>/metrics.json`. If the run ended `needs-human`, the log says which check capped out or that the spend cap did. If it ended `awaiting-approval`, the log says how many people the risk tier asks for.
6. Finish with `make check`, zero errors and zero warnings. Revert the fix once and watch your test fail again.

Each red test is skipped by default, as `make prove-homework` is for the take-home (`HOMEWORK=1`). Run one with `ASSIGNMENT=1 npx vitest run tests/assignments/<file>`.

## 1. A worksheet video with the HyperFrames timeline

- **Issue template:** `.github/ISSUE_TEMPLATE/assignment-worksheet-video.md`
- **Red test:** `tests/assignments/worksheet-video.test.ts`
- **Workflow:** `ui-visual`.
- **Goal:** `shared/src/render.ts` turns a worksheet into a HyperFrames still composition, and `hyperframes` is a dependency in `package.json`. Add `renderWorksheetVideo` in `shared/src/render-video.ts` so a worksheet plays as a short video: items appear in order, the answer key last.
- **What the test asserts:** it renders the first worksheet in `fixtures/worksheets.json` and counts `data-scene` elements. There must be one per item plus one for the key, and the last one is `answer-key`. It fails because `shared/src/render-video.ts` does not exist. The `hyperframes lint` pass is in the issue, and you run it by hand.

## 2. Templates in a database

- **Issue template:** `.github/ISSUE_TEMPLATE/assignment-template-db.md`
- **Red test:** `tests/assignments/template-db.test.ts`
- **Workflow:** `spike` first, then `feature-sdd`.
- **Goal:** `api/src/templates/template-store.ts` keeps templates in a `Map`. Replace its storage with a database after a spike on which one. File the spike alone first and read its decision record before filing the build.
- **What the test asserts:** `createDbTemplateStore(file)` in `api/src/templates/db-template-store.ts` has the same `add`, `size` and `find` as the in-memory store. A second store on the same file finds what the first saved, and adding a template twice keeps one. It fails while the module is missing. `api/src/templates/template-store.test.ts` is the contract it must keep.

## 3. A canary prompt with rollback when the eval drops

- **Issue template:** `.github/ISSUE_TEMPLATE/assignment-canary.md`
- **Red test:** `tests/assignments/canary.test.ts`
- **Workflow:** `llm-eval`.
- **Goal:** serve a changed prompt from `api/src/agent/prompt.ts` to a small share of requests, compare its eval score to the current one, and roll back by itself when it drops.
- **What the test asserts:** in `api/src/agent/canary.ts`, `routePrompt(requestId, share)` is deterministic and lands near the share over 2000 ids, `decideCanary` returns `keep` for equal scores and `rollback` past the margin, and a share of 0 sends every request to the current prompt. It tests the decision with recorded scores, so it spends no tokens. `make eval` is the live path (`api/src/eval.ts`) and shares the cap in `api/src/agent/live-cap.ts`.

## 4. Fuzzing the tool input

- **Issue template:** `.github/ISSUE_TEMPLATE/assignment-fuzz-tool-input.md`
- **Red test:** `tests/assignments/fuzz-tool-input.test.ts`
- **Workflow:** `security`.
- **Goal:** the model's tool input is validated with zod (`worksheetSchema` in `shared/src/schema.ts`) before it renders. Fuzz that boundary and find an input that gets through and breaks a page.
- **What the test asserts:** you write the generator `arbWorksheet` in `shared/src/arb-worksheet.ts` with `fast-check`, which is already in `package.json`. The test checks that every worksheet the schema accepts renders with markup in a text field not reaching the page raw, and that `checkBand` reports problems instead of throwing. The generator is your work, so the test is red until it exists. Then plant a mutant (remove an escaping step) and show the property fails on it.

## 5. The label state machine as a property

- **Issue template:** `.github/ISSUE_TEMPLATE/assignment-label-machine.md`
- **Red test:** `tests/assignments/label-machine.test.ts`
- **Workflow:** `feature-atdd`.
- **Goal:** the labels in `.factory/config.json` (`factory:ready`, `factory:planned`, `plan:approved`, `needs-human`, `factory:protected-ok`) form a state machine that `factory/run.ts` drives. State its rules in `factory/label-machine.ts` as `applyEvent(labels, event)` and `canBuild(labels)`, and check them with generated event sequences. TLA+ is the heavier option; a `fast-check` model-based test is enough.
- **What the test asserts:** over sequences of `plan-written`, `human-approved`, `build-requested`, `stuck` and `retry`, a build is never possible without `plan:approved`, a new plan always clears `plan:approved`, and `needs-human` is cleared only by `human-approved`. `factory/run.test.ts` has the single cases. Yours must cover sequences, and your model should agree with `factory/run.ts`.

## 6. A new activity kind

- **Issue template:** `.github/ISSUE_TEMPLATE/assignment-clock-activity.md`
- **Red test:** `tests/assignments/clock-activity.test.ts`
- **Workflow:** `feature-bdd`.
- **Goal:** add a new kind of activity to a worksheet, for example a clock face. `ACTIVITY_KINDS` and `activitySchema` live in `shared/src/activity-kinds.ts`, `renderActivity` in `shared/src/render-activity.ts`, and each band lists the kinds it allows in `shared/src/bands.ts`.
- **What the test asserts:** `clock` is in `ACTIVITY_KINDS`, the schema accepts `{ kind: "clock", items: [{ hour, minute }] }`, `renderActivity` returns an SVG with no script, and `checkBand` passes in the bands that list `clock` and fails in the others. It requires at least one of each, so choose the bands on purpose.

## 7. A workflow from your own company

- **Issue template:** `.github/ISSUE_TEMPLATE/assignment-own-workflow.md`
- **Red test:** `tests/assignments/own-workflow.test.ts`
- **Workflow:** the one you write (see F8).
- **Goal:** encode how your team really ships one kind of change.
- **What the test asserts:** run it with `WORKFLOW=<name>`. The file `.factory/workflows/<name>.yaml` exists, starts with `# Method:`, loads, and has a step with at least one check. It fails until the file exists. `factory/engine/workflows.test.ts` already runs every file in the folder, so add one check of your own for the step that matters most, with a failing input first, following `factory/engine/checks/plan-drift.test.ts`.

## 8. A new review lens

- **Issue template:** `.github/ISSUE_TEMPLATE/assignment-review-lens.md`
- **Red test:** `tests/assignments/review-lens.test.ts`
- **Workflow:** `llm-eval`.
- **Goal:** add a reviewer that hunts one kind of defect. `reviewRound` in `factory/engine/review.ts` takes a list of lens agents, runs them in parallel, and keeps a finding only when two of three verifiers vote yes. A lens runs only if a workflow's `review: { lenses: [...] }` names it, so the assignment ends with that edit.
- **What the test asserts:** `.claude/agents/performance-reviewer.md` exists with `tools: Read, Grep, Glob` and a `VERDICT:` line, like `.claude/agents/security-reviewer.md`. With the fake host in `factory/engine/fake-host.ts`, a finding that one voter confirms is dropped. At least one workflow names the lens.

## 9. An LLM-judge pre-commit hook

- **Issue template:** `.github/ISSUE_TEMPLATE/assignment-judge-hook.md`
- **Red test:** `tests/assignments/judge-hook.test.ts`
- **Workflow:** `feature-atdd`.
- **Goal:** the opt-in paid pattern. A hook asks a model to judge a staged change, and only runs when the person turns it on.
- **What the test asserts:** `.claude/hooks/pretooluse-judge.mjs` exports three pure functions, like the hooks in `.claude/hooks/`. `shouldJudge(env)` is false unless `JUDGE=1`. `decide(verdict)` blocks on `blocking` and passes `clean`. `diffToSend(diff)` returns null for a diff that `blocks` from `.claude/hooks/pretooluse-secrets.mjs` would block. `tests/structure/hook-catalogue.test.ts` shows the shape, one hook fed one bad input.

## 10. A mod of your own

- **Issue template:** `.github/ISSUE_TEMPLATE/assignment-my-mod.md`
- **Red test:** `tests/assignments/my-mod.test.ts`
- **Workflow:** `feature-atdd`.
- **Goal:** build a small change to the Claude interface. `plugins/factory-status` is the working example in this repo.
- **What the test asserts:** run it with `MOD=<folder>`. `plugins/<folder>` has `.claude-plugin/plugin.json` (its `name` is the folder), `hooks/hooks.json`, `hooks/register.tsx` and `hooks/register.test.tsx`. Vitest cannot run that last file, because `vitest.config.ts` excludes `plugins/*/hooks/**`. Run it with `claude plugin test`, and validate with `claude plugin validate`. `tests/structure/plugin.test.ts` and `tests/structure/commands-and-mod.test.ts` show the checks for the example.

## 11. Two people at a high-risk gate

- **Issue template:** `.github/ISSUE_TEMPLATE/assignment-approvers.md`
- **Red test:** `tests/assignments/approvers.test.ts`
- **Workflow:** `feature-atdd`.
- **Goal:** `gateMet` in `factory/engine/interpret.ts` asks for as many approvals as the risk tier needs, and `approvalIn` in `factory/engine/real-host.ts` already counts distinct listed logins. But `runIssue` in `factory/engine/cli.ts` passes one approver, the logged-in `gh` user, so a high-risk gate can never open in a real run. Let a repo name its approvers.
- **What the test asserts:** `portableSchema` in `factory/engine/portable.ts` has an `approvers` key, `approvalIn` accepts two listed logins for a need of two and refuses one login twice or an unlisted one, and `cli.ts` no longer reads the user from `gh api user`. The second check passes today; the first and third are red. `factory/engine/wiring.test.ts` shows the tier side.

## 12. A model for every stage name

- **Issue template:** `.github/ISSUE_TEMPLATE/assignment-stage-names.md`
- **Red test:** `tests/assignments/stage-names.test.ts`
- **Workflow:** `llm-eval`.
- **Goal:** a step whose stage name is in neither `stepStages` nor `STAGE_NAMES` falls back to the agent's frontmatter model. The `docs` workflow's `write` step is already mapped (`factory/engine/docs-routing.test.ts`), but names such as `analyze` and `characterize` are not. Make an unmapped stage name fail a test instead of silently using the fallback.
- **What the test asserts:** it loads every file in `.factory/workflows/` and lists each stage name that is neither a key of `stepStages` in `.factory/config.json` nor in `STAGE_NAMES`. The list must be empty, so it is red for the names still unmapped. A second check resolves each step through `resolveModel` in `factory/engine/models.ts` to a model in `allowedModels`.

## Worked example: review calls in the spend cap

`runReview` in `factory/engine/interpret.ts` counts every lens hunt, ballot and fix toward the run total and gives each the remaining-budget ceiling. `factory/engine/review-spend.test.ts` pins it. Read it before you cap another kind of call.

## Discussion

Which assignment would change what your team ships next month? Which red test would you be unable to write, and what does that say about the issue?
