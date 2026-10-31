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

```sh
f=.labs/work/specs/1/acceptance.md
for k in Given When Then; do test "$(grep "^$k" $f | awk 'NF>=4' | wc -l)" -ge 2 || exit 1; done
! grep '^Then' $f | grep -Eqiw 'look(s)? (good|nice|right)|works|fine|correct'
```

## Hints

1. Two scenarios means two lines each starting `Given`, `When` and `Then`.
2. Lines start at the left edge, with no bullet.
3. "Then the worksheet has twelve questions" can be asserted. "Then it looks good" cannot.

## What you just learned

The spec is the first test. If a Then cannot be asserted, the requirement is not finished.
