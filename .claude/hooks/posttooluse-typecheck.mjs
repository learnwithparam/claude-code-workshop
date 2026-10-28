// After every edit, tell Claude about a type error while it still remembers what it changed.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function typeErrorFor(filePath, run) {
  if (!/\.(ts|astro)$/.test(filePath)) return null;
  const result = run();
  return result.ok ? null : result.output.split("\n").slice(-20).join("\n");
}

const typecheck = () => {
  const r = spawnSync("npm", ["run", "typecheck", "--silent"], { encoding: "utf8" });
  return { ok: r.status === 0, output: `${r.stdout}${r.stderr}` };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const problem = typeErrorFor(String(input.tool_input?.file_path ?? ""), typecheck);
  if (problem) {
    console.error(`Type error after your edit. Fix it before moving on:\n${problem}`);
    process.exit(2);
  }
}
