# Run a proof and keep the receipt

**Pairs with:** `docs/levels/verification.md`
**Help:** hinted

## Warm-up

What makes a change done?
From: start-02
Answer: A command you can run says so, not a sentence saying it works.

## Goal

Run one level's proof and save the output, so you can show the team it passed.

## Predict

You run a level's proof through tee. What do you get that a plain run does not give you?

Answer: A saved receipt. The output prints as it runs and also lands in a file you can show the team.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
3. Run the proof: `make prove LEVEL=hand-built | tee .labs/work/prove.txt`.
   Expect: A line starting `PASS hand-built:` that says every band renders and lints clean, followed by a count of bands. The count may differ. A line starting `FAIL` names the claim that broke.
4. Run the exercise view: `make exercise LEVEL=hand-built TRACK=b`. It prints `PASS` when the level is green. On a red level, track `a` adds a hint and track `b` prints only the failing line.
   Expect: A line reading `PASS`. A `FAIL` line names what to fix.

## Proof

1. prove.txt has a line starting with PASS hand-built.

   ```sh
   grep -q '^PASS hand-built' .labs/work/prove.txt
   ```

## Hints

1. The proof checks for a line starting `PASS hand-built` in `.labs/work/prove.txt`.
2. `tee` prints and saves at once.
3. If it prints FAIL, the line says which claim broke. Fix that, not the check.
4. Commands, in order: `mkdir -p .labs/work`, `make prove LEVEL=hand-built | tee .labs/work/prove.txt`, `make exercise LEVEL=hand-built TRACK=b`.

## What you just learned

A proof is a command with a verdict. Share the output, not a sentence saying it works.
