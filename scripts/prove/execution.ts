import { globSync, readFileSync } from "node:fs";
import { loadConfig } from "../../factory/config.ts";
import type { Proof } from "./hand-built.ts";

const ALIASES = ["opus", "sonnet", "haiku"];

// Execution claim: every agent and stage has a role, a model, a turn cap and a tool list.
export function proveExecution(): Proof {
  const problems: string[] = [];
  const cfg = loadConfig(); // throws if a stage names a model outside allowedModels

  const agents = globSync(".claude/agents/*.md");
  if (agents.length < 4)
    problems.push(`only ${agents.length} agents, expected planner/builder/reviewer/verifier`);
  for (const file of agents) {
    const text = readFileSync(file, "utf8");
    for (const key of ["name", "description", "model", "maxTurns", "tools"])
      if (!new RegExp(`^${key}: .+$`, "m").test(text)) problems.push(`${file}: missing ${key}`);
    const model = /^model: (.+)$/m.exec(text)?.[1] ?? "";
    if (!ALIASES.includes(model))
      problems.push(`${file}: model "${model}" is not opus, sonnet or haiku`);
  }
  const builder = readFileSync(".claude/agents/builder.md", "utf8");
  if (!/^isolation: worktree$/m.test(builder)) problems.push("builder does not run in a worktree");

  const budget = Object.values(cfg.stages).reduce((sum, s) => sum + s.maxBudgetUsd, 0);
  if (budget > 6) problems.push(`one pass can spend $${budget}, cap is $6`);

  return {
    level: "execution",
    claim: "every agent and stage is bounded: model, turns, tools and budget",
    passed: problems.length === 0,
    detail:
      problems.length === 0
        ? `${agents.length} agents, worst case $${budget} per pass`
        : problems.join(" | "),
  };
}
