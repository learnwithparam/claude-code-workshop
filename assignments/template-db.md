# Assignment: move worksheet templates into a database

## Brief

Spike first: which store for worksheet templates, and what it rules out. File the spike alone and read its decision record before filing the build.

Then add `createDbTemplateStore(file)` in `api/src/templates/db-template-store.ts` with the same `add`, `size` and `find` as `template-store.ts`.

## Level

senior

## Acceptance

- A second store opened on the same file finds a template the first saved.
- Adding the same template twice keeps one.

## Workflow

`spike`. Then file the build with `feature-sdd`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/template-db.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `ASSIGNMENT=1 npx vitest run tests/assignments/template-db.test.ts`.
   Expect: It fails because `api/src/templates/db-template-store.ts` does not exist.
2. File the issue: `gh issue create --title "Assignment: move worksheet templates into a database" --body-file assignments/template-db.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `api/src/templates/db-template-store.ts`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=spike`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `ASSIGNMENT=1 npx vitest run tests/assignments/template-db.test.ts`.
   Expect: It passes.

## Discussion

What did the spike's decision record rule out, and why?

- **Principal:** The in-memory store becomes durable. What breaks for a deploy that runs two API instances, and would you still pick the same store?

## File it

```sh
gh issue create --title "Assignment: move worksheet templates into a database" --body-file assignments/template-db.md --label assignment
```
