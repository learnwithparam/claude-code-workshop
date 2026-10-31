# Write acceptance before code

**Pairs with:** `docs/factory/f2-design.md`
**Help:** goal

## Goal

Write .labs/work/specs/1/acceptance.md from your intent: two scenarios, each with a Given, a When and a Then line a test could assert. Write it before any code exists. The proof below must pass.

## Steps

1. Read the design stage doc.
2. Reread your intent.
3. Write two scenarios, one Given, When and Then line each, at the left edge.
4. Make each Then something a program can assert, such as a status code or a file.

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
4. Commands: `cat docs/factory/f2-design.md`, then `cat .labs/work/specs/1/intent.md`.

## What you just learned

The spec is the first test. If a Then cannot be asserted, the requirement is not finished.
