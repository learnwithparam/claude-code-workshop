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

```sh
f=.labs/work/specs/1/intent.md
grep -q '^## Problem' $f && grep -q '^## Done when' $f && grep -q '^## Out of scope' $f || exit 1
cmds=$(awk '/^## /{s=($0=="## Done when")} s&&/^- .*`[^`]+`/' $f | grep -o '`[^`]*`' | tr -d '`' | awk '{print $1}')
test "$(echo "$cmds" | grep -c .)" -ge 2 || exit 1
for c in $cmds; do command -v "$c" >/dev/null || exit 1; done
```

## Hints

1. Three headings, spelled exactly, plus at least two bullets.
2. "Done when" is a list of bullets such as "`make check` exits 0".
3. Out of scope names one thing you will not do. It stops a run from growing.

## What you just learned

The factory reads only what was committed. An intent with a checkable "done" is the contract every later stage tests against.
