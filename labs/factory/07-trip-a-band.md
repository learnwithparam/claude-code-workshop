# Trip a band and read the intent it writes

**Pairs with:** `docs/factory/f7-maintain.md`
**Help:** goal

## Warm-up

Which of the dry run's stages uses Opus?
From: factory-03
Answer: Delivery. The mechanical stages use Haiku.

## Goal

ci-failure-rate has run between 9 and 11 for ten runs. Save a three sigma breach to .labs/work/latest.txt and the intent the factory writes for it to .labs/work/intent.md. No model decides this. The proof must pass.

## Predict

The new run's metric is 12, a little above the usual 10. Does the factory open a new intent for it?

Answer: No. 12 is within about one sigma of the rolling mean, so at most it logs. Only three sigma writes an intent.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read the maintain stage doc.
3. Make the lab work folder.
4. [editor] Write one number to `.labs/work/latest.txt` that you expect to be a three sigma breach.
   Expect: A file with one number and nothing else.
5. Print the sigma and the action for your number with the first script in the hints.
   Expect: Two words, such as `3 intent`. A smaller breach prints a smaller sigma.
6. If the action is not `intent`, pick a bigger number and run it again. Then save the intent with the second script in the hints.
   Expect: A short markdown file that says the metric is outside its band.

## Proof

1. latest.txt holds one number.

   ```sh
   grep -Eq '^[0-9]+([.][0-9]+)?$' .labs/work/latest.txt
   ```
2. That number is a three sigma breach against the fixed history, so the action is intent.

   ```sh
   cat > .labs/work/band.ts <<'TS'
   import { readFileSync } from "node:fs";
   import { actionFor, detect } from "../../factory/engine/bands.ts";
   const history = [10, 11, 9, 10, 10, 11, 9, 10, 10, 11];
   const latest = Number(readFileSync(".labs/work/latest.txt", "utf8"));
   const b = detect("ci-failure-rate", history, latest, "up-is-bad");
   console.log(b.sigma, actionFor(b));
   TS
   test "$(npx tsx .labs/work/band.ts)" = "3 intent"
   ```
3. intent.md is the intent the factory writes for your number.

   ```sh
   cat > .labs/work/want.ts <<'TS'
   import { readFileSync } from "node:fs";
   import { detect, intentFor } from "../../factory/engine/bands.ts";
   const history = [10, 11, 9, 10, 10, 11, 9, 10, 10, 11];
   const latest = Number(readFileSync(".labs/work/latest.txt", "utf8"));
   process.stdout.write(intentFor(detect("ci-failure-rate", history, latest, "up-is-bad")));
   TS
   test -s .labs/work/intent.md && test "$(npx tsx .labs/work/want.ts)" = "$(cat .labs/work/intent.md)"
   ```

## Hints

1. The history is fixed at 10, 11, 9, 10, 10, 11, 9, 10, 10, 11. Its mean is about 10 and its spread is small.
2. Three sigma is three spreads above the mean. A value only a little above 10 will not do.
3. `intentFor` and `detect` live in `factory/engine/bands.ts`. The proof runs them on your number.
4. Commands: `cat docs/factory/f7-maintain.md`, `mkdir -p .labs/work`, `echo 30 > .labs/work/latest.txt`, `npx tsx -e 'import("./factory/engine/bands.ts").then(m=>{const b=m.detect("ci-failure-rate",[10,11,9,10,10,11,9,10,10,11],Number(process.argv[1]),"up-is-bad");console.log(b.sigma,m.actionFor(b))})' "$(cat .labs/work/latest.txt)"`, `npx tsx -e 'import("./factory/engine/bands.ts").then(m=>process.stdout.write(m.intentFor(m.detect("ci-failure-rate",[10,11,9,10,10,11,9,10,10,11],Number(process.argv[1]),"up-is-bad"))))' "$(cat .labs/work/latest.txt)" > .labs/work/intent.md`.

## What you just learned

A breach is arithmetic, not opinion. One sigma logs, two asks for a diagnosis and three writes the intent.md a new run starts from.
