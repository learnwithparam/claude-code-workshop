# F12. Model routing: the right model for each stage

**Stage:** plan, build, review, verify. **Layer:** execution, priced. **Prerequisite:** F8 (workflows) and the cost ledger described in the FAQ.

## Goal

Send mechanical stages to the cheap model, building to the middle model and epic planning to the strongest one, see why an agent file alone cannot do that, and measure the mix from `cost.json`.

## The rule of thumb

Spend the strongest model where one mistake is expensive and few tokens are used. Spend the cheapest where the step is mechanical and many tokens are used.

| Stage                      | Why                                              | Model tier |
| -------------------------- | ------------------------------------------------ | ---------- |
| triage, verify, adr, retro | read, classify, run a command, summarise         | low        |
| build                      | the longest stage, so the one that sets the bill | mid        |
| review                     | a second pair of eyes on a diff                  | mid        |
| plan for an epic, delivery | one plan shapes every sub-issue after it         | high       |

The repo already says this in `.factory/config.json`: triage, verify, adr and retro are Haiku 5.5, plan, build and review are Sonnet 5.5, and `delivery` is Opus 5.5. Prices are in the same file, in dollars per million tokens, and the model names are the three in `allowedModels`.

## Two places a model gets chosen

This repo has two runners, and they route differently. Know which one you are in.

**The config runner** (`factory/main.ts`, `factory/run.ts`). `stageFor` in `factory/config.ts` takes the stage's model from `.factory/config.json`, then lets `routes.<type>.<stage>` override it. After triage, `routeTicket` in `factory/route-ticket.ts` can move plan and build by size and risk:

- an epic, or any high-risk ticket, plans on `tiers.high` and builds on `tiers.mid`;
- a docs ticket, or a small low-risk one, plans and builds on `tiers.low`;
- everything else plans and builds on `tiers.mid`.

A missing or odd triage value counts as the costly case: `parseTriage` falls back to risk `high`. A stage that reports a model outside `allowedModels` throws, so a typo in a route cannot spend on a model you did not price.

**The workflow engine** (`factory/engine/`). `real-host.ts` reads the agent's frontmatter and maps `opus`, `sonnet` or `haiku` to a model id. That is the only place the engine chooses a model.

## Why frontmatter alone piles one model everywhere

An agent file names one model, and a workflow step names an agent, not a stage. Read what that does in this repo:

- `planner`, `builder`, `reviewer`, `design-reviewer`, `security-reviewer` and `test-reviewer` all say `model: sonnet`. Only `verifier` says `model: haiku`. No agent says `opus`.
- Every workflow in `.factory/workflows/` reuses `planner` for its plan step and `builder` for its build step. So a one-line typo fix and a large feature plan on the same model.
- `real-host.ts` passes `maxBudgetUsd: o.maxUsdPerAgent ?? 3` to every agent call, whatever the agent. The per-stage budgets in `config.json` do not reach it.
- The engine ignores `config.json` routes and tiers. A ticket's type, size and risk change nothing about the model.

You could add `planner-opus.md` and `planner-haiku.md` and point workflows at them. That multiplies agent files, and the choice is still made by whoever wrote the YAML, before the ticket exists. Routing belongs where triage has already said what the ticket is.

An engine change to route models from `.factory/config.json` is in flight. Until it lands, treat this module as: the config runner routes, the engine does not. Do not tell a learner the engine honours `routes`. Check `factory/engine/real-host.ts` for `stageFor` or `routeTicket` before you teach otherwise.

## Steps

### 1. See the routes the config runner would use

```bash
npx tsx factory/main.ts 1 --dry-run
```

It prints each stage with its model, turn limit, budget and permission mode, for a `feature` ticket. It reads `.factory/config.json` and spends nothing.

### 2. Run the routing tests

```bash
npx vitest run factory/run.test.ts factory/cost-ledger.test.ts factory/cost-report.test.ts
```

Read these by name: "routes an epic plan to Opus", "lets the orchestrator overrule triage and force the Opus route", "routes a small low-risk ticket to the cheap model and a risky one to Opus" and "fails closed when a stage used a model outside the allowed set".

### 3. Change a route and watch a test notice

In a scratch branch, edit `.factory/config.json` and change `routes.epic.plan` from `claude-opus-5-5` to `claude-sonnet-5-5`. Run:

```bash
npx vitest run factory/run.test.ts -t "routes an epic plan to Opus"
```

It fails. Revert the edit and run it again; it passes. That is the proof that routing is pinned by a test and not by prose.

### 4. Measure the mix from `cost.json`

Each config-runner run writes `.factory/runs/<issue>/cost.json`, built by `buildLedger` in `factory/cost-ledger.ts`. The fields are `totalUsd`, `byStage`, `byModel`, `baselineModel`, `baselineUsd`, `savedUsd`, `savedPct` and `entries`, where each entry holds a stage, a model, token counts and a cost.

```bash
node -e 'const l=require("./.factory/runs/ISSUE/cost.json");console.log(l.byModel,l.byStage,l.savedPct)'
```

Replace `ISSUE` with a run you have. Read it three ways:

- `byModel`: what share of the dollars went to each tier. If Opus is most of it on a ticket that was not an epic, a route is too generous.
- `byStage`: which stage is the bill. If it is build, cheaper planning will not move it.
- `savedUsd`: the same tokens re-priced at `baselineModel` (Opus). It is arithmetic on token counts, so it says what routing saved, and it says nothing about quality.

`formatReport` in `factory/cost-report.ts` prints the same numbers as text, ending with the saving against all-Opus. When the SDK gives no token counts, `buildLedger` reports zero saved instead of inventing a number.

The workflow engine writes `metrics.json`, which holds `costUsd` per run and per workflow through `rollup`, and no split by model. `npx tsx factory/engine/main.ts --report` prints it. So today the by-model view comes from the config runner's `cost.json` only.

### 5. Decide with an experiment, not an opinion

The repo has no measured quality comparison between models on build. To get one, run the same issue twice, once with `stages.build.model` on Sonnet and once on Haiku, from a clean branch each time. Compare the check results in `run.log` and the cost in `cost.json`. A cheaper model that needs a second review round can cost more, so compare totals, and read the `rounds` in `metrics.json`.

## Proof that bites

The ledger must add up, and an unpriced or unlisted model must fail.

```bash
npx vitest run factory/cost-ledger.test.ts -t "sums to the reported total"
```

Now break it: in a scratch branch, delete the `claude-haiku-5-5` entry from `prices` in `.factory/config.json` and run `npx vitest run factory/cost-ledger.test.ts`. Those tests call `loadConfig()` when they import, and `configSchema` throws `model claude-haiku-5-5 has no price`, because a model without a price would make the ledger silently under-count. Restore the entry.

## Discussion

- Plan is cheap in tokens and expensive when wrong. Why does the config route the plan of an epic to Opus and not its build?
- If the engine adopts config routing, what should happen when a step names an agent whose frontmatter says another model?
- Triage itself runs on the cheapest model. What goes wrong if triage is wrong, and which way does `parseTriage` fail?
- `savedPct` compares against all-Opus. Is that the baseline your team would have chosen without the factory?

## Sources

- [Manage costs effectively, choose the right model](https://code.claude.com/docs/en/costs.md)
- [Subagents, choose a model](https://code.claude.com/docs/en/sub-agents.md#choose-a-model)
