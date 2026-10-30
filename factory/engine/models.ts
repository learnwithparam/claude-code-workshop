import { type FactoryConfig, STAGE_NAMES, type StageName, stageFor } from "../config.ts";

export const MODEL_ALIASES: Record<string, string> = {
  opus: "claude-opus-5-5",
  sonnet: "claude-sonnet-5-5",
  haiku: "claude-haiku-5-5",
};

// The one place a step's model is decided: .factory/config.json first (stage default, then the ticket
// type's route), the agent's frontmatter only when the config has no stage for the step.
export function resolveModel(a: {
  cfg?: FactoryConfig;
  step: string;
  type: string;
  frontmatter?: string;
}): string {
  const named = (STAGE_NAMES as readonly string[]).includes(a.step)
    ? (a.step as StageName)
    : undefined;
  const stage = a.cfg?.stepStages[a.step] ?? named;
  if (a.cfg && stage) return stageFor(a.cfg, stage, a.type).model;
  const fm = a.frontmatter ?? "sonnet";
  return MODEL_ALIASES[fm] ?? fm;
}
