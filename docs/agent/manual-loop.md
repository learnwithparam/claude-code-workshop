# The manual loop: call, run the tool, feed it back

**Track:** build the agent. **Proof:** `npx vitest run api/src/agent/manual-loop.test.ts`.

## Goal

Write the agent loop yourself, and prove it returns the same result as the SDK's tool runner.

## The problem

A model cannot run your code. It can only ask for a tool to run. Something must run it, add the result to the chat, and call again. If that something has no limit, one bad worksheet can loop forever and spend your budget.

## Without

Call once and take the first reply. If the model submits a worksheet with 60 items for a kindergarten band, you have nothing to send back. The page gets a bad sheet.

## The code

`runManualAgent` in `api/src/agent/manual-loop.ts` is about 60 lines:

1. Call the model with the history.
2. Add up the usage.
3. If `stop_reason` is not `tool_use`, stop.
4. Otherwise, add the assistant reply to the history, run each requested tool, and add a `tool_result` for it.
5. Repeat, at most `MAX_ITERATIONS` times.

The tool is `submit_worksheet`. It checks the sheet with zod and then `checkBand`. A bad sheet returns `Problems: ...` so the model can fix it. A good one returns `ok`.

## With

Give the loop a script: first an overfull sheet, then a good one, then a closing line. It sends the problems back, takes the fixed sheet, and returns it as a worksheet.

## Run it

1. Open `api/src/agent/manual-loop.test.ts`. Find `scripted`: a real SDK client whose network is a list of replies.
2. Type `npx vitest run api/src/agent/manual-loop.test.ts`. Expect 3 passed.
3. In `manual-loop.ts`, change `MAX_ITERATIONS` from 4 to 9 and run it again. Expect the cap test to fail. Change it back.

## Prove it

The test runs the same scripted turns through `runAgent` (the tool runner) and `runManualAgent`, and asserts the results are equal and the number of calls is equal. A second case sends an overfull sheet every turn and asserts both loops give up with `failed` after 4 calls.

## Exercise

Track A: make the loop stop with `failed` when the same problems come back twice in a row. Track B: stream the reply and show each tool call in the chat as it happens.

## Discussion

Where is the limit on your own agents: turns, tokens, money, or time? Which one stops a runaway first?
