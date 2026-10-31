# Measure what a call costs

**Pairs with:** `docs/agent/agent-sdk.md`
**Help:** goal

## Warm-up

What can you read about a run before you start it?
From: factory-03
Answer: The model, turn cap and budget of every stage, all set in config.

## Goal

Make one headless Claude call capped at two turns, save its JSON result to .labs/work/call.json, and write the call's `total_cost_usd`, copied exactly as a bare number, to .labs/work/cost.txt. The proof below must pass.

## Predict

Where does the cost of a headless call show up: on the invoice later, or in the call's own output?

Answer: In the call's own JSON output, as a total_cost_usd field, so you can read the number right after the call.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Make the lab work folder.
3. Ask Claude to list this repo's folders, with a turn cap and JSON output, saved to a file.
4. Read the cost field out of that JSON.
5. [editor] Write the number alone into the cost file.

## Proof

1. call.json records total_cost_usd.

   ```sh
   grep -q 'total_cost_usd' .labs/work/call.json
   ```
2. cost.txt holds one plain number.

   ```sh
   grep -Eq '^[0-9]+(\.[0-9]+)?$' .labs/work/cost.txt
   ```
3. call.json is a real result and cost.txt holds exactly its total_cost_usd.

   ```sh
   node -e "const j=require('./.labs/work/call.json'); const c=require('fs').readFileSync('.labs/work/cost.txt','utf8').trim(); process.exit(j.type==='result' && typeof j.total_cost_usd==='number' && /^[0-9.e-]+$/.test(c) && Number(c)===j.total_cost_usd ? 0 : 1)"
   ```

## Hints

1. Two files: `.labs/work/call.json` from the call and `.labs/work/cost.txt` with one number.
2. The proof compares `cost.txt` with `total_cost_usd` in `call.json`, so copy the number from the file. Do not type your own.
3. `--max-turns` stops the loop, so the cost has a ceiling.
4. Commands: `mkdir -p .labs/work`, `claude -p "List the folders in this repo." --max-turns 2 --output-format json > .labs/work/call.json`, `node -e "console.log(require('./.labs/work/call.json').total_cost_usd)"`.

## What you just learned

Cost is a field in the output, not a surprise on the invoice. Cap the turns and read the number.
