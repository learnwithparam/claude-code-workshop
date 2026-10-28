// Claude cannot finish while lint, types or tests fail. Exit 2 sends the output back as its next task.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

// stop_hook_active is true when Claude is already continuing because of this hook. Blocking again
// would loop forever, so the second stop goes through and a human sees the red gate.
export function decide(input, run) {
  if (input.stop_hook_active) return { block: false, message: "" };
  const result = run();
  return result.ok
    ? { block: false, message: "" }
    : { block: true, message: result.output.split("\n").slice(-30).join("\n") };
}

const gate = () => {
  for (const script of ["lint", "typecheck", "test"]) {
    const r = spawnSync("npm", ["run", script, "--silent"], { encoding: "utf8" });
    if (r.status !== 0)
      return { ok: false, output: `npm run ${script} failed\n${r.stdout}${r.stderr}` };
  }
  return { ok: true, output: "" };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const verdict = decide(JSON.parse(readFileSync(0, "utf8")), gate);
  if (verdict.block) {
    console.error(`The gate is red. Fix this before you stop:\n${verdict.message}`);
    process.exit(2);
  }
}
