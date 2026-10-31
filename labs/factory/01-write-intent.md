# Turn a ticket into an intent

**Pairs with:** `docs/factory/f1-plan.md`
**Help:** goal

## Goal

Write the intent a factory run starts from, at .labs/work/specs/1/intent.md: a Problem, a Done when with two checks a command could run, and an Out of scope. The proof below must pass.

## Steps

1. Read the intent stage doc to see what a good one holds.
2. Make the spec folder under the lab work folder.
3. Write the intent with the three headings, spelled as the proof expects.
4. Under Done when, give two checks a command could run.

## Proof

```sh
f=.labs/work/specs/1/intent.md; grep -q '^## Problem' $f && grep -q '^## Done when' $f && grep -q '^## Out of scope' $f && test "$(grep -c '^- ' $f)" -ge 2
```

## Hints

1. Three headings, spelled exactly, plus at least two bullets.
2. "Done when" is a list of bullets such as "`make check` exits 0".
3. Out of scope names one thing you will not do. It stops a run from growing.
4. Commands: `cat docs/factory/f1-plan.md`, then `mkdir -p .labs/work/specs/1`.

## What you just learned

The factory reads only what was committed. An intent with a checkable "done" is the contract every later stage tests against.
