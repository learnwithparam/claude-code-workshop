// Pattern: SessionStart integrity hash. A changed hook or setting file is told to the model before it trusts the config.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const WATCHED = [".claude/settings.json", ".claude/hooks/pretooluse-secrets.mjs"];
const STORE = ".claude/.cc-writes/integrity.json";

export function hashes(read) {
  return Object.fromEntries(
    WATCHED.map((f) => [f, createHash("sha256").update(read(f)).digest("hex")]),
  );
}

// First run records the baseline. Later runs report which files differ from it.
export function changed(baseline, now) {
  if (!baseline) return [];
  return Object.keys(now).filter((f) => baseline[f] !== now[f]);
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
