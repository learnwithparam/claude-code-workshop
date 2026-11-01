# Assignment: specify the label state machine

## Brief

Add `factory/label-machine.ts` with `applyEvent(labels, event)` and `canBuild(labels)`, for the labels in `.factory/config.json`. Events: `plan-written`, `human-approved`, `build-requested`, `stuck`, `retry`.

## Level

principal

## Acceptance

- A build never starts without `plan:approved`.
- A new plan always clears `plan:approved`.
- `needs-human` is never cleared by the factory, only by `human-approved`.

## Workflow

`feature-atdd`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/label-machine.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `ASSIGNMENT=1 npx vitest run tests/assignments/label-machine.test.ts`.
   Expect: It fails because `factory/label-machine.ts` does not exist.
2. File the issue: `gh issue create --title "Assignment: specify the label state machine" --body-file assignments/label-machine.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `factory/label-machine.ts`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=feature-atdd`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `ASSIGNMENT=1 npx vitest run tests/assignments/label-machine.test.ts`.
   Expect: It passes.

## Discussion

Which invariant is easiest to break with a sequence a human would never try?

- **Principal:** Labels are the factory's only shared state. Where would you rather keep that state, and what does moving it cost?

## File it

```sh
gh issue create --title "Assignment: specify the label state machine" --body-file assignments/label-machine.md --label assignment
```
