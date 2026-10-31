import type Anthropic from "@anthropic-ai/sdk";
import { checkBand, type Worksheet, worksheetSchema } from "@workshop/shared";
import { z } from "zod";
import type { AgentResult, ChatMessage } from "./agent.ts";
import { MODEL, type Usage } from "./model.ts";
import { buildSystemPrompt } from "./prompt.ts";

const MAX_ITERATIONS = 4;

const SUBMIT_TOOL = {
  name: "submit_worksheet",
  description: "Submit the finished worksheet. Returns problems to fix, or ok.",
  input_schema: z.toJSONSchema(worksheetSchema) as Anthropic.Tool.InputSchema,
};

// The same agent as agent.ts, with the loop written out. Teaching copy: the product uses toolRunner.
export async function runManualAgent(
  client: Anthropic,
  messages: ChatMessage[],
): Promise<AgentResult> {
  const history: Anthropic.MessageParam[] = [...messages];
  const usage: Usage = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
  let submitted: Worksheet | null = null;
  let last = "";

  for (let turn = 0; turn < MAX_ITERATIONS; turn++) {
    const reply = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: [{ type: "text", text: buildSystemPrompt(), cache_control: { type: "ephemeral" } }],
      tools: [SUBMIT_TOOL],
      messages: history,
    });
    usage.input += reply.usage.input_tokens;
    usage.output += reply.usage.output_tokens;
    usage.cacheRead += reply.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += reply.usage.cache_creation_input_tokens ?? 0;
    last = reply.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n");

    // Anything but a tool request means the model is done talking.
    if (reply.stop_reason !== "tool_use") break;

    history.push({ role: "assistant", content: reply.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of reply.content) {
      if (block.type !== "tool_use") continue;
      results.push({ type: "tool_result", tool_use_id: block.id, content: runTool(block.input) });
      if (results.at(-1)?.content === "ok") submitted = worksheetSchema.parse(block.input);
    }
    history.push({ role: "user", content: results });
  }

  if (submitted) return { kind: "worksheet", sheet: submitted, usage };
  if (last.trim()) return { kind: "question", text: last.trim(), usage };
  return { kind: "failed", usage };
}

function runTool(input: unknown): string {
  const parsed = worksheetSchema.safeParse(input);
  if (!parsed.success) return `Problems: ${parsed.error.issues.map((i) => i.message).join("; ")}`;
  const verdict = checkBand(parsed.data);
  return verdict.ok ? "ok" : `Problems: ${verdict.problems.join("; ")}`;
}
