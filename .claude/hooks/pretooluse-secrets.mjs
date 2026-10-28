// A Read deny does not stop `cat` in Bash. This hook closes that gap: exit 2 blocks the call.
import { readFileSync } from "node:fs";

const SECRET_FILE = /(^|[\s/"'=<>])\.env(\.[a-z]+)?(\s|$|["'])/;

export function blocks(command) {
  const withoutExample = command.replaceAll(".env.example", "");
  return SECRET_FILE.test(withoutExample);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = JSON.parse(readFileSync(0, "utf8"));
  if (blocks(String(input.tool_input?.command ?? ""))) {
    console.error(
      "Blocked: this file holds a secret. Load it inside a script, never in a shell command.",
    );
    process.exit(2);
  }
}
