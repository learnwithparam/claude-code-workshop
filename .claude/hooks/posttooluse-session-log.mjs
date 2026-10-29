// One JSON line per tool call, so the retro stage can read what a session did.
// Tool name and file path only: no command text and no output, which can hold secrets.
import { closeSync, constants, mkdirSync, openSync, readFileSync, writeSync } from "node:fs";
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
  // O_NOFOLLOW makes the open itself fail on a planted link, with no check-then-use gap.
  const fd = openSync(
    file,
    constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | constants.O_NOFOLLOW,
    0o600,
  );
  try {
    writeSync(fd, `${line}\n`);
  } finally {
    closeSync(fd);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.env.FACTORY_RUN_LOG || ".factory/runs/session.jsonl";
  appendLine(file, logLine(JSON.parse(readFileSync(0, "utf8"))));
}
