# F10. Assignments: pick one, file it, run it

**Stage:** all of them. **Workflows shown:** whichever you choose below.

## Status: not built yet

None of these assignments exists in the repo today. There are no issue templates (`.github/ISSUE_TEMPLATE` is absent), no red tests under `tests/assignments/`, and no structural test that checks both exist. This page is the brief for each one. The paths below named "proposed" are where the red test should go, and you create it. Paths without that word exist now.

## Goal

Choose one assignment, file it as an issue, write its red test first, and make your factory turn it green. Pick the workflow from F8.

## Steps (the same for every assignment)

1. Check you can run the factory: `make doctor`, then `npx vitest run factory/engine`.
2. File the issue with the text in your assignment's section: `gh issue create --title "<title>" --body-file <file>`. Label it `factory:ready` (the label in `.factory/config.json`). `npx tsx factory/engine/main.ts --watch` lists what carries it.
3. Write the red test and run it. It must fail, and for the reason the issue names. A test that passes before any work proves nothing, which is what the `red` check in `factory/engine/checks/red.ts` refuses.
4. Run the workflow: `npx tsx factory/engine/main.ts <issue> --workflow=<name>`. The script reads the variable named in `keySource` of `.factory/config.yaml` and loads the key inside its own process, so keep the key off the command line. The run stops as `needs-human` with the reason `spend cap` once it has spent `spend.stopAt` of `spend.capUsd` in `.factory/config.json`.
5. Read `specs/<issue>/run.log`, `specs/<issue>/cost.json` and `.factory/runs/<issue>/metrics.json`. If the run ended `needs-human`, the log says which check capped out or that the spend cap did. If it ended `awaiting-approval`, the log says how many people the risk tier asks for.
6. Finish with `make check`, zero errors and zero warnings. Revert the fix once and watch your test fail again.

Each red test below is skipped by default in the finished design, as `make prove-homework` is for the take-home (`HOMEWORK=1`). Use an environment variable of your own, such as `ASSIGNMENT=1`, so `make check` stays green until you start.

## 1. A worksheet video with the HyperFrames timeline

- **Goal:** `shared/src/render.ts` already turns a worksheet into a HyperFrames still composition (its header comment says so), and `hyperframes` is a dependency in `package.json`. Add a timeline so a worksheet plays as a short video: items appear in order, the answer key last.
- **Workflow:** `ui-visual`.
- **Issue:** "Render a worksheet as a HyperFrames video. Acceptance: every item appears once, in page order; the answer key is the final scene; `hyperframes lint` passes on the output."
- **Red test (proposed `tests/assignments/worksheet-video.test.ts`):** render a fixture from `fixtures/worksheets.json` with the new function, assert the scene count equals the item count plus one for the key, and assert the key scene is last. It fails because the function does not exist.

## 2. Templates in a database

- **Goal:** `api/src/templates/template-store.ts` holds templates today. Replace its storage with a database after a spike on which one.
- **Workflow:** `spike` first, then `feature-sdd`.
- **Issue:** "Spike: which store for worksheet templates, and what it rules out. Then move `template-store` onto it." File the spike alone first and read its decision record before filing the build.
- **Red test (proposed `tests/assignments/template-db.test.ts`):** save a distilled template, build a second store object on the same database file, and assert the first template is found. It fails while the store is in memory only. Read `api/src/templates/template-store.test.ts` for the current contract it must keep.

## 3. A canary prompt with rollback when the eval drops

- **Goal:** serve a changed prompt to a small share of requests, compare its eval score to the current one, and roll back by itself when it drops.
- **Workflow:** `llm-eval`.
- **Issue:** "Canary for `api/src/agent/prompt.ts`. A candidate prompt takes a configured share of traffic. If its pass rate falls below the current prompt's by more than a stated margin, traffic returns to the current one and the event is logged."
- **Red test (proposed `tests/assignments/canary.test.ts`):** feed a pure decision function scores for a good and a worse candidate with a fixed seed, assert the share routed, and assert the worse one is rolled back. Test the decision with recorded scores so it spends no tokens. `make eval` is the live path (`api/src/eval.ts`) and shares the cap in `api/src/agent/live-cap.ts`.

