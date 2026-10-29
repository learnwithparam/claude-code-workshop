// One name per line, so a recorded team run can show which teammates took part.
// A logger, not a guard: it never blocks a teammate, and it stores the name only.
import { appendFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function teammateName(input) {
  const name = String(input?.teammate_name ?? "").trim();
  return /^[\w .-]{1,60}$/.test(name) ? name : null;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    const name = teammateName(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (name) {
      mkdirSync(".claude/logs", { recursive: true });
      appendFileSync(".claude/logs/teams.log", `${name}\n`);
    }
  } catch {
    // Logging must never stop a teammate.
  }
}
