# Measure what a call costs

**Pairs with:** `docs/agent/agent-sdk.md`
**Help:** goal

## Warm-up

What can you read about a run before you start it?
From: factory-03
Answer: The model, turn cap and budget of every stage, all set in config.

## Goal

Make one headless Claude call capped at two turns, save its JSON result to .labs/work/call.json, and write the call's cost in dollars, as a bare number, to .labs/work/cost.txt. The proof below must pass.

## Steps

1. Make the lab work folder.
2. Ask Claude to list this repo's folders, with a turn cap and JSON output, saved to a file.
3. Read the cost field out of that JSON.
4. Write the number alone into the cost file.

## Proof

1. call.json records total_cost_usd.

   ```sh
   grep -q 'total_cost_usd' .labs/work/call.json
   ```
2. cost.txt holds one plain number.

   ```sh
   grep -Eq '^[0-9]+(\.[0-9]+)?$' .labs/work/cost.txt
   ```

## Hints

1. Two files: `.labs/work/call.json` from the call and `.labs/work/cost.txt` with one number.
2. `echo 0.012 > .labs/work/cost.txt` shows the shape. Use your own number.
3. `--max-turns` stops the loop, so the cost has a ceiling.
4. Commands: `mkdir -p .labs/work`, `claude -p "List the folders in this repo." --max-turns 2 --output-format json > .labs/work/call.json`, `node -e "console.log(require('./.labs/work/call.json').total_cost_usd)"`.

## What you just learned

Cost is a field in the output, not a surprise on the invoice. Cap the turns and read the number.