## 4. Fuzzing the tool input

- **Goal:** the model's tool input is validated with zod at the boundary. Fuzz that boundary and find an input that gets through and breaks a page.
- **Workflow:** `security`.
- **Issue:** "Property-test the worksheet tool input. Any input the schema accepts must render and pass `checkBand`; any it rejects must be rejected with a generic error."
- **Red test (proposed `tests/assignments/fuzz-tool-input.test.ts`):** `fast-check` is already in `package.json`. Generate arbitrary objects against the schema in `shared/src`, and assert accepted ones render. It stays red until you find and fix a case, so plant one first (a mutant that accepts an empty item list) and show the test catches it.

## 5. The label state machine as a property

- **Goal:** the labels in `.factory/config.json` (`factory:ready`, `factory:planned`, `plan:approved`, `needs-human`, `factory:protected-ok`) form a state machine that `factory/run.ts` drives. State its rules and check them with generated sequences of events. TLA+ is the heavier option; a `fast-check` model-based test is enough.
- **Workflow:** `feature-atdd`.
- **Issue:** "Specify the label transitions. Invariants: a build never starts without `plan:approved`; a new plan always clears `plan:approved`; `needs-human` is never cleared by the factory."
- **Red test (proposed `tests/assignments/label-machine.test.ts`):** generate event sequences against the fake deps in `factory/fake-deps.ts` and assert the invariants. Existing single cases live in `factory/run.test.ts`; yours must cover sequences, not one path.

## 6. A new activity kind

- **Goal:** add a new kind of activity to a worksheet, for example a clock face.
- **Workflow:** `feature-bdd`.
- **Issue:** "Add the `clock` activity kind: the model supplies a time, the code draws the face. Acceptance: it renders in the bands that allow it and `checkBand` rejects it in the others."
- **Red test (proposed `tests/assignments/clock-activity.test.ts`):** `ACTIVITY_KINDS` in `shared/src/activity-kinds.ts` is the list, and `shared/src/render-activity.ts` draws each. Assert `clock` is in the list, renders markup, and that `.claude/rules/shared.md` is honoured: a new band needs a fixture and a passing `checkBand`.

## 7. A workflow from your own company

- **Goal:** encode how your team really ships one kind of change.
- **Workflow:** the one you write (see F8).
- **Issue:** "Add `.factory/workflows/<name>.yaml` for <task>. Acceptance: it names its method and source, uses only checks from `CHECK_NAMES`, and dry-runs."
- **Red test:** none to author. `factory/engine/workflows.test.ts` already runs every file in the folder, so the red state is your YAML failing it. Add one check of your own for the step that matters most, with a failing input first, following `factory/engine/checks/plan-drift.test.ts`.

## 8. A new review lens

- **Goal:** add a reviewer that hunts one kind of defect. `reviewRound` in `factory/engine/review.ts` takes a list of lens agents, runs them in parallel, and keeps a finding only when two of three verifiers vote yes. A lens runs only if a workflow's `review: { lenses: [...] }` names it, so the assignment ends with that edit.
- **Workflow:** `llm-eval`.
- **Issue:** "Add a `performance-reviewer` agent. It reads the diff and replies with a JSON array of findings with file, line, severity and evidence."
- **Red test (proposed `tests/assignments/review-lens.test.ts`):** copy the shape of `.claude/agents/security-reviewer.md`, then using the fake host in `factory/engine/fake-host.ts`, assert a one-vote finding is dropped, as `factory/engine/review.test.ts` does for existing lenses. Also feed a diff with a planted defect and assert the lens reports it with evidence.

