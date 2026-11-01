# Assignment: an opt-in LLM-judge hook

## Brief

Add `.claude/hooks/pretooluse-judge.mjs` exporting `shouldJudge(env)`, `decide(verdict)` and `diffToSend(diff)`.

## Level

senior

## Acceptance

- Off by default; on only when `JUDGE=1`.
- A `blocking` verdict blocks the commit, a `clean` one passes.
- A diff the secrets hook would block is never sent.

## Workflow

`feature-atdd`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/judge-hook.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `ASSIGNMENT=1 npx vitest run tests/assignments/judge-hook.test.ts`.
   Expect: It fails because `.claude/hooks/pretooluse-judge.mjs` does not exist.
2. File the issue: `gh issue create --title "Assignment: an opt-in LLM-judge hook" --body-file assignments/judge-hook.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `.claude/hooks/pretooluse-judge.mjs`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=feature-atdd`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `ASSIGNMENT=1 npx vitest run tests/assignments/judge-hook.test.ts`.
   Expect: It passes.

## Discussion

Why is the judge off unless `JUDGE=1`, and why is the diff filtered first?

- **Principal:** A model that can block commits is a new single point of failure. What is its failure mode, and what happens to the team when it is down or wrong?

## File it

```sh
gh issue create --title "Assignment: an opt-in LLM-judge hook" --body-file assignments/judge-hook.md --label assignment
```
