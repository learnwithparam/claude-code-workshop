import { loadConfig, STAGE_NAMES, stageFor } from "./config.ts";
import { runFactory } from "./run.ts";
import { githubDeps, runStage } from "./stages.ts";

// Usage: tsx factory/main.ts <issue-number> [--dry-run]
const [number, flag] = process.argv.slice(2);
const cfg = loadConfig();
if (!number) throw new Error("usage: factory/main.ts <issue-number> [--dry-run]");

if (flag === "--dry-run") {
  console.log(`Issue #${number}: stages that would run, from .factory/config.json`);
  for (const name of STAGE_NAMES) {
    const s = stageFor(cfg, name, "feature");
    console.log(
      `  ${name.padEnd(7)} ${s.model} turns<=${s.maxTurns} budget<=$${s.maxBudgetUsd} ${s.permissionMode}`,
    );
  }
  console.log(
    `  review loop: at most ${cfg.reviewLoop.maxRounds} rounds, then label ${cfg.labels.needsHuman}`,
  );
} else {
  const report = await runFactory({ ...githubDeps, runStage }, cfg, Number(number));
  console.log(JSON.stringify(report, null, 2));
}
