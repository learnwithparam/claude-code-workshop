// Pattern: route a prompt to the skill that fits it. Adds a hint, never blocks, so a wrong guess costs nothing.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ROUTES = [
  [/\b(grade|age|band|font size|picture box)/i, "worksheet-bands"],
  [/\b(bug|regression|broken|fails?)\b/i, "test-driven-development"],
  [/\b(triage|new issue|what kind of ticket)/i, "issue-triage"],
  [/\b(spec|requirements|prd)\b/i, "spec-driven-development"],
];

export function hintFor(prompt) {
  const hit = ROUTES.find(([pattern]) => pattern.test(prompt));
  return hit ? `If it helps, the ${hit[1]} skill covers this.` : null;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const input = JSON.parse(readFileSync(0, "utf8"));
    const hint = hintFor(String(input.prompt ?? ""));
    if (hint)
      console.log(
        JSON.stringify({
          hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: hint },
        }),
      );
  } catch {
    // Silent and fail-safe: routing is a convenience, never a gate.
  }
}
