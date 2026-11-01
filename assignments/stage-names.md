# Assignment: a model for every stage name

## Brief

Every stage name in every workflow resolves to a config stage, or the workflow test fails.

## Level

noob

## Acceptance

- Each name used in `.factory/workflows/` is a key of `stepStages` or one of `STAGE_NAMES`.
- Each step resolves to a model in `allowedModels`.

## Workflow

`llm-eval`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/stage-names.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `ASSIGNMENT=1 npx vitest run tests/assignments/stage-names.test.ts`.
   Expect: It fails because some workflow stage names, for example `queue` in `bug-tdd.yaml`, are in neither `stepStages` nor `STAGE_NAMES`.
2. File the issue: `gh issue create --title "Assignment: a model for every stage name" --body-file assignments/stage-names.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `.factory/config.json`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=llm-eval`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `ASSIGNMENT=1 npx vitest run tests/assignments/stage-names.test.ts`.
   Expect: It passes.

## Discussion

What happens to a step whose stage name is unmapped today?

- **Principal:** A silent fallback to the agent's own model is a cost decision nobody made. Where else does your system fall back without saying so?

## File it

```sh
gh issue create --title "Assignment: a model for every stage name" --body-file assignments/stage-names.md --label assignment
```
