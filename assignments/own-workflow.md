# Assignment: a workflow from your own company

## Brief

Add `.factory/workflows/<name>.yaml` for <task>.

Run the test with `WORKFLOW=<name>`.

## Level

senior

## Acceptance

- The first line is `# Method:`, and the file names its source.
- It uses only checks from `CHECK_NAMES` and loads.
- At least one step carries a check, with a failing input shown first.

## Workflow

`feature-atdd`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/own-workflow.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `WORKFLOW=<name> ASSIGNMENT=1 npx vitest run tests/assignments/own-workflow.test.ts`.
   Expect: It fails because `WORKFLOW` is not set, so there is no workflow file to check.
2. File the issue: `gh issue create --title "Assignment: a workflow from your own company" --body-file assignments/own-workflow.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `.factory/workflows/<name>.yaml`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=feature-atdd`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `WORKFLOW=<name> ASSIGNMENT=1 npx vitest run tests/assignments/own-workflow.test.ts`.
   Expect: It passes.

## Discussion

Which step of your workflow carries the check that matters most, and what input fails it?

- **Principal:** A workflow encodes how your team ships. Who is allowed to change it, and how is a change reviewed so it cannot quietly weaken a check?

## File it

```sh
gh issue create --title "Assignment: a workflow from your own company" --body-file assignments/own-workflow.md --label assignment
```
