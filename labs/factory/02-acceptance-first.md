# Write acceptance before code

**Pairs with:** `docs/factory/f2-design.md`

## Goal

Turn the intent into Given, When, Then scenarios that a test can be written from before any code exists.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
2. Read the stage: `cat docs/factory/f2-design.md`.
3. Open your intent: `cat .labs/work/specs/1/intent.md`.
4. Write `.labs/work/specs/1/acceptance.md` with two scenarios. Each has one `Given`, one `When` and one `Then` line.
5. Each Then is something a program can assert, such as a status code or a file.

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
