// Files that change what every install or every run trusts need a person, not a model edit.
import { readFileSync } from "node:fs";
import { normalize } from "node:path";

// Case-insensitive and normalised, so ./A/../.GitHub/x cannot slip past. The runner re-checks the diff.
const PROTECTED =
  /(^|\/)(package-lock\.json|skills\.lock|\.github\/|\.claude\/hooks\/|\.claude\/settings[^/]*\.json)/i;

// The runner sets FACTORY_ALLOW_PROTECTED=1 only for an issue a person labelled factory:protected-ok.
export function guardFor(filePath, env) {
  if (
    env.FACTORY_ALLOW_PROTECTED === "1" ||
    !PROTECTED.test(normalize(filePath).replaceAll("\\", "/"))
  )
    return null;
  return `${filePath} is protected. Ask a person to change it, or have the issue labelled factory:protected-ok.`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const problem = guardFor(String(input.tool_input?.file_path ?? ""), process.env);
  if (problem) {
    console.error(problem);
    process.exit(2);
  }
}
