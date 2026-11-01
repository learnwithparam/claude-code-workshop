# Assignment: fuzz the worksheet tool input

## Brief

Property-test the worksheet tool input. Write the generator `arbWorksheet` in `shared/src/arb-worksheet.ts`: worksheet-shaped objects with hostile text, extreme sizes and every activity kind.

## Level

senior

## Acceptance

- Every worksheet the schema accepts renders, and markup in a text field never reaches the page raw.
- `checkBand` reports problems instead of throwing.
- Plant a mutant (an escaping step removed) and show the property fails on it.

## Workflow

`security`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/fuzz-tool-input.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `ASSIGNMENT=1 npx vitest run tests/assignments/fuzz-tool-input.test.ts`.
   Expect: It fails because `shared/src/arb-worksheet.ts` does not exist.
2. File the issue: `gh issue create --title "Assignment: fuzz the worksheet tool input" --body-file assignments/fuzz-tool-input.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `shared/src/arb-worksheet.ts`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=security`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `ASSIGNMENT=1 npx vitest run tests/assignments/fuzz-tool-input.test.ts`.
   Expect: It passes.

## Discussion

What did the planted mutant show that a single example test would not?

- **Principal:** The generator is itself code that can be wrong. How would you know it reaches the inputs an attacker would send?

## File it

```sh
gh issue create --title "Assignment: fuzz the worksheet tool input" --body-file assignments/fuzz-tool-input.md --label assignment
```
