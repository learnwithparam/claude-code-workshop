// Pattern: SessionStart integrity hash. A changed hook or setting file is told to the model before it trusts the config.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Every hook and both settings files: a changed hook is as much a config change as a changed setting.
// The baseline sits in the working tree, so it catches drift between sessions, not a determined edit
// of both files; a hardened setup keeps it outside the tree or signs it.
function watched() {
  const hooks = readdirSync(".claude/hooks")
    .filter((f) => f.endsWith(".mjs"))
    .map((f) => `.claude/hooks/${f}`);
  return [".claude/settings.json", ".claude/settings.local.json", ...hooks].filter((f) =>
    existsSync(f),
  );
}
const STORE = ".claude/.cc-writes/integrity.json";

export function hashes(read, files = watched()) {
  return Object.fromEntries(
    files.map((f) => [f, createHash("sha256").update(read(f)).digest("hex")]),
  );
}

// First run records the baseline. Later runs report which files differ from it.
export function changed(baseline, now) {
  if (!baseline) return [];
  // Union of keys: a deleted hook or settings file is a config change too, and only the baseline still names it.
  return [...new Set([...Object.keys(baseline), ...Object.keys(now)])].filter(
    (f) => baseline[f] !== now[f],
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const now = hashes((f) => readFileSync(f));
    const baseline = existsSync(STORE) ? JSON.parse(readFileSync(STORE, "utf8")) : null;
    const diff = changed(baseline, now);
    if (diff.length)
      console.log(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "SessionStart",
            additionalContext: `Config changed since the last session: ${diff.join(", ")}. Read the diff before trusting it.`,
          },
        }),
      );
    mkdirSync(".claude/.cc-writes", { recursive: true });
    writeFileSync(STORE, JSON.stringify(now));
  } catch {
    // Fail-safe: a missing file must not stop a session from starting.
  }
}
