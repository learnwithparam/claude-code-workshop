# One call: an agent starts as a single request

**Track:** build the agent. **Proof:** `npx vitest run api/src/agent/manual-loop.test.ts`.

## Goal

See what one Messages API call returns, so the loop in the next step has nothing hidden in it.

## The problem

"Agent" sounds like a framework. It is a request, a reply and a rule for what to do with the reply. If you cannot point at each part, you cannot debug it.

## Without

Call the model with no tools and ask for a grade 3 fractions worksheet. You get prose. Nothing checks it against the band, and nothing makes it fit a page.

## The code

The request in `api/src/agent/manual-loop.ts` has four parts:

- `model`: the one name from `api/src/agent/model.ts`.
- `system`: the short prompt from `prompt.ts`, marked for caching.
- `tools`: one tool, `submit_worksheet`, whose input schema is the same zod schema the page renders.
- `messages`: the chat so far.

The reply has two parts that matter. `content` holds text blocks and `tool_use` blocks. `stop_reason` says why the model stopped: `end_turn` means it is done, `tool_use` means it wants something run.

## With

Read `reply.usage`. It counts input, cached input, and output tokens for this one call. The loop adds these up, which is where the usage chip in the app comes from.

## Run it

1. Type `make smoke`. Say "a worksheet". Expect one question about the grade, and a usage line.
2. Open `api/src/agent/manual-loop.ts`. Find the `client.messages.create` call and the line that reads `reply.stop_reason`.
3. Ask yourself which of the two values ends the loop.

## Prove it

`npx vitest run api/src/agent/manual-loop.test.ts` runs the loop against scripted replies. The "question" case is one call that ends with text and no tool.

## Exercise

Track A: change the system prompt and count how input tokens move. Track B: add a second tool that only counts words, and see what `stop_reason` does when the model uses both.

## Discussion

What would you log on every call in your own product, and who may read it?
