# Plan before you edit

**Pairs with:** `docs/levels/context.md`
**Help:** guided

## Warm-up

How do you know a change is really done?
From: start-02
Answer: A command you can run says so. Know the green output before you judge Claude's work.

## Goal

Get a written plan for a small change from Claude without letting it edit a single file.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
2. Ask for a plan only: `claude -p --permission-mode plan "Plan how to add a grade band for adult learners to shared/. List the files and how you will verify it." > .labs/work/plan.md`.
3. Read the plan and check it names files that exist: `cat .labs/work/plan.md`.

## Proof

1. The plan mentions how you will verify it.

   ```sh
   grep -qi 'verify' .labs/work/plan.md
   ```
2. The plan has at least five non-empty lines.

   ```sh
   test "$(grep -c . .labs/work/plan.md)" -ge 5
   ```

## Hints

1. The proof wants at least five lines in `.labs/work/plan.md` that mention how to verify.
2. Plan mode is read-only. Claude can look but not write.
3. Your prompt must ask for verification, or the plan may leave it out.

## What you just learned

Plan mode turns "do it" into "show me first". You review a plan for free instead of reviewing a diff.
