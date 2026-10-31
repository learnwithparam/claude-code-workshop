# F2 Design: the spec is the first test

**Stage:** design. **Layers:** context and verification. **Workflows:** `feature-atdd`, `feature-bdd`, `feature-sdd`.

## Goal

Turn an `intent.md` into a `spec.md` that a check can grade, and stop for a human before any code exists. You write the same behaviour as examples, as Gherkin and as EARS requirements, and learn which one fits which ticket.

## Why the spec comes before the code

A builder that writes its own tests and its own code grades itself. The spec is the one artifact a person reads and signs, so everything after it (tests, build, review) is measured against words a human approved.

In the engine the spec is a file, `specs/<n>/spec.md`, saved by the runner. The planner agent has only `Read, Grep, Glob` (`.claude/agents/planner.md`), so it cannot write the file. The runner saves its reply, and refuses a reply that is chat. `startsWith` in the workflow decides what counts: `Feature:` for BDD, `R1.` for SDD (`factory/engine/interpret.ts`).

## Steps

1. Read the three workflows side by side and find the `spec` step in each.

   ```
   .factory/workflows/feature-atdd.yaml
   .factory/workflows/feature-bdd.yaml
   .factory/workflows/feature-sdd.yaml
   ```

2. Write the same small feature three ways. Take "a repeat prompt in the same band costs zero tokens".

   Examples (ATDD, Adzic, Specification by Example). One line per example, real values, as the `feature-atdd` brief asks:

   ```
   Given "Fractions worksheet" for grade 3 was answered once, when the same prompt is sent for grade 3, then the model is called 0 times.
   Given the same, when the prompt is sent for grade 7, then the model is called 1 time.
   ```

   Gherkin (BDD, North, the three amigos). Begins with `Feature:`, one behaviour per scenario. Compare `specs/35/spec.md`:

   ```
   Scenario: A repeat prompt in the same band spends zero tokens
   Given the prompt "Fractions worksheet" for band "grade 3" was answered once
   When the same prompt "Fractions worksheet" is sent for band "grade 3"
   Then the model is called 0 times
   ```

   EARS (SDD, the Kiro notation). Begins with `R1.`, one trigger and one response per line. Compare `specs/34/spec.md`:

   ```
   R6. When a workbook is planned, the system shall place no more items on any page than the `maxItemsPerPage` of the workbook's band.
   ```

3. Pick by the ticket, not by taste.

   | method   | write it when                                                  | what grades it later                                                    |
   | -------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
   | Examples | a small feature, one person can hold it in their head          | one vitest test per example, assertion matches the `Then`               |
   | Gherkin  | user-facing behaviour that product, dev and test must agree on | one vitest test per scenario; the `amigos` step reads it as three roles |
   | EARS     | a large feature where a rule holds for all inputs              | a test or a fast-check property per requirement                         |

4. Run the dry run of every workflow and read the order of stages.

   ```
   npx vitest run factory/engine/workflows.test.ts
   ```

5. Find the human gate. In `feature-sdd.yaml` the `spec` and `plan` steps carry `gate: human`. In `feature-atdd.yaml` only `spec` does. In `feature-bdd.yaml` the gate is on `amigos`.

## Phase gates

A gate stops the run with the outcome `awaiting-approval` until a person approves what they read.

- The approval is a comment on the issue with the exact line `approve <stage> <digest>`.
- The digest is a hash of `intent.md` and `spec.md` for the `spec` stage, and adds `plan.md` for later stages (`artifactDigest` in `factory/engine/artifacts.ts`). `constitution.md`, `clarify.md`, `tasks.md` and `analyze.md` join the hash only when the run wrote them. Edit the spec after approving and the old approval no longer matches.
- Only an `OWNER`, `MEMBER` or `COLLABORATOR` counts, and the real run narrows that to the logged-in `gh` user. The agents hold no GitHub token, so they cannot approve (`approvalIn` in `factory/engine/real-host.ts`).
- How many distinct people must approve comes from the risk tier of the files changed so far: one for a docs-only or medium change, two for a high one (F1). The log line is `gate spec tier medium needs 1 approval`.
- On resume the runner skips every step up to the last approved gate, so regenerating an artifact cannot change what the person signed.

## Spec Kit and Kiro compared with this repo

