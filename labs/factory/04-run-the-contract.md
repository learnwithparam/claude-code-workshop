# Check the workflow contract

**Pairs with:** `docs/factory/f8-workflows.md`
**Help:** goal

## Goal

Run the workflow contract tests and save the log to .labs/work/contract.log, then read what passed or failed. This shows the stages and their artifacts agree. The proof below must pass.

## Steps

1. Read the workflow module doc.
2. Make the lab work folder.
3. Run the contract tests and save the whole log.
4. Read the end of the log.

## Proof

1. contract.log says passed.

   ```sh
   grep -q 'passed' .labs/work/contract.log
   ```
2. contract.log has no failed.

   ```sh
   f=.labs/work/contract.log; test -f $f && ! grep -q 'failed' $f
   ```
3. contract.log shows passed tests and names a contract test file that exists.

   ```sh
   f=.labs/work/contract.log
   grep -Eq 'Tests +[0-9]+ passed' $f && ! grep -q 'failed' $f || exit 1
   for t in $(grep -Eo 'tests/contract/[A-Za-z0-9_./-]+[.]test[.]ts' $f); do test -f "$t" && exit 0; done
   exit 1
   ```

## Hints

1. The proof reads `.labs/work/contract.log` for `passed` and no `failed`.
2. The tests live in `tests/contract/`.
3. A failure names the workflow file. Open it under `.factory/workflows/`.
4. Commands: `cat docs/factory/f8-workflows.md`, `mkdir -p .labs/work`, `npx vitest run tests/contract > .labs/work/contract.log 2>&1`, `tail -8 .labs/work/contract.log`.

## What you just learned

A workflow is data, and a test walks every one. You change a stage by editing a file and the contract tells you what you broke.
