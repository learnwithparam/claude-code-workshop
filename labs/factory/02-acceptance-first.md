# Write acceptance before code

**Pairs with:** `docs/factory/f2-design.md`
**Help:** goal

## Warm-up

What do you share to show a check passes?
From: team-03
Answer: The command output, not a sentence saying it works.

## Goal

Write .labs/work/specs/1/acceptance.md from your intent: two scenarios, each with a Given, a When and a Then line a test could assert. Write it before any code exists. The proof below must pass.

## Predict

Your acceptance scenarios exist before any code does. If a test were written from them and run now, would it pass?

Answer: No, it would fail. A test that is red first proves it can catch the missing feature, and it turns green only when the work is real.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read the design stage doc.
3. Reread your intent.
4. [editor] Write two scenarios, one Given, When and Then line each, at the left edge.
5. Make each Then something a program can assert, such as a status code or a file.

## Proof

1. acceptance.md has at least two Given lines.

   ```sh
   test "$(grep -c '^Given' .labs/work/specs/1/acceptance.md)" -ge 2
   ```
2. acceptance.md has at least two When lines.

   ```sh
   test "$(grep -c '^When' .labs/work/specs/1/acceptance.md)" -ge 2
   ```
3. acceptance.md has at least two Then lines.

   ```sh
   test "$(grep -c '^Then' .labs/work/specs/1/acceptance.md)" -ge 2
   ```

## Hints

1. Two scenarios means two lines each starting `Given`, `When` and `Then`.
2. Lines start at the left edge, with no bullet.
3. "Then the worksheet has twelve questions" can be asserted. "Then it looks good" cannot.
4. Commands: `cat docs/factory/f2-design.md`, then `cat .labs/work/specs/1/intent.md`.

## What you just learned

The spec is the first test. If a Then cannot be asserted, the requirement is not finished.
