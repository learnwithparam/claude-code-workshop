# Assignment: canary prompt with rollback

## Brief

Add `api/src/agent/canary.ts` for the prompt in `api/src/agent/prompt.ts`.

## Level

senior

## Acceptance

- `routePrompt(requestId, share)` returns `"candidate"` or `"current"`, the same way for the same id, and near `share` over many ids.
- `decideCanary({ current, candidate, margin })` returns `"rollback"` when the candidate's pass rate falls below the current one by more than `margin`, otherwise `"keep"`.
- After a rollback the share is 0 and the event is logged.

## Workflow

`llm-eval`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/canary.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `ASSIGNMENT=1 npx vitest run tests/assignments/canary.test.ts`.
   Expect: It fails because `api/src/agent/canary.ts` does not exist.
2. File the issue: `gh issue create --title "Assignment: canary prompt with rollback" --body-file assignments/canary.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `api/src/agent/canary.ts`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=llm-eval`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `ASSIGNMENT=1 npx vitest run tests/assignments/canary.test.ts`.
   Expect: It passes.

## Discussion

Why must `routePrompt` give the same answer for the same request id?

- **Principal:** Eval scores are noisy and small. How many requests does the canary need before a rollback is a decision and not a coin flip, and who owns that number?

## File it

```sh
gh issue create --title "Assignment: canary prompt with rollback" --body-file assignments/canary.md --label assignment
```
