# Write acceptance before code

**Pairs with:** `docs/factory/f2-design.md`

## Goal

Turn the intent into Given, When, Then scenarios that a test can be written from before any code exists.

## Steps

1. Read the stage: `cat docs/factory/f2-design.md`.
2. Open your intent: `cat .labs/work/specs/1/intent.md`.
3. Write `.labs/work/specs/1/acceptance.md` with two scenarios. Each has one `Given`, one `When` and one `Then` line.
4. Each Then is something a program can assert, such as a status code or a file.

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

## What you just learned

The spec is the first test. If a Then cannot be asserted, the requirement is not finished.
