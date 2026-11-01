# Count the votes behind a review

**Pairs with:** `docs/factory/f5-review.md`
**Help:** goal

## Warm-up

Which stage has the largest budget in the dry run?
From: factory-03
Answer: Build, at three dollars.

## Goal

Save the review rules the engine enforces to .labs/work/review-rules.txt and the review tests' log to .labs/work/review.log. The rules file must match what the code says now. The proof below must pass.

## Predict

Three verifiers vote on a finding and only two votes are needed. If one verifier says yes and two say no, does the finding reach the pull request?

Answer: No. It has one vote, below the two needed, so it is dropped. An agent's lone opinion never counts.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read the review stage doc.
3. Make the lab work folder.
4. Print the four review limits from `factory/engine/review.ts` into review-rules.txt.
   Expect: One line in the file: voters, needed, nits and rounds, each followed by a number.
5. Run the review tests and save the whole log to review.log.

## Proof

1. review.log says passed and names review.test.ts.

   ```sh
   f=.labs/work/review.log
   grep -Eq '[0-9]+ passed' $f && ! grep -q 'failed' $f && grep -q 'factory/engine/review.test.ts' $f
   ```
2. review-rules.txt holds the four limits.

   ```sh
   grep -Eq '^voters [0-9]+ needed [0-9]+ nits [0-9]+ rounds [0-9]+$' .labs/work/review-rules.txt
   ```
3. review-rules.txt matches the code today.

   ```sh
   fresh=$(npx tsx -e 'import("./factory/engine/review.ts").then(m=>console.log("voters",m.VOTERS,"needed",m.NEEDED,"nits",m.MAX_NITS,"rounds",m.MAX_ROUNDS))')
   test -n "$fresh" && test "$(cat .labs/work/review-rules.txt)" = "$fresh"
   ```

## Hints

1. Two files: review-rules.txt from a one-line script, review.log from vitest.
2. The limits are exported constants in `factory/engine/review.ts`: VOTERS, NEEDED, MAX_NITS and MAX_ROUNDS.
3. The line must read exactly `voters 3 needed 2 nits 3 rounds 3`, so print the constants, do not type them.
4. Commands: `cat docs/factory/f5-review.md`, `mkdir -p .labs/work`, `npx tsx -e 'import("./factory/engine/review.ts").then(m=>console.log("voters",m.VOTERS,"needed",m.NEEDED,"nits",m.MAX_NITS,"rounds",m.MAX_ROUNDS))' > .labs/work/review-rules.txt`, `npx vitest run factory/engine/review.test.ts > .labs/work/review.log 2>&1`.

## What you just learned

Review is a vote, not a verdict. Two of three verifiers must agree, nits are capped and the loop stops after three rounds, and the tests pin all four numbers.
