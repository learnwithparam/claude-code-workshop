# Assignment: record each factory module from a real run log

## Brief

For each module F0 to F13, record a real run and link its `run.log`. No mock output.

How to run it: `make factory ISSUE=<this issue> FLAGS=--workflow=docs --auth=api-key`. Read `docs/factory/f8-workflows.md`.

## Level

senior

## Acceptance

- `specs/<n>/run.log` exists for the run you record.
- `docs/recordings/run-<n>.md` has the headings `## What happened` and `## What it proves`.
- Every line inside its fenced `log` block is a verbatim line of that `run.log`.
- `make check` passes with zero warnings and the new check is wired in.

## Workflow

`docs`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/recording-from-run-log.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `RUN=<n> ASSIGNMENT=1 npx vitest run tests/assignments/recording-from-run-log.test.ts`.
   Expect: It fails because `docs/recordings/run-<n>.md` does not exist.
2. File the issue: `gh issue create --title "Assignment: record each factory module from a real run log" --body-file assignments/recording-from-run-log.md --label assignment`.
   Expect: It prints the new issue URL.
3. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=docs`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
4. Write `docs/recordings/run-<n>.md`.
   Expect: The red test now fails on behaviour, not on a missing file.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `RUN=<n> ASSIGNMENT=1 npx vitest run tests/assignments/recording-from-run-log.test.ts`.
   Expect: It passes.

## Discussion

Why must every line in the log block be a line of the real `run.log`?

- **Principal:** A recording that is edited after the fact is a story, not evidence. How would you make a doctored log fail a check?

## File it

```sh
gh issue create --title "Assignment: record each factory module from a real run log" --body-file assignments/recording-from-run-log.md --label assignment
```
