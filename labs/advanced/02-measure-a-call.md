# Measure what a call costs

**Pairs with:** `docs/agent/agent-sdk.md`

## Goal

Run one headless call with a turn cap and read its cost from the JSON result.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
2. Call with a cap: `claude -p "List the folders in this repo." --max-turns 2 --output-format json > .labs/work/call.json`.
   Expect: No output on screen, because it all goes to `call.json`. It may take a few seconds. The file holds one JSON object that includes `total_cost_usd`.
3. Read the cost: `node -e "console.log(require('./.labs/work/call.json').total_cost_usd)"`.
   Expect: One small number such as `0.0123`. Yours will differ.
4. Write the number into `.labs/work/cost.txt`.
   Expect: No output. `.labs/work/cost.txt` holds that one number and nothing else.

## Proof

```sh
grep -q 'total_cost_usd' .labs/work/call.json && grep -Eq '^[0-9]+(\.[0-9]+)?$' .labs/work/cost.txt
```

## Hints

1. Two files: `.labs/work/call.json` from the call and `.labs/work/cost.txt` with one number.
2. `echo 0.012 > .labs/work/cost.txt` shows the shape. Use your own number.
3. `--max-turns` stops the loop, so the cost has a ceiling.

## What you just learned

Cost is a field in the output, not a surprise on the invoice. Cap the turns and read the number.
