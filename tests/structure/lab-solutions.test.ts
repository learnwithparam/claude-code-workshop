import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadLabs } from "../../scripts/labs/catalog.ts";

const W = ".labs/work";
const BLOCK_ENV = `import{readFileSync as r}from"node:fs";const i=JSON.parse(r(0,"utf8"));if((i.tool_input?.file_path??"").endsWith(".env")){console.error("no");process.exit(2)}`;
const KEBAB = `import{readdirSync as d}from"node:fs";const bad=d(process.argv[2],{recursive:true}).filter(f=>!/^[a-z0-9.-]+$/.test(String(f).split("/").pop()));bad.forEach(f=>console.log(f));process.exitCode=bad.length?1:0`;
const sh = (...lines: string[]) => lines.join("\n");

// One known-good way to finish each lab, written as shell. Claude-powered steps are replaced by
// their output, because the proof only reads the artifact, not how it was made.
const SOLUTIONS: Record<string, string> = {
  "start-01": sh(`mkdir -p ${W}`, `printf 'a\\nb\\nc\\n' > ${W}/repo-tour.md`),
  "start-02": sh(`mkdir -p ${W}`, `echo 'Tests 3 passed' > ${W}/gate.log`),
  "start-03": sh(
    `mkdir -p ${W}`,
    `printf 'one\\ntwo\\nthree\\nfour\\nVerify it\\n' > ${W}/plan.md`,
  ),
  "start-04": sh(`echo '- lab-note: x' > CLAUDE.local.md`, `echo '/CLAUDE.local.md' > .gitignore`),
  "daily-01": sh(
    `mkdir -p ${W}`,
    `echo '{"session_id":"s"}' > ${W}/session.json`,
    `echo tangerine > ${W}/recall.md`,
  ),
  "daily-02": sh(
    `mkdir -p ${W}/rules`,
    `printf -- '---\\npaths:\\n  - api/**\\n---\\n- a\\n- b\\n' > ${W}/rules/api-errors.md`,
  ),
  "daily-03": sh(
    `mkdir -p ${W}/skills/commit-message`,
    `printf 'name: commit-message\\ndescription: Use when committing\\n1\\n2\\n3\\n4\\n5\\n6\\n' > ${W}/skills/commit-message/SKILL.md`,
  ),
  "daily-04": sh(
    `mkdir -p ${W}/hooks`,
    `cat > ${W}/hooks/block-env.mjs <<'EOF'\n${BLOCK_ENV}\nEOF`,
  ),
  "team-01": sh(
    `mkdir -p ${W}`,
    `echo '{"permissions":{"deny":["Read(./.env)","Read(./.env.*)"]}}' > ${W}/settings.json`,
  ),
  "team-02": sh(
    `mkdir -p ${W}`,
    `printf '# Review\\n- Flag a\\n- Flag b\\n- Flag c\\n' > ${W}/REVIEW.md`,
  ),
  "team-03": sh(`mkdir -p ${W}`, `echo 'PASS hand-built: ok' > ${W}/prove.txt`),
  "team-04": sh(
    `mkdir -p ${W}/plugin/.claude-plugin`,
    `echo '{"name":"kit","version":"0.1.0","description":"d"}' > ${W}/plugin/.claude-plugin/plugin.json`,
  ),
  "factory-01": sh(
    `mkdir -p ${W}/specs/1`,
    `printf '## Problem\\n## Done when\\n- a\\n- b\\n## Out of scope\\n' > ${W}/specs/1/intent.md`,
  ),
  "factory-02": sh(
    `mkdir -p ${W}/specs/1`,
    `printf 'Given a\\nWhen b\\nThen c\\nGiven d\\nWhen e\\nThen f\\n' > ${W}/specs/1/acceptance.md`,
  ),
  "factory-03": sh(
    `mkdir -p ${W}`,
    `printf 'stages that would run\\nreview loop\\n' > ${W}/dry-run.txt`,
  ),
  "factory-04": sh(`mkdir -p ${W}`, `echo 'Tests 4 passed' > ${W}/contract.log`),
  "advanced-01": sh(
    `mkdir -p ${W}/agents`,
    `printf 'name: reviewer\\ndescription: d\\ntools: Read, Grep, Glob\\nmodel: haiku\\n' > ${W}/agents/reviewer.md`,
  ),
  "advanced-02": sh(
    `mkdir -p ${W}`,
    `echo '{"total_cost_usd":0.01}' > ${W}/call.json`,
    `echo 0.012 > ${W}/cost.txt`,
  ),
  "advanced-03": sh(`mkdir -p ${W}/wt`, `echo 'gitdir: /x' > ${W}/wt/.git`),
  "advanced-04": sh(`mkdir -p ${W} docs`, `cat > ${W}/check-kebab.mjs <<'EOF'\n${KEBAB}\nEOF`),
};

function inTempDir(setup: string | undefined, proof: string) {
  const dir = mkdtempSync(join(tmpdir(), "lab-proof-"));
  if (setup) {
    writeFileSync(join(dir, "setup.sh"), setup);
    spawnSync("sh", [join(dir, "setup.sh")], { cwd: dir });
  }
  return spawnSync("sh", ["-c", proof], { cwd: dir, encoding: "utf8" }).status;
}

describe("lab proofs", () => {
  const labs = loadLabs("labs");

  it("has a solution for every lab and none extra", () => {
    expect(Object.keys(SOLUTIONS).sort()).toEqual(labs.map((l) => l.id).sort());
  });

  it.each(labs)("$id is red with no work", (lab) => {
    expect(inTempDir(undefined, lab.proof)).not.toBe(0);
  });

  it.each(labs)("$id is green once the steps are done", (lab) => {
    expect(inTempDir(SOLUTIONS[lab.id], lab.proof)).toBe(0);
  });
});
