import { createHash } from "node:crypto";
import { globSync, readFileSync } from "node:fs";
import type { Proof } from "./hand-built.ts";

type EvalRow = { compliant: boolean; bandMatches: boolean; outputTokens: number };
const MAX_MEDIAN_OUTPUT_TOKENS = 1200;

// Skills claim: every skill is well formed and unchanged, and the agent it feeds stays on band and cheap.
export function proveSkills(): Proof {
  const problems: string[] = [];

  for (const file of globSync(".claude/skills/*/SKILL.md")) {
    const text = readFileSync(file, "utf8");
    if (!/^name: .+$/m.test(text) || !/^description: .+$/m.test(text))
      problems.push(`${file}: needs name and description`);
  }

  const lock = JSON.parse(readFileSync("skills.lock", "utf8")) as { files: Record<string, string> };
  for (const [file, hash] of Object.entries(lock.files)) {
    const actual = createHash("sha256").update(readFileSync(file)).digest("hex");
    if (actual !== hash) problems.push(`${file}: differs from skills.lock`);
  }

  // Replay of the recorded live run: zero tokens, same verdict every time.
  const rows = JSON.parse(readFileSync("fixtures/eval.json", "utf8")) as EvalRow[];
  const compliant = rows.filter((r) => r.compliant && r.bandMatches).length;
  if (compliant !== rows.length) problems.push(`eval: ${compliant}/${rows.length} on band`);
  const sorted = rows.map((r) => r.outputTokens).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  if (median > MAX_MEDIAN_OUTPUT_TOKENS) problems.push(`eval: median ${median} output tokens`);

  return {
    level: "skills",
    claim: "skills are intact and the agent hits every band under the token budget",
    passed: problems.length === 0,
    detail:
      problems.length === 0
        ? `${compliant}/${rows.length} on band, median ${median} tokens`
        : problems.join(" | "),
  };
}
