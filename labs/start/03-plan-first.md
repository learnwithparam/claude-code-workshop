# Plan before you edit

**Pairs with:** `docs/levels/context.md`
**Help:** guided

## Warm-up

How do you know a change is really done?
From: start-02
Answer: A command you can run says so. Know the green output before you judge Claude's work.

## Goal

Get a written plan for a small change from Claude without letting it edit a single file. The plan names a real file under `shared/`.

## Predict

If you ask Claude for a plan in plan mode, will it edit any file in the repo?

Answer: No. Plan mode is read-only, so Claude can read and search but the only thing written is the plan you redirect into a file.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
3. Ask for a plan only: `claude -p --permission-mode plan "Plan how to add a grade band for adult learners to shared/. List the files and how you will verify it." > .labs/work/plan.md`.
   Expect: No output on screen, and no files change. It may take several seconds, and the plan goes to `plan.md`.
4. Read the plan and check it names files that exist: `cat .labs/work/plan.md`.
   Expect: A plan of at least five lines that names real folders such as `shared/`, then a how-to-verify part. The wording will differ. If it names a file that does not exist, ask again.

## Proof

1. The plan mentions how you will verify it.

   ```sh
   grep -qi 'verify' .labs/work/plan.md
   ```
2. The plan has at least five non-empty lines.

   ```sh
   test "$(grep -c . .labs/work/plan.md)" -ge 5
   ```
3. The plan says how to verify and names a file under shared that exists.

   ```sh
   f=.labs/work/plan.md
   grep -qi 'verify' $f && test "$(grep -c . $f)" -ge 5 || exit 1
   for p in $(grep -Eo 'shared/[A-Za-z0-9_./-]+' $f | sed 's/[.]*$//'); do test -f "$p" && exit 0; done
   exit 1
   ```

## Hints

1. The proof wants at least five lines in `.labs/work/plan.md` that mention how to verify and name a real file under `shared/`.
2. Plan mode is read-only. Claude can look but not write.
3. Your prompt must ask for verification, or the plan may leave it out.

## What you just learned

Plan mode turns "do it" into "show me first". You review a plan for free instead of reviewing a diff.
