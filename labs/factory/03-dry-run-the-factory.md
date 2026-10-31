# See what a run would do

**Pairs with:** `docs/factory/f3-build.md`

## Goal

Run the factory in dry-run mode and read which model, turn cap and budget each stage gets.

## Predict

A dry run prints the plan for each stage. Does it call the model or spend any budget?

Answer: No. A dry run only reads the config and prints what each stage would get, so it costs nothing.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
2. Dry run, no key and no spend: `make factory ISSUE=1 FLAGS=--dry-run | tee .labs/work/dry-run.txt`.
3. Read the config behind it: `cat .factory/config.json`.
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
