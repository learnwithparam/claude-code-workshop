// Claude cannot finish while a check its change reaches fails. Exit 2 sends the output back as its next task.
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

// Only the checks the change reaches (see repo.json); an unmapped path runs the whole gate.
const gate = () => {
  const r = spawnSync("npx", ["tsx", "scripts/check-affected.ts"], { encoding: "utf8" });
  return r.status === 0
    ? { ok: true, output: "" }
    : { ok: false, output: `check-affected failed\n${r.stdout}${r.stderr}` };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const verdict = decide(JSON.parse(readFileSync(0, "utf8")), gate);
  if (verdict.block) {
    console.error(`The gate is red. Fix this before you stop:\n${verdict.message}`);
    process.exit(2);
  }
}
