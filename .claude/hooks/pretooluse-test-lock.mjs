// Pattern: no test edits during a fix. Tests are the spec the fix must meet, so the fixer may not move them.
// The runner sets FACTORY_PHASE=fix after the red test is committed, and clears it for the next stage.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const TEST_FILE = /(\.test\.[cm]?[jt]sx?$|\.e2e\.[jt]s$|\.feature$|(^|\/)tests\/)/;

export function testLockFor(filePath, env) {
  if (env.FACTORY_PHASE !== "fix" || !TEST_FILE.test(filePath.replaceAll("\\", "/"))) return null;
  return `${filePath} is a test and this run is fixing. Change the code until the test passes, or stop and say the test is wrong.`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const problem = testLockFor(String(input.tool_input?.file_path ?? ""), process.env);
  if (problem) {
    console.error(problem);
    process.exit(2);
  }
}
