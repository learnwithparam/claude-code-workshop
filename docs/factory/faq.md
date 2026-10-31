# Factory FAQ

Each answer starts from a failure someone hit, and points at the file or test that proves what the code does.

## The plan forgot a file. Why did the run stop?

The plan is an allowlist. `planDrift` in `factory/engine/artifacts.ts` fails any changed file that the plan does not list, apart from files under `specs/<issue>/` and regenerated snapshots. The `plan-drift` check turns that into evidence the loop can read: "files outside plan.md: ... Update plan.md in the same change."

The common miss is a new source file. Each file needs an owner in `levels.json`, so the plan must list `levels.json` too. The plan brief says so: it lives in `planBrief` of `.factory/config.yaml`, which `loadWorkflow` hands to any plan step with no brief of its own, and `factory/engine/workflows.test.ts` fails a workflow whose planner brief drops that sentence.

Proof: `factory/engine/checks/plan-drift.test.ts`, and "plan-drift fails on a stray file, even when plan.md is in the diff" in `factory/engine/engine.test.ts`.

## I relaunched the run and my approval no longer counted. Is that a bug?

No. An approval binds to a hash, not to an issue. `artifactDigest` in `factory/engine/artifacts.ts` hashes the stage and the files it was shown, one hash per file so a moved boundary changes the result. Edit the artifact and the old approval does not match.

A gate also counts people. At a `gate: human` step, `gateMet` classifies the changed files with `classify` in `factory/engine/risk.ts` and needs `Math.max(1, APPROVALS[tier])` distinct people: one for low and medium, two for high. An approval from an agent never counts, because only owner, member and collaborator comments from the listed approvers do. Today `runIssue` lists one approver, the logged-in `gh` user, so a high-risk gate waits for a second person the run cannot name (assignment 11 in F10).

The spec and plan gates sign only the documents written so far. The Spec Kit documents (constitution, clarify, tasks, analyze) join the hash only if they were written. Run 34 showed the other way: hashing the whole tree made every later stage void an earlier approval. On resume, `runWorkflow` in `factory/engine/interpret.ts` skips every step up to the last approved gate, so the signed artifacts are not regenerated.

In the older runner, posting a new plan clears the `plan:approved` label and never builds in that run.

Proof in `factory/engine/engine.test.ts`: "binds an approval to the artifact digest, so edited artifacts need a new one", "keeps a spec or plan approval valid after later stages change other files", and "on resume skips every step before the last approved gate". The label case is "clears a stale approval when it posts a new plan" in `factory/run.test.ts`.

## The runner could not call `gh`. Is something misconfigured?

By design. The gate runs the edited code with a throwaway `HOME`, `GIT_CONFIG_GLOBAL=/dev/null` and an empty `GH_CONFIG_DIR` (`scrubbedEnv` in `factory/stages.ts`), so code the agent wrote finds no credential to read. `.claude/settings.json` also denies `Bash(git push *)`.

So a stage cannot fetch its own issue. The runner fetches it and puts the text in the prompt, inside `<issue>` tags with a warning that it is untrusted data (`runIssue` in `factory/engine/cli.ts`). If a stage needs GitHub data, add it to the prompt in the runner. Do not hand a credential to the stage.

Proof: "puts the issue text in the prompt, since stages cannot reach GitHub" in `factory/run.test.ts`, and the escaping test in `tests/structure/factory-workflow.test.ts`.

## A test contradicts the ticket. Who is right?

The ticket, but the builder may not decide that. `lock` hashes the test files in runner state the agent cannot write, and `.claude/hooks/pretooluse-test-lock.mjs` blocks test edits in a fix phase with the message "Change the code until the test passes, or stop and say the test is wrong."

A person fixes a wrong test by hand. The plan may then list that older spec's golden test (the comment above `GATE_OWNED` in `factory/engine/artifacts.ts` says why), and `lock` still fails any later edit to it. Other golden files stay gate-owned.

Proof in `factory/engine/engine.test.ts`: "lets a plan list an older spec's golden test, which the lock check already protects", "still refuses golden snapshots and other golden files", and "lock catches an edited test".

## What stops a run from spending without limit?

These limits, none of them the model's judgment:

- A loop has `max` from 1 to 5, enforced by the schema in `factory/engine/workflow.ts`. At the cap the run ends as `needs-human` ("stops at the cap and writes run.log" in `factory/engine/engine.test.ts`).
- Each agent call has a ceiling: `maxBudgetUsd: o.maxUsdPerAgent ?? 3` in `factory/engine/real-host.ts`, plus `maxTurns` from the agent file. The older runner takes `maxBudgetUsd` and `maxTurns` per stage from `.factory/config.json`, and `npx tsx factory/main.ts <issue> --dry-run` prints them.
- The review loop stops after `reviewLoop.maxRounds` and labels the issue `needs-human` ("caps the review loop at maxRounds" in `factory/run.test.ts`).
- Live eval and smoke runs share one cap, `withinLiveCap` in `api/src/agent/live-cap.ts`.
- One engine run has a total cap. `spend.capUsd` and `spend.stopAt` in `.factory/config.json` end the run as `needs-human` with the reason `spend cap` once the cost reaches that share, and each call gets only the budget that remains ("spend cap" cases in `factory/engine/models.test.ts`). The engine writes `specs/<issue>/cost.json` as it goes.

The cap counts the agent calls the engine totals. The review lens and verifier calls are not added to that total (assignment 12 in F10). The older runner has no run total: `factory/cost-ledger.ts` reports its spend by stage and model, and `npx tsx factory/engine/main.ts --report` rolls up the saved `metrics.json` files.

## Why Sonnet and not Opus for build?

Because build is the longest stage and `.factory/config.json` prices it. The engine picks the model in `resolveModel` in `factory/engine/models.ts`: `stepStages` maps a step to a stage, then `routes[type][stage]` wins, then `stages[stage].model`. A step whose name maps to no stage gets Sonnet. Per million tokens Opus is $4 in and $20 out, Sonnet is $2 and $10. The `build` stage is Sonnet with 40 turns and a $3 budget. Opus appears where one plan shapes everything after it: `routes.epic.plan` and the `delivery` stage.

The ledger measures the choice instead of asserting it. `buildLedger` re-prices the same tokens at `baselineModel` (Opus) and reports `savedUsd`, so a run shows what an all-Opus run would have cost.

What the repo does not contain is a measured quality comparison between the two models on build. To test the choice, change `stages.build.model`, run the same issue twice and compare `metrics.json` and the check results.

Proof: "splits spend by stage and model and sums to the reported total" in `factory/cost-ledger.test.ts`, and `model: sonnet` in `.claude/agents/builder.md`.
