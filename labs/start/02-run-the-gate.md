# Run the gate yourself

**Pairs with:** `docs/levels/hand-built.md`
**Help:** guided

## Goal

Run the repo's own tests and keep the log, so you know what green looks like before Claude touches anything.

## Steps

1. Install once: `npm ci`.
2. Run the shared tests and save the log: `mkdir -p .labs/work && npx vitest run shared/ > .labs/work/gate.log 2>&1`.
3. Read the last lines: `tail -5 .labs/work/gate.log`.

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