`feature-sdd.yaml` names both as its source. What the file actually contains, in order: `intent`, `constitution`, `spec` (human gate), `clarify`, `plan` (human gate), `tasks`, `analyze`, then the build stages.

| idea                         | Spec Kit           | Kiro                              | here                                                                                                       |
| ---------------------------- | ------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Requirements notation        | free prose spec    | EARS, "when X the system shall Y" | EARS, `startsWith: "R1."`                                                                                  |
| Approval between phases      | per command        | per phase                         | `gate: human` on `spec` and `plan`                                                                         |
| Plan stays bounded           | `plan` and `tasks` | design and tasks                  | `plan.md` is an allowlist; `plan-drift` fails a stray file (F3)                                            |
| Properties from requirements | not part of it     | "for any ... shall"               | the `properties` check runs `specs/<n>/properties` (F4)                                                    |
| Project constitution         | `constitution`     | steering files                    | the `constitution` stage lists the standing rules from `AGENTS.md` and `.claude/rules`                     |
| `clarify`                    | yes                | no                                | the `clarify` stage lists every requirement two readers could build differently                            |
| `tasks`                      | yes                | tasks                             | the `tasks` stage writes `T<n>. <task> (R<n>)` lines, each naming the requirement it serves                |
| `analyze`                    | yes                | no                                | the `analyze` stage lists requirements with no task, tasks with no requirement, plan files no task touches |

Each new stage is `agent: planner` with `writes: <stage>.md`, so the runner saves the reply as `specs/<n>/constitution.md`, `clarify.md`, `tasks.md` or `analyze.md`. The `tests` stage brief then tells the builder to follow `tasks.md`. `factory/engine/wiring.test.ts` pins the order and that each stage writes its own artifact.

A gap remains. `analyze` is a model reading four documents, so it is a review aid, not a check: no code fails the run when a requirement has no task or no test. You close that in Track B.

## Proof that bites

The spec-artifact rules are tested in the engine suite.

```
npx vitest run factory/engine/engine.test.ts factory/engine/real-host.test.ts
```

- A planner reply that is chat ("I drafted the scenarios, but plan mode blocks edits") is refused and nothing is saved as `spec.md`; the step retries with the reason.
- `approvalIn` returns false for a stranger, for another stage, for another digest, and for a line that only contains the approval text.

Break it once: in `factory/engine/interpret.ts` delete the `else if (step.startsWith && ...)` branch. The engine test that feeds a chat reply to a `startsWith: "Feature:"` step now fails, because the apology is saved as `spec.md`. Revert it.

## See it on a real run

- Spec 35, BDD: `specs/35/spec.md` is a Gherkin file with a `Background` and one scenario per behaviour (cache hit, band change, failed generation not cached, template holds slots and no filled content). `specs/35/red.md` maps each scenario to a golden test by title.
- Spec 28, BDD: `specs/28/spec.md` and `features/activity-kinds.feature`.
- Spec 34, SDD: `specs/34/spec.md` is EARS, `R1.` onward. `specs/34/tests.md` lists which requirement each test covers. That run came before the four Spec Kit stages, so no committed run holds a `constitution.md`, `clarify.md`, `tasks.md` or `analyze.md`.
- Spec 33, a spike: `specs/33/spec.md` is an ADR, the decision (files) and why, with no code.

The `.feature` files are read by people and by the `amigos` agent. No Gherkin runner executes them: each scenario is a hand-written vitest test, and the `Then` is the assertion.

No committed run used `feature-atdd`, so this module shows its workflow file and not a run.

## Exercise

Track A: take one scenario from `specs/35/spec.md` and rewrite it as an example line and as an EARS line. Say which of the three you would have asked the planner for, and why.

Track B: the `analyze` stage is a model's reading. Add a code check named `requirements-covered` that fails when a requirement id in `spec.md` (`R<n>.`) appears in no file under `specs/<n>/golden` or `specs/<n>/properties`. Give it a failing input first, add it to `CHECK_NAMES` and `CHECKS`, and wire it into the `analyze` step of `feature-sdd.yaml`.

## Discussion

1. A scenario says "the page loads quickly". What would the three methods force you to write instead?
2. The gate is bound to a hash of the documents. Who is hurt if it were bound to the issue number only?
3. Your team already has a product spec in a wiki. Which part of it belongs in `spec.md`, and which part stays out because no check can grade it?
