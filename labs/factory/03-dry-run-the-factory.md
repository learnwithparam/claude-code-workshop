# See what a run would do

**Pairs with:** `docs/factory/f3-build.md`

## Goal

Run the factory in dry-run mode and read which model, turn cap and budget each stage gets.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
2. Dry run, no key and no spend: `make factory ISSUE=1 FLAGS=--dry-run | tee .labs/work/dry-run.txt`.
   Expect: A heading `Issue #1: stages that would run, from .factory/config.json`, then one line per stage with a model name, `turns<=` a number and `budget<=` a dollar amount, and last a `review loop:` line. Model names and numbers can change with the config; the stage names do not.
3. Read the config behind it: `cat .factory/config.json`.
   Expect: JSON with `allowedModels` and a `stages` object. Each stage has `model`, `maxTurns`, `maxBudgetUsd` and `permissionMode`.
4. Note which stage has the largest budget.

## Proof

```sh
grep -q 'stages that would run' .labs/work/dry-run.txt && grep -q 'review loop' .labs/work/dry-run.txt
```

## Hints

1. The proof reads `.labs/work/dry-run.txt`. Did `tee` write it?
2. `FLAGS=--dry-run` makes the runner print and stop.
3. Run `make factory ISSUE=1 FLAGS=--dry-run` from the repo root.

## What you just learned

Every stage has a model, a turn cap and a budget set in config. You can read the cost of a run before you start it.
