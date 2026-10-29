// A Read deny does not stop `cat` in Bash. This hook closes that gap: exit 2 blocks the call.
// Best-effort text match: a command that builds the name at run time slips past it, so the sandbox is the real fix.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SECRET_FILE = /(^|[^\w.-])\.env(\.[\w.-]+)?(?![\w])/i;

export function blocks(command) {
  const withoutExample = command.replaceAll(".env.example", "");
  return SECRET_FILE.test(withoutExample);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const input = JSON.parse(readFileSync(0, "utf8"));
    if (blocks(String(input.tool_input?.command ?? ""))) {
      console.error(
        "Blocked: this file holds a secret. Load it inside a script, never in a shell command.",
      );
      process.exit(2);
    }
  } catch {
    // Fail closed: input we cannot read is input we cannot vouch for.
    console.error("Blocked: the secrets hook could not read the tool call.");
    process.exit(2);
  }
}
