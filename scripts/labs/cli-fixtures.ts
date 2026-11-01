import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Lab } from "./catalog.ts";
import type { CliDeps } from "./cli.ts";
import { saveProgress } from "./progress.ts";

// Shared by the cli tests: a lab, and deps whose output and proof are fakes.
export const lab = (id: string, lane: Lab["lane"]): Lab => ({
  id,
  lane,
  title: `Title ${id}`,
  pairs: "docs/README.md",
  goal: `Goal ${id}`,
  help: "guided",
  steps: [{ where: "shell", text: "Do it." }],
  proof: [{ text: `Item for ${id}.`, command: `proof-${id}` }],
  hints: ["first hint", "second hint"],
  learned: `Learned ${id}`,
  predict: { question: `Question ${id}?`, answer: `Because reason ${id}.` },
});

export function setup(passes: boolean, withPath = true, guess?: string) {
  const out: string[] = [];
  const dir = mkdtempSync(join(tmpdir(), "labs-cli-"));
  const deps: CliDeps = {
    labs: [lab("start-01", "start"), lab("start-02", "start")],
    progressPath: join(dir, "progress.json"),
    color: false,
    proof: () => ({ ok: passes, output: "boom line\n" }),
    guess,
    now: () => "2026-10-30",
    out: (s) => out.push(s),
    status: (s) => out.push(s),
    isTTY: false,
  };
  if (withPath) saveProgress(deps.progressPath, { done: {}, hints: {}, attempts: {}, path: "pro" });
  return { deps, out, text: () => out.join("\n") };
}
