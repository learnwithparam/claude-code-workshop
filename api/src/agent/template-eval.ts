import type Anthropic from "@anthropic-ai/sdk";
import { checkBand } from "@workshop/shared";
import { distillTemplate } from "../templates/distill-template.ts";
import type { AgentResult } from "./agent.ts";
import type { FillArgs, FillResult } from "./fill-template.ts";
import { withinLiveCap } from "./live-cap.ts";

type Deps = {
  prompt: string;
  spentUsd: number;
  estimateUsd: number;
  capUsd: number;
  client?: Anthropic;
  run: (client: Anthropic, messages: { role: "user"; content: string }[]) => Promise<AgentResult>;
  fill: (client: Anthropic, args: FillArgs) => Promise<FillResult>;
};

export type TemplateEval =
  | { kind: "over-budget"; message: string }
  | { kind: "report"; without: number; withTemplate: number; ok: boolean };

// Acceptance for the template feature: a slot fill must cost fewer output tokens than a full sheet.
export async function runTemplateEval(deps: Deps): Promise<TemplateEval> {
  if (!withinLiveCap(deps.spentUsd, deps.estimateUsd, deps.capUsd)) {
    return { kind: "over-budget", message: "Live-run budget cap would be exceeded; no call made." };
  }
  const client = deps.client ?? ({} as Anthropic);
  const full = await deps.run(client, [{ role: "user", content: deps.prompt }]);
  if (full.kind !== "worksheet" || !checkBand(full.sheet).ok) {
    return {
      kind: "report",
      without: full.usage.output,
      withTemplate: full.usage.output,
      ok: false,
    };
  }
  const distilled = distillTemplate(full.sheet, deps.prompt);
  if (!distilled.ok) {
    return {
      kind: "report",
      without: full.usage.output,
      withTemplate: full.usage.output,
      ok: false,
    };
  }
  const filled = await deps.fill(client, { slots: distilled.template.slots, prompt: deps.prompt });
  const withTemplate = filled.usage.output;
  return {
    kind: "report",
    without: full.usage.output,
    withTemplate,
    ok: withTemplate < full.usage.output,
  };
}
