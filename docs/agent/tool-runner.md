# The tool runner: what the SDK does for you

**Track:** build the agent. **Proof:** `npx vitest run api/src/agent/manual-loop.test.ts`.

## Goal

Read the product agent next to the hand-written loop, and name each line the SDK replaced.

## The problem

You can write the loop, as the last step showed. The product should not carry it. Loops grow special cases: retries, caching, bad tool input. An SDK that is maintained by the model's maker keeps those up to date.

## Without

Keep the hand-written loop in the product. Every change to tool calls or caching is yours to track.

## The code

`api/src/agent/agent.ts` has the same job in about 50 lines:

- `betaZodTool` turns the zod schema into the tool definition and parses the input before your function runs. That replaces `z.toJSONSchema` and the `safeParse` in the manual version.
- `client.beta.messages.toolRunner` replaces the `for` loop, the history bookkeeping and the `tool_result` blocks.
- `max_iterations` replaces `MAX_ITERATIONS`.
- You still add up usage and still decide what the result means. The SDK runs the loop, not the product.

## With

Lay the two files side by side. Everything below the `tools` list in the manual version collapses into one `for await`. The behaviour is the same, and the test proves it.

## Run it

1. Type `diff api/src/agent/manual-loop.ts api/src/agent/agent.ts`.
2. Mark each removed block with the SDK feature that replaced it.
3. Type `npx vitest run api/src/agent/manual-loop.test.ts`. Expect 3 passed.

## Prove it

The same test as the last step. It is the proof that swapping the manual loop for the tool runner changes nothing a customer can see.

## Exercise

Track A: make the product agent log the stop reason of each turn. Track B: list two things the tool runner does that the manual loop does not, using the SDK's source.

## Discussion

The product uses the Messages API. The factory uses the Agent SDK, which runs the Claude Code program. When would your product need that second kind?
