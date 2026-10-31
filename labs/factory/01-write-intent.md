# Turn a ticket into an intent

**Pairs with:** `docs/factory/f1-plan.md`

## Goal

Write the one-page intent a factory run starts from: the problem and how anyone will know it is done.

## Predict

What must an intent say so a later stage can check the work, beyond the problem itself?

Answer: A "Done when" list of checkable bullets, because a stage can only test what was written down as a pass condition.

## Steps

1. Read the stage: `cat docs/factory/f1-plan.md`.
2. Make the folder: `mkdir -p .labs/work/specs/1`.
3. Write `.labs/work/specs/1/intent.md` with the headings `## Problem`, `## Done when` and `## Out of scope`.
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
