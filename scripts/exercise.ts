import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Track A gets the hint with a failure. Track B gets the failing line and nothing else.
export function report(passed: boolean, output: string, track: "a" | "b", doc: string): string {
  if (passed) return "PASS";
  const failing = output.split("\n").find((l) => /^FAIL\b/.test(l)) ?? "FAIL";
  if (track === "b") return failing;
  const section = /^## Exercise\n+([\s\S]*?)(?=\n## |$)/m.exec(doc)?.[1]?.trim() ?? "";
  return `${failing}\nHint: ${section}`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [level, track = "a"] = process.argv.slice(2);
  if (!level || (track !== "a" && track !== "b")) {
    console.error("usage: make exercise LEVEL=<name> TRACK=a|b");
    process.exit(2);
  }
  const run = spawnSync("npm", ["run", "--silent", "prove", "--", level], { encoding: "utf8" });
  const doc = readFileSync(`docs/levels/${level}.md`, "utf8");
  const text = report(run.status === 0, `${run.stdout}${run.stderr}`, track, doc);
  console.log(text);
  process.exit(run.status === 0 ? 0 : 1);
}
