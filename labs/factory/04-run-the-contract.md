# Check the workflow contract

**Pairs with:** `docs/factory/f8-workflows.md`

## Goal

Run the workflow contract tests and keep the log, so you know the stages and their artifacts are consistent.

## Steps

1. Read the module: `cat docs/factory/f8-workflows.md`.
2. Make the folder: `mkdir -p .labs/work`.
3. Run the contract tests: `npx vitest run tests/contract > .labs/work/contract.log 2>&1`.
4. Read what failed or passed: `tail -8 .labs/work/contract.log`.

## Proof

1. contract.log says passed.

   ```sh
   grep -q 'passed' .labs/work/contract.log
   ```
2. contract.log has no failed.

   ```sh
   f=.labs/work/contract.log; test -f $f && ! grep -q 'failed' $f
   ```

## Hints

1. The proof reads `.labs/work/contract.log` for `passed` and no `failed`.
2. The tests live in `tests/contract/`.
3. A failure names the workflow file. Open it under `.factory/workflows/`.

## What you just learned

A workflow is data, and a test walks every one. You change a stage by editing a file and the contract tells you what you broke.
