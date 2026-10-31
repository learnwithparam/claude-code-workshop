import { spawnSync } from "node:child_process";
import { mkdirSync, watch } from "node:fs";
import { pathToFileURL } from "node:url";
import { loadLabs } from "./catalog.ts";
import { type CliDeps, run, runWatch } from "./cli.ts";
import { colorEnabled } from "./render.ts";

// Gitignored, so progress stays on the learner's machine and never reaches a commit.
const PROGRESS_FILE = ".labs/progress.json";

const WORK_DIR = ".labs/work";
const DEBOUNCE_MS = 300;

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const deps: CliDeps = {
    labs: loadLabs("labs"),
    progressPath: PROGRESS_FILE,
    color: colorEnabled(process.env, Boolean(process.stdout.isTTY)),
    proof: (command) => {
      const r = spawnSync("sh", ["-c", command], { encoding: "utf8", timeout: 120_000 });
      return { ok: r.status === 0, output: `${r.stdout}${r.stderr}` };
    },
    now: () => new Date().toISOString(),
    out: (text) => console.log(text),
    status: (text) => console.log(`\x1b[2K${text}`),
    isTTY: Boolean(process.stdout.isTTY && process.stdin.isTTY),
    watch: (onChange) => {
      mkdirSync(WORK_DIR, { recursive: true });
      let timer: NodeJS.Timeout | undefined;
      const w = watch(WORK_DIR, { recursive: true }, () => {
        clearTimeout(timer);
        timer = setTimeout(onChange, DEBOUNCE_MS);
      });
      return () => {
        clearTimeout(timer);
        w.close();
      };
    },
    keys: (onKey) => {
      const stdin = process.stdin;
      const listener = (chunk: Buffer) => {
        const key = chunk.toString();
        if (key === "\u0003") process.exit(130);
        onKey(key.trim().toLowerCase());
      };
      stdin.setRawMode(true);
      stdin.resume();
      stdin.on("data", listener);
      return () => {
        stdin.off("data", listener);
        stdin.setRawMode(false);
        stdin.pause();
      };
    },
  };
  const code = args.includes("--watch") ? await runWatch(args, deps) : run(args, deps);
  process.exit(code);
}
