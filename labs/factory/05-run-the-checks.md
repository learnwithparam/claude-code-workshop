# Run the checks that stop a bad test

**Pairs with:** `docs/factory/f4-test.md`
**Help:** goal

## Warm-up

What does the dry run print before a run spends anything?
From: factory-03
Answer: Each stage with its model, turn cap and budget.

## Goal

Run the factory's own check tests and save the whole log to .labs/work/checks.log. These checks (plan-drift, holdout, mutation, manifest-deps) are evidence the model cannot talk past. The proof below must pass.

## Predict

A check passes or fails on an exit code or a hash. If the model says "done" but the check fails, which one does the factory believe?

Answer: The check. The runner reads the exit code, never the model's word.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read the test stage doc.
3. Make the lab work folder.
4. Run every test under `factory/engine/checks` and save the whole log.
5. Read which check files the log lists.

## Proof

1. checks.log says passed.

   ```sh
   grep -q 'passed' .labs/work/checks.log
   ```
2. checks.log has no failed.

   ```sh
   f=.labs/work/checks.log; test -f $f && ! grep -q 'failed' $f
   ```
3. checks.log lists at least three check test files that exist.

   ```sh
   f=.labs/work/checks.log
   grep -Eq 'Tests +[0-9]+ passed' $f && ! grep -q 'failed' $f || exit 1
   n=0
   for t in $(grep -Eo 'factory/engine/checks/[A-Za-z0-9_./-]+[.]test[.]ts' $f | sort -u); do test -f "$t" && n=$((n+1)); done
   test "$n" -ge 3
   ```

## Hints

1. The proof reads `.labs/work/checks.log` for `passed`, no `failed` and the check files by name.
2. Point vitest at the folder `factory/engine/checks`, not at one file.
3. Redirect both output streams into the log with `> file 2>&1`.
4. Commands: `cat docs/factory/f4-test.md`, `mkdir -p .labs/work`, `npx vitest run factory/engine/checks > .labs/work/checks.log 2>&1`, `grep '✓' .labs/work/checks.log`.

## What you just learned

Each check is code with its own test. A claim like "the tests pass" is only worth what a check can reproduce from an exit code.
