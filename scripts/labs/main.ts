import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { loadLabs } from "./catalog.ts";
import { run } from "./cli.ts";
import { colorEnabled } from "./render.ts";

// Gitignored, so progress stays on the learner's machine and never reaches a commit.
const PROGRESS_FILE = ".labs/progress.json";

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const code = run(process.argv.slice(2), {
    labs: loadLabs("labs"),
    progressPath: PROGRESS_FILE,
    color: colorEnabled(process.env, Boolean(process.stdout.isTTY)),
    // make passes GUESS=... through the environment, so quotes in a guess cannot break a shell line.
    guess: process.env.GUESS,
    proof: (command) => {
      const r = spawnSync("sh", ["-c", command], { encoding: "utf8", timeout: 120_000 });
      return { ok: r.status === 0, output: `${r.stdout}${r.stderr}` };
    },
    now: () => new Date().toISOString(),
    out: (text) => console.log(text),
  });
  process.exit(code);
}
