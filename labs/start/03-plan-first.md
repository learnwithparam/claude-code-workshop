# Plan before you edit

**Pairs with:** `docs/levels/context.md`

## Goal

Get a written plan for a small change from Claude without letting it edit a single file.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
2. Make the folder: `mkdir -p .labs/work`.
3. Ask for a plan only: `claude -p --permission-mode plan "Plan how to add a grade band for university to shared/. List the files and how you will verify it." > .labs/work/plan.md`.
4. Read the plan and check it names files that exist: `cat .labs/work/plan.md`.

## Proof

```sh
grep -qi 'verify' .labs/work/plan.md && test "$(grep -c . .labs/work/plan.md)" -ge 5
```

## Hints

1. The proof wants at least five lines in `.labs/work/plan.md` that mention how to verify.
2. Plan mode is read-only. Claude can look but not write.
3. Your prompt must ask for verification, or the plan may leave it out.

## What you just learned

Plan mode turns "do it" into "show me first". You review a plan for free instead of reviewing a diff.
