# Write acceptance before code

**Pairs with:** `docs/factory/f2-design.md`

## Goal

Turn the intent into Given, When, Then scenarios that a test can be written from before any code exists.

## Steps

1. Read the stage: `cat docs/factory/f2-design.md`.
   Expect: The text of the design stage, including how acceptance scenarios are written.
2. Open your intent: `cat .labs/work/specs/1/intent.md`.
   Expect: The intent you wrote, with its three headings and bullets.
3. Write `.labs/work/specs/1/acceptance.md` with two scenarios. Each has one `Given`, one `When` and one `Then` line.
   Expect: No output from a command, since you are writing the file. Afterwards `grep -c '^Then' .labs/work/specs/1/acceptance.md` prints `2` or more.
4. Each Then is something a program can assert, such as a status code or a file.

## Proof

```sh
f=.labs/work/specs/1/acceptance.md; test "$(grep -c '^Given' $f)" -ge 2 && test "$(grep -c '^When' $f)" -ge 2 && test "$(grep -c '^Then' $f)" -ge 2
```

## Hints

1. Two scenarios means two lines each starting `Given`, `When` and `Then`.
2. Lines start at the left edge, with no bullet.
3. "Then the worksheet has twelve questions" can be asserted. "Then it looks good" cannot.

## What you just learned

The spec is the first test. If a Then cannot be asserted, the requirement is not finished.
