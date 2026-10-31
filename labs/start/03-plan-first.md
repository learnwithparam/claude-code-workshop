# Plan before you edit

**Pairs with:** `docs/levels/context.md`

## Goal

Get a written plan for a small change from Claude without letting it edit a single file.

## Predict

If you ask Claude for a plan in plan mode, will it edit any file in the repo?

Answer: No. Plan mode is read-only, so Claude can read and search but the only thing written is the plan you redirect into a file.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
2. Ask for a plan only: `claude -p --permission-mode plan "Plan how to add a grade band for university to shared/. List the files and how you will verify it." > .labs/work/plan.md`.
3. Read the plan and check it names files that exist: `cat .labs/work/plan.md`.

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
