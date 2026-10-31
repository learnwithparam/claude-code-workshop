// Pattern: scan what a tool printed for secrets. Warns the model to stop quoting it; the output is already shown.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SHAPES = [
  ["an Anthropic key", /sk-ant-[A-Za-z0-9_-]{20,}/],
  ["a GitHub token", /gh[pousr]_[A-Za-z0-9]{30,}/],
  ["a private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

export function leaked(output) {
  const text = typeof output === "string" ? output : JSON.stringify(output ?? "");
  return SHAPES.filter(([, shape]) => shape.test(text)).map(([name]) => name);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const input = JSON.parse(readFileSync(0, "utf8"));
    const found = leaked(input.tool_response);
    if (found.length)
      console.log(
        JSON.stringify({
          systemMessage: `That output held ${found.join(" and ")}. Do not repeat it, and tell the person to rotate it.`,
        }),
      );
  } catch {
    // Warn-only: a scan that cannot read its input says nothing.
  }
}
