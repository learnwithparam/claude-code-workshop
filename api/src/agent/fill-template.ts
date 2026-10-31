import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { MODEL, type Usage } from "./model.ts";

export type FillResult =
  | { kind: "slots"; values: string[]; usage: Usage }
  | { kind: "failed"; usage: Usage };

export type FillArgs = { slots: string[]; prompt: string };

// The model sees only the request and the slot names. Layout never leaves shared/.
export async function fillSlots(
  client: Anthropic,
  { slots, prompt }: FillArgs,
): Promise<FillResult> {
  const reply = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: `Fill ${slots.length} worksheet items for the request. One value per slot, in order, as "question => answer". Keep each short.`,
    tools: [
      {
        name: "submit_slots",
        description: "Submit one value per slot.",
        input_schema: {
          type: "object",
          properties: {
            values: {
              type: "array",
              items: { type: "string" },
              minItems: slots.length,
              maxItems: slots.length,
            },
          },
          required: ["values"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_slots" },
    messages: [{ role: "user", content: `${prompt}\nSlots: ${slots.join(", ")}` }],
  });
  const usage: Usage = {
    input: reply.usage.input_tokens,
    output: reply.usage.output_tokens,
    cacheRead: reply.usage.cache_read_input_tokens ?? 0,
    cacheWrite: reply.usage.cache_creation_input_tokens ?? 0,
  };
  const block = reply.content.find((b) => b.type === "tool_use");
  const parsed = z.object({ values: z.array(z.string()) }).safeParse(block?.input);
  return parsed.success
    ? { kind: "slots", values: parsed.data.values, usage }
    : { kind: "failed", usage };
}
