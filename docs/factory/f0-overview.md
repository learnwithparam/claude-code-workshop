# F0 Overview: from a ticket to a merged pull request

**Stage:** the whole path. **Layers:** all of them. **Workflows:** every file in `.factory/workflows/`.

## Goal

Say in one page what the factory does, which parts are code and which are a model, and how it compares with the two public descriptions of an agentic software factory. By the end you can name the artifact each stage leaves behind and the check that decides whether the next stage may start.

## The path

A ticket moves through stages. Each stage commits one artifact under `specs/<n>/` and the next stage reads only what was committed, so the commit history is the audit trail.

| Stage    | Artifact                          | What decides "next"                    |
| -------- | --------------------------------- | -------------------------------------- |
| Plan     | `intent.md`, `spec.md`, `plan.md` | a human gate, and `plan-drift` later   |
| Build    | tests, then the diff, `lock.json` | `red`, `lock`, `green`, `acceptance`   |
| Test     | more tests, mutants               | `mutation`, `properties`, `holdout`    |
| Review   | `review.json`                     | lenses, then verifiers that vote       |
| Deploy   | the pull request, CI              | `ci`, risk tier approvals              |
| Maintain | `incident.md`, a new `intent.md`  | sigma bands from `.factory/bands.yaml` |

The names come from `ARTIFACTS` in `factory/engine/artifacts.ts` and `CHECK_NAMES` in `factory/engine/workflow.ts`. A workflow is a YAML file. `factory/engine/interpret.ts` runs its steps in order, repeats a step while its loop checks fail up to a cap, stops early as `needs-human` with the reason "test contradicts ticket" when two rounds in a row fail the same check with the same evidence (`sameFailure` on the loop), and writes `run.log` when the run finishes or stops at a gate or a cap.

## What is code and what is a model

A model writes `intent.md`, `spec.md`, `plan.md`, the tests and the fix. Code decides everything that gates them:

- `red` runs the new tests on the base commit and fails if they pass.
- `lock` hashes every test file in state the agent cannot write.
- `plan-drift` fails a diff that touches a file `plan.md` does not list.
- `review.ts` keeps a finding only when at least two of its verifiers vote for it.
- `risk.ts` turns changed paths into a tier, and an agent's approval never counts.
- `bands.ts` turns a metric breach into an action with no model involved.

The rule behind the list: a gate reads an exit code or a hash, never the model's word that it is done.

## Public factories, compared

The workshop is built from published descriptions. This table says where each idea lands here and where this repo does less.

| Idea     | Anthropic AI-native SDLC playbook and review post                                | OpenAI software factory (Pragmatic Engineer write-up)                    | This repo                                                                         |
| -------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Start    | an `intent.md` per stage, committed                                              | an outcome, then context                                                 | `intent.md` from the `intent` step, or from a sigma breach                        |
| Verify   | tests first, hooks that block test edits during a fix, evals gate prompt changes | CI is watched until it is green                                          | `red` and `lock`, `.claude/hooks/pretooluse-test-lock.mjs`, the `ci` check        |
| Review   | layered review, parallel hunters, agents that vote on each finding               | specialist reviewers                                                     | `factory/engine/review.ts`, `REVIEW.md`                                           |
| Deploy   | autonomy tiered by environment, hooks as approval gates                          | an agent assists the deploy after a human approves                       | `factory/engine/deploy.ts`: production refuses without the tier's human approvals |
| Risk     | the tier comes from the change, not the author                                   | risk classification picks the path                                       | `classify` in `factory/engine/risk.ts`                                            |
| Maintain | sigma bands turn a breach into a new intent                                      | observe, feed regressions back, an incident bot that acts only when told | `.factory/bands.yaml`, `detect` and `actionFor` in `factory/engine/bands.ts`      |

This repo has no deploy target of its own: `release` calls `make deploy ENV=...`, and the Makefile here does not define that target. Treat F6 as a pattern to copy, not a pipeline that ships this app.

## The Founder's playbook

Anthropic also publishes a Founder's playbook. Its page holds only a table of contents (Idea, MVP, Launch, Scale); the body is a long PDF. Nothing in this workshop is built from it. This is the only mention: the factory here starts after the idea is already a ticket.

## Steps you run

1. Read the comment line above `name:` in `.factory/workflows/bug-tdd.yaml` and `.factory/workflows/feature-sdd.yaml`. Each names its method and source.
2. List the workflows: `ls .factory/workflows`.
3. Print the stages the legacy runner would run, with no spend: `make factory ISSUE=1 FLAGS=--dry-run`. It reads `.factory/config.json` and prints model, turns and budget per stage.
4. Run the engine's offline tests, which run every workflow against a fake host: `npx vitest run factory/engine`.
5. With `gh` signed in, `npx tsx factory/engine/main.ts --watch` lists issues labelled `factory:ready`. `npx tsx factory/engine/main.ts --report` rolls up saved `metrics.json` files and needs a `.factory/runs` folder from an earlier run.

A real run is `npx tsx factory/engine/main.ts <issue> --workflow=<name>`. It needs `gh` and the API key file the api workspace holds, and it spends tokens, so read F1 first.

## Proof that bites

`factory/engine/review.test.ts` holds the risk and review rules. Open `factory/engine/risk.ts`, change the first HIGH pattern `/^\.github\//` to one that never matches, and run:

```
npx vitest run factory/engine/review.test.ts
```

Expect `risk > is high for a CI workflow and low for docs` to fail with `expected 'medium' to be 'high'`. Restore the pattern and it passes. The test is wired into `make check` through `npm test`.

## See it on a real run

`specs/26/` is a bug run through `bug-tdd`. `specs/26/golden/font-face.golden.test.ts` is the test written to fail first, `specs/26/lock.json` is the hash of every test file at that point, `specs/26/fix.md` is the fix stage's note, and `specs/26/plan.md` is the allowlist the diff was held to.

`run.log` is the file the engine writes last, but `.gitignore` excludes `*.log`, so none is committed here. `specs/35/ci.md` quotes one line from its run's log: `check plan-drift FAIL: files outside plan.md: api/src/agent/template-eval.ts`. That is `plan-drift` stopping a run, and `ci.md` records that the path was then listed in `plan.md`.

## Discussion

1. Which stage in your team's flow commits nothing the next stage can read, and what would you commit?
2. The OpenAI description has an agent assist the deploy after a human approves. Where in `deploy.ts` is the approval, and what would you add before you let an agent run `make deploy`?
3. Which gate here would you most want to turn off under deadline, and what does its failing test say you would lose?
