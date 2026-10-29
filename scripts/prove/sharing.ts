import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildPlugin, KIT, PLUGIN_DIR } from "../plugin.ts";
import type { Proof } from "./hand-built.ts";

// Sharing claim: the factory installs as one plugin built from .claude/, with nothing copied by hand.
export function proveSharing(): Proof {
  const problems: string[] = [];
  const fresh = mkdtempSync(join(tmpdir(), "kit-"));
  buildPlugin(process.cwd(), fresh);
  for (const skill of KIT.skills) {
    const mine = readFileSync(join(fresh, "skills", skill, "SKILL.md"), "utf8");
    const shipped = readFileSync(join(PLUGIN_DIR, "skills", skill, "SKILL.md"), "utf8");
    if (mine !== shipped) problems.push(`skill ${skill} is stale: run npx tsx scripts/plugin.ts`);
  }
  const market = JSON.parse(readFileSync(".claude-plugin/marketplace.json", "utf8"));
  if (!market.plugins?.some((p: { name: string }) => p.name === "factory-kit"))
    problems.push("marketplace does not list factory-kit");

  // The CLI is the judge of the manifests. Without it on PATH the structure test still guards them.
  let validated = "validate skipped (claude not on PATH)";
  try {
    execFileSync("claude", ["plugin", "validate", PLUGIN_DIR, "--strict"], { stdio: "pipe" });
    validated = "claude plugin validate --strict passed";
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT")
      problems.push("claude plugin validate failed");
  }

  return {
    level: "sharing",
    claim: "the factory installs from a marketplace as one plugin built from .claude/",
    passed: problems.length === 0,
    detail: problems.length === 0 ? validated : problems.join(" | "),
  };
}
