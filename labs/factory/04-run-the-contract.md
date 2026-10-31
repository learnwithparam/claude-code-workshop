# Check the workflow contract

**Pairs with:** `docs/factory/f8-workflows.md`

## Goal

Run the workflow contract tests and keep the log, so you know the stages and their artifacts are consistent.

## Steps

1. Read the module: `cat docs/factory/f8-workflows.md`.
   Expect: The text of the workflow module, describing stages and the artifacts each one produces.
2. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
3. Run the contract tests: `npx vitest run tests/contract > .labs/work/contract.log 2>&1`.
   Expect: No output on screen, because it all goes to `contract.log`. It finishes in a few seconds.
4. Read what failed or passed: `tail -8 .labs/work/contract.log`.
   Expect: Vitest summary lines near the end, such as `Test Files  N passed` and `Tests  N passed`. The numbers will differ. A `failed` line names the workflow file to open.

## Proof

```sh
grep -q 'passed' .labs/work/contract.log && ! grep -q 'failed' .labs/work/contract.log
```

## Hints

1. The proof reads `.labs/work/contract.log` for `passed` and no `failed`.
2. The tests live in `tests/contract/`.
3. A failure names the workflow file. Open it under `.factory/workflows/`.

## What you just learned

A workflow is data, and a test walks every one. You change a stage by editing a file and the contract tells you what you broke.
