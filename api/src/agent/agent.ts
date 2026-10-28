import type Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { checkBand, type Worksheet, worksheetSchema } from "@workshop/shared";
import { MODEL, type Usage } from "./model.ts";
import { buildSystemPrompt } from "./prompt.ts";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type AgentResult =
  | { kind: "question"; text: string; usage: Usage }
  | { kind: "worksheet"; sheet: Worksheet; usage: Usage }
  | { kind: "failed"; usage: Usage };

const MAX_ITERATIONS = 4;

// The official agentic loop: call, run tool, feed the result back, repeat. No Claude Code process.
export async function runAgent(client: Anthropic, messages: ChatMessage[]): Promise<AgentResult> {
  let submitted: Worksheet | null = null;

  const submit = betaZodTool({
    name: "submit_worksheet",
    description: "Submit the finished worksheet. Returns problems to fix, or ok.",
    inputSchema: worksheetSchema,
    run: (sheet) => {
      const verdict = checkBand(sheet);
      if (!verdict.ok) return `Problems: ${verdict.problems.join("; ")}`;
      submitted = sheet;
      return "ok";
    },
  });

  const runner = client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 2000,
    max_iterations: MAX_ITERATIONS,
    system: [{ type: "text", text: buildSystemPrompt(), cache_control: { type: "ephemeral" } }],
    tools: [submit],
    messages,
  });

  const usage: Usage = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
  let last = "";
  for await (const message of runner) {
    usage.input += message.usage.input_tokens;
    usage.output += message.usage.output_tokens;
    usage.cacheRead += message.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += message.usage.cache_creation_input_tokens ?? 0;
    last = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n");
  }

  if (submitted) return { kind: "worksheet", sheet: submitted, usage };
  if (last.trim()) return { kind: "question", text: last.trim(), usage };
  return { kind: "failed", usage };
}
