# F8. Workflows: write one, and choose one per task

**Stage:** all of them. **Layer:** delivery, made configurable. **Workflows shown:** every file in `.factory/workflows/`.

## Goal

Write a workflow file from scratch, make the repo's own tests accept it, run it on an issue, and pick the right one for each kind of ticket.

## The schema

`factory/engine/workflow.ts` is the whole schema. Read it before writing a line of YAML.

- A workflow has `name`, `method`, `source`, `for`, and a list of `steps`. `manifests` defaults to false and only a dependency update needs it.
- A step has `stage` and `agent`. Optional fields: `brief`, `writes` (one of `AGENT_ARTIFACTS` in `factory/engine/artifacts.ts`: `intent.md`, `spec.md`, `plan.md`, `constitution.md`, `clarify.md`, `tasks.md`, `analyze.md`), `startsWith`, `checks`, `loop`, `review`, `gate` (`human` or `auto`) and `phase` (`build` or `fix`).
- `review: { lenses: [...] }` turns the step into the voting review of F5: the lenses hunt in parallel, three verifiers vote on each finding, two keep it, and a builder fixes what survives.
- A `plan` step that sets no `brief` takes `planBrief` from `.factory/config.yaml`, so the plan rules are written once per repo.
- The `stage` name also picks the model. `stepStages` in `.factory/config.json` maps a stage name to a config stage (F12). A name that appears in neither `stepStages` nor the stage list falls back to the middle model.
- `checks` may only name entries of `CHECK_NAMES`: `red`, `green`, `lock`, `holdout`, `acceptance`, `properties`, `behaviour-unchanged`, `mutation`, `contract`, `visual`, `eval`, `plan-drift`, `gate`, `prepush`, `ci`, `prose`, `manifest-deps`.
- `loop: { until: [...], max: n }` repeats the agent until those checks pass. `max` is 1 to 5, and every `until` check must also be in the step's `checks`, or `loadWorkflow` throws.

## Steps

1. Read `.factory/workflows/docs.yaml`. It is the smallest workflow that plans, changes files and checks the result.
2. Create `.factory/workflows/typo.yaml` for a one-line docs fix. The first line must start with `# Method:`, because `factory/engine/workflows.test.ts` reads it.

```yaml
# Method: a one-line docs fix, held to the prose rules and nothing else.
name: typo
method: prose check only
source: engineering standard
for: one-line documentation fixes
steps:
  - { stage: plan, writes: plan.md, agent: planner }
  - {
      stage: fix,
      agent: builder,
      brief: "Fix the typo the ticket names and change nothing else. No em dashes, no filler.",
      checks: [prose],
      loop: { until: [prose], max: 2 },
    }
  - {
      stage: review,
      agent: reviewer,
      review: { lenses: [reviewer, security-reviewer] },
      checks: [plan-drift],
    }
```

The `plan` step has no brief, so it takes `planBrief` from `.factory/config.yaml`. The `fix` stage name maps to the build model in `stepStages`.

3. Run `npx vitest run factory/engine/workflows.test.ts`. Every file in the folder gets the same tests, so `typo.yaml` is tested the moment it exists.
4. Break it on purpose, one edit at a time, and read each failure:
   - change `agent: builder` to `agent: coder`: the "uses only agents that exist" test fails;
   - add `loop: { until: [red], max: 2 }` to the fix step: `loadWorkflow` rejects a loop on a check the step does not run;
   - delete the `plan` step: the "plan-drift needs a plan" test fails.
5. File an issue, then run it: `npx tsx factory/engine/main.ts <issue> --workflow=typo`. It needs `gh` logged in. The agents need one credential: `ANTHROPIC_API_KEY`, which the script loads inside its own process, or `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` with `--auth=subscription`. Never put either on a command line. [Auth modes](auth-modes.md) has both paths.
6. Open `specs/<issue>/run.log`, `specs/<issue>/cost.json` and `.factory/runs/<issue>/metrics.json`. The log has each step's rounds, the model it ran on, its cost and every check as `ok` or `FAIL`. `cost.json` has the cap, the total and one entry per agent call.

## Why each rule in the brief exists

The shared plan brief in `.factory/config.yaml` holds three sentences, and every plan step gets them. Each is pinned by a test in `factory/engine/workflows.test.ts` that names the run that went wrong:

- "Do not list files under `specs/<issue>/`": run 31 listed its golden test and the plan was refused.
- "List `levels.json` whenever you add a file": a new file needs an owner there, and `plan-drift` failed without it.
- "Commentary of any kind makes the plan unusable": run 29's plan held a note, and `badPlanLines` in `factory/engine/artifacts.ts` refuses lines that are not repo paths.

## The golden set

One workflow per kind of task. The test "covers every task type the plan names" fails if one is deleted.

| task                                | workflow       | what it refuses to skip                                    |
| ----------------------------------- | -------------- | ---------------------------------------------------------- |
| a bug                               | `bug-tdd`      | `red` on the base commit, then `lock`, then `mutation`     |
| a small feature with examples       | `feature-atdd` | one test per Given/when/then example, then `holdout`       |
| user-facing behaviour               | `feature-bdd`  | Gherkin scenarios, a human gate after the `amigos` review  |
| a large feature or epic             | `feature-sdd`  | constitution, clarify, tasks and analyze, with human gates |
| a refactor                          | `refactor`     | characterization tests first, then `behaviour-unchanged`   |
| a UI change                         | `ui-visual`    | a design contract, `visual`, the design lens               |
| a prompt, model or `.claude` change | `llm-eval`     | `eval` red on main, a loop to the pass rate                |
| the api and web boundary            | `contract`     | the contract test first, both sides move                   |
| a dependency bump                   | `deps`         | `manifest-deps` and the whole gate, never the bump alone   |
| a security fix                      | `security`     | a failing exploit test and a PR naming the class of bug    |
| an open question                    | `spike`        | the output is a decision record behind a human gate        |
| documentation                       | `docs`         | `prose` and `gate`                                         |
| an incident or band breach          | `incident`     | the incident becomes an eval before the fix                |

## Choosing one

Ask what evidence the task can honestly give.

- Can you write a test that fails today? Use `bug-tdd`. If the change is meant to leave behaviour alone, use `refactor`, where the pinned tests pass on both sides.
- Is "done" something a person must judge? Use a workflow with a `gate: human`, and put the gate before the build.
- Is there no code to write yet? Use `spike`. Its two steps explore and decide, and have no build.
- Does the thing under test answer differently each time? Use `llm-eval`, which grades a pass rate instead of one run.

`factory/engine/main.ts` does not pick for you: you name the workflow with `--workflow=`. The name also sets the ticket type used for model routes, with one exception: `feature-sdd` runs as type `epic` (F12). The older runner in `factory/route-ticket.ts` classifies a ticket for its own stages; read it to see how a type is chosen there.

## Proof

- `npx vitest run factory/engine/workflows.test.ts` parses and dry-runs every workflow, including yours.
- `npx vitest run factory/engine/engine.test.ts` covers the schema rejections and the loop cap ("stops at the cap and writes run.log").
- `make prove LEVEL=workflows` runs the engine tests as one gate (`scripts/prove/workflows.ts`).

## Discussion

Which of these would your team delete first, and what evidence would you lose? Which task in your backlog fits none of them?