## 9. An LLM-judge pre-commit hook

- **Goal:** the opt-in paid pattern. A hook asks a model to judge a staged change, and only runs when the person turns it on.
- **Workflow:** `feature-atdd`.
- **Issue:** "Add an opt-in judge hook. Default off. When `JUDGE=1`, it sends the staged diff to a small model and blocks the commit on a `blocking` verdict. It must never send a file the secrets hook would block."
- **Red test (proposed `tests/assignments/judge-hook.test.ts`):** export the decision as a pure function like the hooks in `.claude/hooks/`, and assert: off by default, blocks on a blocking verdict, passes on a clean one, and refuses to send a diff containing a secret. `tests/structure/hook-catalogue.test.ts` shows the shape, one hook fed one bad input.

## 10. A mod of your own

- **Goal:** build a small change to the Claude interface. `plugins/factory-status` is the working example in this repo.
- **Workflow:** `feature-atdd`.
- **Issue:** "Add a mod that shows <something about the run> above the prompt. Acceptance: `claude plugin validate` passes and a test feeds it a fixed state and checks what it draws."
- **Red test (proposed `tests/assignments/my-mod.test.ts`):** follow `tests/structure/plugin.test.ts` and `tests/structure/commands-and-mod.test.ts`. Assert your mod's manifest is valid and its render function turns a fixed state into the text you expect.

## 11. Two people at a high-risk gate

- **Goal:** `gateMet` in `factory/engine/interpret.ts` asks for two distinct approvers when the changed files are high risk, but `runIssue` in `factory/engine/cli.ts` passes one approver, the logged-in `gh` user. A high-risk gate can therefore never open in a real run. Let a repo name its approvers.
- **Workflow:** `feature-atdd`.
- **Issue:** "Read the approver logins from `.factory/config.yaml`. A high-risk gate opens with two of them; a medium one with one. The logged-in user is no longer assumed."
- **Failing test (proposed `tests/assignments/approvers.test.ts`):** extend the schema in `factory/engine/portable.ts` with an `approvers` list, then use `approvalIn` from `factory/engine/real-host.ts` with comments from two listed logins and assert two approvals pass a need of two, and one login commenting twice does not. `factory/engine/wiring.test.ts` already shows the tier side.

## 12. Count the review calls in the spend cap

- **Goal:** closed in the harness (`factory/engine/review-spend.test.ts`): `runReview` in `factory/engine/interpret.ts` counts every lens hunt, ballot and fix and gives each the remaining-budget ceiling. Use it as the worked example for a cap on another kind of call.
- **Workflow:** `feature-atdd`.
- **Issue:** "A review step adds every lens and verifier cost to the run total, checks the cap before each round, and stops with the reason `spend cap`."
- **Failing test (proposed `tests/assignments/review-spend.test.ts`):** with `fakeHost` from `factory/engine/fake-host.ts`, give every agent a `costUsd`, run a `review` step with a small `spend.capUsd`, and assert `cost.json` lists the review calls and the run stops with the reason. `factory/engine/models.test.ts` has the same shape for the other steps.

## 13. A model for every stage name

- **Goal:** a step whose stage name is in neither `stepStages` nor the stage list falls back to the middle model. The `docs` workflow names its build step `write`, so the `routes.docs.build` route to the cheap model never applies to it. Make an unmapped stage name fail a test instead of silently using the middle model.
- **Workflow:** `llm-eval`.
- **Issue:** "Every stage name in every workflow resolves to a config stage, or the workflow test fails."
- **Failing test (proposed `tests/assignments/stage-names.test.ts`):** load each file in `.factory/workflows/`, call `resolveModel` from `factory/engine/models.ts` for every step, and assert each stage name is a key of `stepStages` or one of `STAGE_NAMES`. It fails for `write` until you map it.

## Discussion

Which assignment would change what your team ships next month? Which red test would you be unable to write, and what does that say about the issue?
