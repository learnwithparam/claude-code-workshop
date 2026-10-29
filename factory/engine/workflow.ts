import { parse } from "yaml";
import { z } from "zod";
import { ARTIFACTS } from "./artifacts.ts";

export const CHECK_NAMES = [
  "red",
  "green",
  "lock",
  "holdout",
  "acceptance",
  "properties",
  "behaviour-unchanged",
  "mutation",
  "contract",
  "visual",
  "eval",
  "plan-drift",
  "gate",
  "prepush",
  "ci",
  "prose",
] as const;

const stepSchema = z.object({
  stage: z.string(),
  agent: z.string(),
  // What the agent is asked to do in this stage. Without it the agent only sees the ticket and guesses.
  brief: z.string().optional(),
  // A read-only agent cannot write its own artifact, so the runner saves its reply as this one.
  writes: z.enum(ARTIFACTS).optional(),
  checks: z.array(z.enum(CHECK_NAMES)).default([]),
  // Repeat the agent until every check in `until` passes, at most `max` times.
  loop: z
    .object({ until: z.array(z.enum(CHECK_NAMES)).min(1), max: z.number().int().min(1).max(5) })
    .optional(),
  gate: z.enum(["human", "auto"]).default("auto"),
  // Fix steps run with the test lock on.
  phase: z.enum(["build", "fix"]).default("build"),
});
export type Step = z.infer<typeof stepSchema>;

export const workflowSchema = z.object({
  name: z.string(),
  method: z.string(),
  source: z.string(),
  for: z.string(),
  steps: z.array(stepSchema).min(1),
});
export type Workflow = z.infer<typeof workflowSchema>;

export function loadWorkflow(text: string): Workflow {
  const wf = workflowSchema.parse(parse(text));
  for (const step of wf.steps)
    for (const c of step.loop?.until ?? [])
      if (!step.checks.includes(c))
        throw new Error(`step ${step.stage}: loop check ${c} is not in its checks`);
  return wf;
}
