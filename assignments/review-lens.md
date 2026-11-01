# Assignment: add a performance review lens

## Brief

Add a `performance-reviewer` agent in `.claude/agents/performance-reviewer.md`. It reads the diff and replies with a JSON array of findings with file, line, severity, claim and evidence.

## Level

senior

## Acceptance

- Read-only tools (`Read, Grep, Glob`) and a `VERDICT:` line, like `security-reviewer`.
- A finding only one voter confirms is dropped.
- A workflow's `review: { lenses: [...] }` names it.

## Workflow

`llm-eval`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/review-lens.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `ASSIGNMENT=1 npx vitest run tests/assignments/review-lens.test.ts`.
   Expect: It fails because `.claude/agents/performance-reviewer.md` does not exist.
2. File the issue: `gh issue create --title "Assignment: add a performance review lens" --body-file assignments/review-lens.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `.claude/agents/performance-reviewer.md`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=llm-eval`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `ASSIGNMENT=1 npx vitest run tests/assignments/review-lens.test.ts`.
   Expect: It passes.

## Discussion

Why is a finding that only one voter confirms dropped?

- **Principal:** Each lens adds cost and noise. How would you decide a lens has earned its place, and when would you remove one?

## File it

```sh
gh issue create --title "Assignment: add a performance review lens" --body-file assignments/review-lens.md --label assignment
```
