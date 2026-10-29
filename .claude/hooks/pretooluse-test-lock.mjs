// Pattern: no test edits during a fix. Tests are the spec the fix must meet, so the fixer may not move them.
// The runner sets FACTORY_PHASE=fix after the red test is committed, and clears it for the next stage.
import { readFileSync } from "node:fs";
import { normalize } from "node:path";
import { pathToFileURL } from "node:url";

const TEST_FILE = /(\.test\.[cm]?[jt]sx?$|\.e2e\.[jt]s$|\.feature$|(^|\/)tests\/)/i;

export function testLockFor(filePath, env) {
  if (env.FACTORY_PHASE !== "fix" || !TEST_FILE.test(normalize(filePath).replaceAll("\\", "/")))
    return null;
  return `${filePath} is a test and this run is fixing. Change the code until the test passes, or stop and say the test is wrong.`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const input = JSON.parse(readFileSync(0, "utf8"));
    const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path ?? "";
    const problem = testLockFor(String(target), process.env);
    if (problem) {
      console.error(problem);
      process.exit(2);
    }
  } catch {
    // Unreadable input during a fix is refused; outside a fix there is nothing to lock.
    if (process.env.FACTORY_PHASE === "fix") {
      console.error("test lock could not read the tool input, so it refuses the edit");
      process.exit(2);
    }
  }
}
