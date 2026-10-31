# F1 Plan: intent, triage and the risk tier

**Stage:** Plan. **Layers:** skills, boundary. **Workflows:** `feature-atdd`, `feature-sdd`, `deps`, `incident`, `security` and `ui-visual` open with an `intent` step; every workflow with a `plan` step ends the stage with `plan.md`.

## Goal

Turn a GitHub issue into decisions before any code exists: what outcome counts (`intent.md`), what kind of work it is (triage), and how much human approval it needs (the risk tier). By the end you can say which of the three is decided by a model and which by code.

## The pieces

**`intent.md`.** A short statement of the outcome and how you will know. In the workflows that have an `intent` step, `agent: planner` and `writes: intent.md`, and the brief says "State the outcome ... in a few lines. Reply with the intent only." The planner agent has `Read, Grep, Glob` and cannot write files, so the runner saves its reply as `specs/<n>/intent.md` (`factory/engine/interpret.ts`). A sigma breach can also start a run: `intentFor` in `factory/engine/bands.ts` writes an `intent.md` that says the metric is outside its band and asks for an eval so a repeat is caught.

**Triage.** The `issue-triage` skill (`.claude/skills/issue-triage/SKILL.md`) tells the model to read the issue as data, pick a TYPE (feature, enhancement, bug, epic or docs), a SIZE and a RISK, and end with `TYPE:`, `SIZE:`, `RISK:` and `DECISION: proceed|refuse`. `factory/run.ts` sends the same TYPE, SIZE, RISK and DECISION contract in its triage prompt, and `parseTriage` in `factory/route-ticket.ts` reads SIZE and RISK back. A missing or odd value becomes medium size and high risk, the costly case. `routeTicket` then picks the model: an epic or a high risk ticket gets the top plan model, docs or a small low-risk ticket gets the cheapest, everything else the middle one. A `refuse` posts the reply and stops.

Triage here picks a model and a refusal, not the workflow. The engine takes the workflow from the command line, `--workflow=<name>`. Matching a ticket to `bug-tdd` or `feature-bdd` is a human or orchestrator choice in this repo, and F8 returns to it.

**The risk tier.** `classify` in `factory/engine/risk.ts` takes the changed paths and returns `low`, `medium` or `high`. It looks only at paths, never at who wrote the diff, and the worst path wins:

- Anything under `.github/`, `.claude/`, `.factory/`, `factory/`, `scripts/`, plus `CLAUDE.md`, `AGENTS.md`, `REVIEW.md`, the Makefile, `package.json`, the lockfile and any `migrations/` folder is high. Markdown that steers an agent is high on purpose.
- A diff made only of `docs/` and `fixtures/` is low.
- The run's own files in `specs/<n>/` (`intent.md`, `spec.md`, `plan.md`, `run.log`, `review.json`, `lock.json`, `incident.md`) are ignored. Any other file there, such as a script, is classified normally.
- Everything else is medium, and an empty diff is medium.

`APPROVALS` maps the tier to human approvals: low 0, medium 1, high 2. `approvalsMet` counts only approvals of kind `human` on the current head commit, so an agent never counts and a push voids earlier approvals.

Be exact about what runs today. `classify` and `approvalsMet` are tested, and `release` in `factory/engine/deploy.ts` takes a `tier` argument and refuses production without the approvals. `interpret.ts` calls `classify` for the human gate and for a `deploy: production` step; the approvers are the issue's commenters who hold write, maintain or admin on the repo, never a bot (`approvers.ts`). The triage RISK and the path tier are different values: the first is the model's guess used to route models, the second is code over the diff used to gate approvals.

## Steps you run

1. Read `.claude/skills/issue-triage/SKILL.md`, then `parseTriage` and `routeTicket` in `factory/route-ticket.ts`.
2. Run `npx vitest run factory/route-ticket.test.ts` and read what each case routes to.
3. Compute a tier by hand: `npx tsx -e 'import {classify} from "./factory/engine/risk.ts"; console.log(classify([".github/workflows/ci.yml"]), classify(["docs/a.md"]), classify(["shared/src/bands.ts"]))'`. Expect `high low medium`.
4. File a small docs issue and read its plan without spending: `make factory ISSUE=<n> FLAGS=--dry-run` lists the stages, models and budgets.
5. For a real plan, label the issue `factory:ready` and run `npx tsx factory/engine/main.ts <n> --workflow=feature-atdd`. It needs `gh` signed in and an API key available to the api workspace, and it spends tokens against the per stage caps in `.factory/config.json`. It stops at the `spec` human gate. Read `specs/<n>/intent.md` and `specs/<n>/spec.md` before you approve.

## Proof that bites

Both tests are in `make check` through `npm test`. For triage, in `factory/route-ticket.ts` change the RISK fallback from `"high"` to `"low"` and run:

```
npx vitest run factory/route-ticket.test.ts
```

Expect `treats a missing SIZE or RISK as medium size and high risk` to fail with `expected { size: 'medium', risk: 'low' } to deeply equal { size: 'medium', risk: 'high' }`. For the tier, see the `.github/` change in F0: `factory/engine/review.test.ts` fails with `expected 'medium' to be 'high'`. Restore both files afterwards.

## See it on a real run

`specs/34/intent.md` is what an `intent` step actually returned for a workbook epic. It is not a three-line outcome. The agent reported that the gate was red because `shared/src/workbook-pdf.test.ts:34` needs headless Chromium, which was missing from the run's temporary home, and it said it had not installed a browser or skipped the test. That is a real failure shape: the stage can answer with a status report instead of the artifact. `feature-sdd` pins the `spec` step with `startsWith: "R1."` to refuse chat, and its `intent` step has no such pin.

`specs/36/intent.md` is the same step in a dependency run. It tabulates three packages with their locked and target versions and says the registry could not be reached, so publish dates and maintainers were not checked. Both files show what a reader gets before the human gate: evidence and its limits, in the artifact.

## Discussion

1. Triage fails closed to high risk. Which fallback would you choose for a field the model left out, and what does it cost on a busy day?
2. `scripts/` and `.claude/` are high even when only a comment changed. What would you gain and lose by classifying inside the file instead?
3. If the tier came from the model's RISK line instead of the paths, which diff would slip through?
