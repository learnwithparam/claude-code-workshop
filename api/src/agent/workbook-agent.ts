import type Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import {
  buildWorkbook,
  checkWorkbook,
  type Workbook,
  type Worksheet,
  workbookContentSchema,
} from "@workshop/shared";
import { MODEL, type Usage } from "./model.ts";
import { buildWorkbookPrompt } from "./prompt.ts";

export type WorkbookResult =
  | { kind: "workbook"; workbook: Workbook; usage: Usage }
  | { kind: "failed"; usage: Usage };

const MAX_ITERATIONS = 4;

// The model fills chapters from the worksheet; shared/ builds contents, key and pages.
export async function runWorkbookAgent(
  client: Anthropic,
  sheet: Worksheet,
): Promise<WorkbookResult> {
  let submitted: Workbook | null = null;

  const submit = betaZodTool({
    name: "submit_workbook",
    description: "Submit the finished workbook content. Returns problems to fix, or ok.",
    inputSchema: workbookContentSchema,
    run: (content) => {
      // The band is the source worksheet's, never the model's choice.
      if (content.band !== sheet.band) return `Problems: band must stay ${sheet.band}`;
      const workbook = buildWorkbook(content);
      const verdict = checkWorkbook(workbook);
      if (!verdict.ok) return `Problems: ${verdict.problems.join("; ")}`;
      submitted = workbook;
      return "ok";
    },
  });

  const runner = client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 4000,
    max_iterations: MAX_ITERATIONS,
    system: [{ type: "text", text: buildWorkbookPrompt(), cache_control: { type: "ephemeral" } }],
    tools: [submit],
    messages: [{ role: "user", content: JSON.stringify(sheet) }],
  });

  const usage: Usage = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
  for await (const message of runner) {
    usage.input += message.usage.input_tokens;
    usage.output += message.usage.output_tokens;
    usage.cacheRead += message.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += message.usage.cache_creation_input_tokens ?? 0;
  }

  return submitted ? { kind: "workbook", workbook: submitted, usage } : { kind: "failed", usage };
}
