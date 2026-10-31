# Run a proof and keep the receipt

**Pairs with:** `docs/levels/verification.md`

## Goal

Run one level's proof and save the output, so you can show the team it passed.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
2. Run the proof: `make prove LEVEL=hand-built | tee .labs/work/prove.txt`.
   Expect: A line starting `PASS hand-built:` that says every band renders and lints clean, followed by a count of bands. The count may differ. A line starting `FAIL` names the claim that broke.
3. Run the exercise view: `make exercise LEVEL=hand-built TRACK=b`.
   Expect: A line reading `PASS`. A `FAIL` line names what to fix.

## Proof

```sh
grep -q '^PASS hand-built' .labs/work/prove.txt
```

## Hints

1. The proof checks for a line starting `PASS hand-built` in `.labs/work/prove.txt`.
2. `tee` prints and saves at once.
3. If it prints FAIL, the line says which claim broke. Fix that, not the check.

## What you just learned

A proof is a command with a verdict. Share the output, not a sentence saying it works.
