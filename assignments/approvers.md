# Assignment: name the approvers for a high-risk gate

## Brief

Read the approver logins from `.factory/config.yaml` (an `approvers` list in `portableSchema`) and pass them to `realHost` from `runIssue`.

## Level

principal

## Acceptance

- A high-risk gate opens with two listed people, a medium one with one.
- One person commenting twice counts once.
- The logged-in user is no longer assumed.

## Workflow

`feature-atdd`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/approvers.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `ASSIGNMENT=1 npx vitest run tests/assignments/approvers.test.ts`.
   Expect: It fails because the config schema has no `approvers` key and the CLI still assumes the logged-in user.
2. File the issue: `gh issue create --title "Assignment: name the approvers for a high-risk gate" --body-file assignments/approvers.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `factory/engine/portable.ts`, `factory/engine/cli.ts`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=feature-atdd`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `ASSIGNMENT=1 npx vitest run tests/assignments/approvers.test.ts`.
   Expect: It passes.

## Discussion

Why does one person commenting twice count once?

- **Principal:** Who should be on the approver list for a high-risk change, and how do you keep that list from becoming a rubber stamp or a bottleneck?

## File it

```sh
gh issue create --title "Assignment: name the approvers for a high-risk gate" --body-file assignments/approvers.md --label assignment
```
