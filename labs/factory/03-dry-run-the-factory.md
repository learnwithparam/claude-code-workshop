# See what a run would do

**Pairs with:** `docs/factory/f3-build.md`
**Help:** goal

## Warm-up

What does plan mode let you review for free?
From: start-03
Answer: The plan, before any edit. A dry run does the same for a factory run.

## Goal

Run the factory in dry-run mode for issue 1, save its output to .labs/work/dry-run.txt, and find which stage has the largest budget. The dry run needs no key and spends nothing. The proof below must pass.

## Predict

A dry run prints the plan for each stage. Does it call the model or spend any budget?

Answer: No. A dry run only reads the config and prints what each stage would get, so it costs nothing.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Make the lab work folder.
3. Run the factory for issue 1 in dry-run mode and save what it prints.
4. Read the factory config behind it.
5. Note which stage has the largest budget.

## Proof

1. dry-run.txt lists the stages that would run.

   ```sh
   grep -q 'stages that would run' .labs/work/dry-run.txt
   ```
2. dry-run.txt mentions the review loop.

   ```sh
   grep -q 'review loop' .labs/work/dry-run.txt
   ```

## Hints

1. The proof reads `.labs/work/dry-run.txt`. Did `tee` write it?
2. `FLAGS=--dry-run` makes the runner print and stop.
3. Run `make factory ISSUE=1 FLAGS=--dry-run` from the repo root.
4. Commands: `mkdir -p .labs/work`, `make factory ISSUE=1 FLAGS=--dry-run | tee .labs/work/dry-run.txt`, `cat .factory/config.json`.

## What you just learned

Every stage has a model, a turn cap and a budget set in config. You can read the cost of a run before you start it.
