# Measure what a call costs

**Pairs with:** `docs/agent/agent-sdk.md`

## Goal

Run one headless call with a turn cap and read its cost from the JSON result.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
2. Call with a cap: `claude -p "List the folders in this repo." --max-turns 2 --output-format json > .labs/work/call.json`.
3. Read the cost: `node -e "console.log(require('./.labs/work/call.json').total_cost_usd)"`.
4. Write the number into `.labs/work/cost.txt`.

## Proof

```sh
node -e "const j=require('./.labs/work/call.json'); const c=require('fs').readFileSync('.labs/work/cost.txt','utf8').trim(); process.exit(j.type==='result' && typeof j.total_cost_usd==='number' && /^[0-9.e-]+$/.test(c) && Number(c)===j.total_cost_usd ? 0 : 1)"
```

## Hints

1. Two files: `.labs/work/call.json` from the call and `.labs/work/cost.txt` with one number.
2. The proof compares `cost.txt` with `total_cost_usd` in `call.json`, so copy the number from step 3. Do not type your own.
3. `--max-turns` stops the loop, so the cost has a ceiling.

## What you just learned

Cost is a field in the output, not a surprise on the invoice. Cap the turns and read the number.
