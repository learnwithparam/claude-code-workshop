import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

// What the kit takes from .claude/. App-specific files (worksheet-bands, rules/api.md) stay out.
export const KIT = {
  skills: ["issue-triage", "factory-retro", "handoff", "release-notes"],
  agents: ["planner", "builder", "reviewer", "verifier", "design-reviewer"],
  hooks: ["pretooluse-secrets.mjs"],
} as const;

export const PLUGIN_DIR = "plugins/factory-kit";

// Copies, never edits: .claude/ stays the only place a skill or agent is written.
// plugin.json, hooks.json and evals/ are authored in the plugin and are not touched here.
export function buildPlugin(root: string, outDir = join(root, PLUGIN_DIR)) {
  for (const sub of ["skills", "agents"])
    rmSync(join(outDir, sub), { recursive: true, force: true });
  for (const name of KIT.skills)
    cpSync(join(root, ".claude/skills", name), join(outDir, "skills", name), { recursive: true });
  mkdirSync(join(outDir, "agents"), { recursive: true });
  for (const name of KIT.agents)
    cpSync(join(root, ".claude/agents", `${name}.md`), join(outDir, "agents", `${name}.md`));
  mkdirSync(join(outDir, "hooks"), { recursive: true });
  for (const name of KIT.hooks)
    cpSync(join(root, ".claude/hooks", name), join(outDir, "hooks", name));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildPlugin(process.cwd());
  console.log(`built ${PLUGIN_DIR}`);
}
