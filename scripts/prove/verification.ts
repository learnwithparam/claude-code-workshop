import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { decide } from "../../.claude/hooks/stop-gate.mjs";
import type { Proof } from "./hand-built.ts";

// Each seeded bug is reintroduced by undoing its fix. The named test must go red, then the file is restored.
const BUGS = [
  {
    name: "Kindergarten falls through (parser matched digits only)",
    file: "shared/src/bands.ts",
    fixed: "return hits.find((hit) => padded.includes(hit.alias))?.id ?? null;",
    broken:
      "return hits.find((hit) => /\\d/.test(padded) && padded.includes(hit.alias))?.id ?? null;",
    test: "tests/structure/bands.test.ts",
  },
  {
    name: "client drops the assistant question",
    file: "web/src/lib/history.ts",
    fixed: 'history.push({ role: "assistant", content: ev.data.text });',
    broken: "",
    test: "web/src/lib/history.test.ts",
  },
  {
    name: "preview overflows a 375px phone",
    file: "web/src/pages/index.astro",
    fixed: ".preview { display: grid; gap: 8px; min-width: 0; }",
    broken: ".preview { display: grid; gap: 8px; }",
    test: "web/src/lib/layout.test.ts",
  },
] as const;

const passes = (test: string) =>
  spawnSync("npx", ["vitest", "run", test], { encoding: "utf8" }).status === 0;

// Verification claim: a fix is only a fix if the test fails without it, and Claude cannot stop on red.
export function proveVerification(): Proof {
  const problems: string[] = [];
  for (const bug of BUGS) {
    const original = readFileSync(bug.file, "utf8");
    if (!original.includes(bug.fixed)) {
      problems.push(`${bug.name}: fix not found in ${bug.file}`);
      continue;
    }
    try {
      writeFileSync(bug.file, original.replace(bug.fixed, bug.broken));
      if (passes(bug.test)) problems.push(`${bug.name}: ${bug.test} still passes without the fix`);
    } finally {
      writeFileSync(bug.file, original);
    }
    if (!passes(bug.test)) problems.push(`${bug.name}: ${bug.test} fails with the fix restored`);
  }

  const settings = JSON.parse(readFileSync(".claude/settings.json", "utf8"));
  if (!settings.hooks?.Stop?.length) problems.push("settings: Stop hook not wired");
  if (!settings.hooks?.PostToolUse?.length) problems.push("settings: PostToolUse hook not wired");
  if (!decide({}, () => ({ ok: false, output: "red" })).block)
    problems.push("stop gate lets red through");

  return {
    level: "verification",
    claim: "every seeded bug has a test that bites, and Claude cannot stop on a red gate",
    passed: problems.length === 0,
    detail: problems.length === 0 ? `${BUGS.length} bugs bite, hooks wired` : problems.join(" | "),
  };
}
