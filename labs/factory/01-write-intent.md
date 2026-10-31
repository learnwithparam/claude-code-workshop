# Turn a ticket into an intent

**Pairs with:** `docs/factory/f1-plan.md`

## Goal

Write the one-page intent a factory run starts from: the problem and how anyone will know it is done.

## Steps

1. Read the stage: `cat docs/factory/f1-plan.md`.
   Expect: The text of the planning stage, including what an intent must contain. It prints a page of plain text.
2. Make the folder: `mkdir -p .labs/work/specs/1`.
   Expect: No output. The folder `.labs/work/specs/1` now exists.
3. Write `.labs/work/specs/1/intent.md` with the headings `## Problem`, `## Done when` and `## Out of scope`.
   Expect: No output from a command, since you are writing the file. Afterwards the file has three headings: Problem, Done when and Out of scope.
4. Under Done when, write two checks a command could run.

## Proof

```sh
f=.labs/work/specs/1/intent.md; grep -q '^## Problem' $f && grep -q '^## Done when' $f && grep -q '^## Out of scope' $f && test "$(grep -c '^- ' $f)" -ge 2
```

## Hints

1. Three headings, spelled exactly, plus at least two bullets.
2. "Done when" is a list of bullets such as "`make check` exits 0".
3. Out of scope names one thing you will not do. It stops a run from growing.

## What you just learned

The factory reads only what was committed. An intent with a checkable "done" is the contract every later stage tests against.
