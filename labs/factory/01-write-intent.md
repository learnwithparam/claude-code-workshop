# Turn a ticket into an intent

**Pairs with:** `docs/factory/f1-plan.md`

## Goal

Write the one-page intent a factory run starts from: the problem and how anyone will know it is done.

## Steps

1. Read the stage: `cat docs/factory/f1-plan.md`.
2. Make the folder: `mkdir -p .labs/work/specs/1`.
3. Write `.labs/work/specs/1/intent.md` with the headings `## Problem`, `## Done when` and `## Out of scope`.
4. Under Done when, write two checks a command could run.

## Proof

1. intent.md has a Problem heading.

   ```sh
   grep -q '^## Problem' .labs/work/specs/1/intent.md
   ```
2. intent.md has a Done when heading.

   ```sh
   grep -q '^## Done when' .labs/work/specs/1/intent.md
   ```
3. intent.md has an Out of scope heading.

   ```sh
   grep -q '^## Out of scope' .labs/work/specs/1/intent.md
   ```
4. intent.md has at least two bullet lines.

   ```sh
   test "$(grep -c '^- ' .labs/work/specs/1/intent.md)" -ge 2
   ```

## Hints

1. Three headings, spelled exactly, plus at least two bullets.
2. "Done when" is a list of bullets such as "`make check` exits 0".
3. Out of scope names one thing you will not do. It stops a run from growing.

## What you just learned

The factory reads only what was committed. An intent with a checkable "done" is the contract every later stage tests against.
