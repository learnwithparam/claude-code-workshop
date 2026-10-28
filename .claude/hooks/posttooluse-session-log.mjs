// One JSON line per tool call, so the retro stage can read what a session did.
// Tool name and file path only: no command text and no output, which can hold secrets.
import { appendFileSync, lstatSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

export function logLine(input, now = new Date()) {
  return JSON.stringify({
    at: now.toISOString(),
    tool: input.tool_name,
    file: input.tool_input?.file_path ?? null,
  });
}

// .factory/runs is gitignored and writable by the agent, so a planted link must not redirect the log.
function appendLine(file, line) {
  mkdirSync(dirname(file), { recursive: true });
  try {
    if (lstatSync(file).isSymbolicLink())
      throw new Error(`refusing to log through symlink ${file}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  appendFileSync(file, line + "\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.env.FACTORY_RUN_LOG || ".factory/runs/session.jsonl";
  appendLine(file, logLine(JSON.parse(readFileSync(0, "utf8"))));
}
