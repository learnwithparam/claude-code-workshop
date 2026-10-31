# Run the gate yourself

**Pairs with:** `docs/levels/hand-built.md`
**Help:** guided

## Warm-up

Does `claude -p` open a chat window or print an answer?
From: start-01
Answer: It prints the answer and exits, so you can use it in a script or a pipe.

## Goal

Run the repo's own tests and keep the log, so you know what green looks like before Claude touches anything.

## Predict

The gate is already green on a clean checkout. What does the log contain when you send both output and errors into it?

Answer: The full test summary, with a passed line and no failed line, because a clean checkout has nothing red to report.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Install once: `npm ci`.
   Expect: A progress summary from npm ending with a line like `added N packages`. It may print audit warnings; those are fine.
3. Run the shared tests and save the log: `mkdir -p .labs/work && npx vitest run shared/ > .labs/work/gate.log 2>&1`.
   Expect: No output on screen, because it all goes to `gate.log`. It finishes in a few seconds.
4. Read the last lines: `tail -5 .labs/work/gate.log`.
   Expect: Vitest summary lines such as `Test Files  N passed` and `Tests  N passed`. The counts will differ. Any line with `failed` means something broke.

## Proof

1. gate.log says passed.

   ```sh
   grep -q 'passed' .labs/work/gate.log
   ```
2. gate.log has no failed.

   ```sh
   f=.labs/work/gate.log; test -f $f && ! grep -q 'failed' $f
   ```
3. gate.log shows passed tests and names a test file under shared that exists.

   ```sh
   f=.labs/work/gate.log
   grep -Eq 'Tests +[0-9]+ passed' $f && ! grep -q 'failed' $f || exit 1
   for t in $(grep -Eo 'shared/[A-Za-z0-9_./-]+[.]test[.]ts' $f); do test -f "$t" && exit 0; done
   exit 1
   ```

## Hints

1. The proof wants the word `passed` in `.labs/work/gate.log` and no `failed`.
2. `2>&1` sends errors into the same log as the output.
3. If a test fails, you changed something under `shared/`. Undo it and run the step again.

## What you just learned

A change is only done when a command you can run says so. Know the green output first, then judge Claude's work against it.
