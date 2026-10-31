# Run the gate yourself

**Pairs with:** `docs/levels/hand-built.md`

## Goal

Run the repo's own tests and keep the log, so you know what green looks like before Claude touches anything.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
2. Install once: `npm ci`.
3. Run the shared tests and save the log: `mkdir -p .labs/work && npx vitest run shared/ > .labs/work/gate.log 2>&1`.
4. Read the last lines: `tail -5 .labs/work/gate.log`.

## Proof

```sh
grep -q 'passed' .labs/work/gate.log && ! grep -q 'failed' .labs/work/gate.log
```

## Hints

1. The proof wants the word `passed` in `.labs/work/gate.log` and no `failed`.
2. `2>&1` sends errors into the same log as the output.
3. If a test fails, you changed something under `shared/`. Undo it and run the step again.

## What you just learned

A change is only done when a command you can run says so. Know the green output first, then judge Claude's work against it.
