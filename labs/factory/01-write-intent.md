# Turn a ticket into an intent

**Pairs with:** `docs/factory/f1-plan.md`
**Help:** goal

## Warm-up

What makes a review rule useful?
From: team-02
Answer: A diff can break it. Vague advice cannot be checked, so it is noise.

## Goal

Write the intent a factory run starts from, at .labs/work/specs/1/intent.md: a Problem, a Done when with two checks a command could run, and an Out of scope. The proof below must pass.

## Predict

What must an intent say so a later stage can check the work, beyond the problem itself?

Answer: A "Done when" list of checkable bullets, because a stage can only test what was written down as a pass condition.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read the intent stage doc to see what a good one holds.
3. Make the spec folder under the lab work folder.
4. [editor] Write the intent with the three headings, spelled as the proof expects.
5. Under Done when, give two checks a command could run.

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
4. Commands: `cat docs/factory/f1-plan.md`, then `mkdir -p .labs/work/specs/1`.

## What you just learned

The factory reads only what was committed. An intent with a checkable "done" is the contract every later stage tests against.
