// Files that change what every install or every run trusts need a person, not a model edit.
import { readFileSync } from "node:fs";

const PROTECTED = /(^|\/)(package-lock\.json|skills\.lock|\.github\/)/;

// The runner sets FACTORY_ALLOW_PROTECTED=1 only for an issue a person labelled factory:protected-ok.
export function guardFor(filePath, env) {
  if (env.FACTORY_ALLOW_PROTECTED === "1" || !PROTECTED.test(filePath)) return null;
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
