import { readFileSync } from "node:fs";
import { z } from "zod";

const stageSchema = z.object({
  model: z.string(),
  maxTurns: z.number().int().positive(),
  maxBudgetUsd: z.number().positive(),
  permissionMode: z.enum(["plan", "acceptEdits", "default"]),
});

export const STAGE_NAMES = ["triage", "plan", "build", "review", "verify", "retro"] as const;
export type StageName = (typeof STAGE_NAMES)[number];

export const configSchema = z
  .object({
    allowedModels: z.array(z.string()).min(1),
    stages: z.object(
      Object.fromEntries(STAGE_NAMES.map((n) => [n, stageSchema])) as Record<
        StageName,
        typeof stageSchema
      >,
    ),
    // Dollars per million tokens. The Haiku cache-read rate is the usual 0.1x, not a published figure.
    prices: z.record(
      z.string(),
      z.object({
        input: z.number().nonnegative(),
        output: z.number().nonnegative(),
        cacheRead: z.number().nonnegative(),
        cacheWrite: z.number().nonnegative(),
      }),
    ),
    baselineModel: z.string(),
    tiers: z.object({ high: z.string(), mid: z.string(), low: z.string() }),
    routes: z.record(z.string(), z.record(z.string(), z.string())),
    reviewLoop: z.object({ maxRounds: z.number().int().min(1).max(5) }),
    labels: z.object({
      ready: z.string(),
      planned: z.string(),
      approved: z.string(),
      needsHuman: z.string(),
    }),
  })
  .superRefine((cfg, ctx) => {
    const used = [
      ...Object.values(cfg.stages).map((s) => s.model),
      ...Object.values(cfg.routes).flatMap((r) => Object.values(r)),
    ];
    for (const model of [...used, ...Object.values(cfg.tiers), cfg.baselineModel])
      if (!cfg.allowedModels.includes(model))
        ctx.addIssue({ code: "custom", message: `model ${model} is not in allowedModels` });
    // A model without a price would make the ledger silently under-count.
    for (const model of cfg.allowedModels)
      if (!cfg.prices[model])
        ctx.addIssue({ code: "custom", message: `model ${model} has no price` });
  });

export type FactoryConfig = z.infer<typeof configSchema>;

export function loadConfig(path = ".factory/config.json"): FactoryConfig {
  return configSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}

// Route by ticket type: an epic plans on Opus, a docs ticket builds on Haiku, the rest use the stage default.
export function stageFor(cfg: FactoryConfig, stage: StageName, type: string) {
  const model = cfg.routes[type]?.[stage] ?? cfg.stages[stage].model;
  return { ...cfg.stages[stage], model };
}
