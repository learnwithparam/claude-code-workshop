# Check the workflow contract

**Pairs with:** `docs/factory/f8-workflows.md`

## Goal

Run the workflow contract tests and keep the log, so you know the stages and their artifacts are consistent.

## Steps

1. Read the module: `cat docs/factory/f8-workflows.md`.
2. Make the folder: `mkdir -p .labs/work`.
3. Run the contract tests: `npx vitest run factory/engine/workflows.test.ts > .labs/work/contract.log 2>&1`.
4. Read what failed or passed: `tail -8 .labs/work/contract.log`.

## Proof

```sh
grep -q 'passed' .labs/work/contract.log && ! grep -q 'failed' .labs/work/contract.log
```

## Hints

1. The proof reads `.labs/work/contract.log` for `passed` and no `failed`.
2. The test is `factory/engine/workflows.test.ts`. It loads every file in `.factory/workflows/`.
3. A failure names the workflow it broke on. Open that file under `.factory/workflows/`.

## What you just learned

A workflow is data, and a test walks every one. You change a stage by editing a file and the contract tells you what you broke.
