import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseImpact, planChecks } from "./impact.ts";

// Usage: check-affected.ts [--base <ref>] [--dry]. Without --base it looks at the working tree.
const args = process.argv.slice(2);
const baseAt = args.indexOf("--base");
const base = baseAt >= 0 ? args[baseAt + 1] : undefined;

const git = (...a: string[]) =>
  execFileSync("git", a, { encoding: "utf8" }).split("\n").filter(Boolean);
const files = base
  ? git("diff", "--name-only", `${base}...HEAD`)
  : [...git("diff", "--name-only", "HEAD"), ...git("ls-files", "--others", "--exclude-standard")];

const plan = planChecks(parseImpact(JSON.parse(readFileSync("repo.json", "utf8"))), [
  ...new Set(files),
]);
console.log(
  plan.commands.length
    ? `will run:\n${plan.commands.map((c) => `  ${c}`).join("\n")}`
    : "nothing to run",
);
if (args.includes("--dry")) process.exit(0);

// Stop at the first red check: the rest would only bury it.
for (const command of plan.commands) {
  console.log(`\n$ ${command}`);
  const r = spawnSync(command, { shell: true, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
