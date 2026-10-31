import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { loadConfig } from "../config.ts";
import { ready, report, runIssue, runMaintain } from "./cli.ts";
import { portable } from "./portable.ts";

// Usage: tsx factory/engine/main.ts <issue-number> --workflow=<name>
//        tsx factory/engine/main.ts <issue-number> --workflow=<name> --no-retro
//        tsx factory/engine/main.ts --maintain <issue-number>
//        tsx factory/engine/main.ts --report | --watch
const [first] = process.argv.slice(2);
const workflow = process.argv.find((a) => a.startsWith("--workflow="))?.slice(11);

if (first === "--report") console.log(JSON.stringify(report(), null, 2));
else if (first === "--watch")
  console.log(JSON.stringify(ready(loadConfig().labels.ready), null, 2));
else if (first === "--maintain") {
  const r = await runMaintain(Number(process.argv[3]));
  console.log(r.lines.join("\n"));
} else if (first && workflow) {
  // The agents need a key. Load it inside this process so it never appears on a command line.
  // Only that one variable is taken from the file, so nothing else in it reaches the run.
  const { env, file } = portable().keySource;
  if (!process.env[env]) {
    const key = parseEnv(readFileSync(file, "utf8"))[env];
    if (key) process.env[env] = key;
  }
  const r = await runIssue(Number(first), workflow, {
    retro: !process.argv.includes("--no-retro"),
  });
  console.log(
    JSON.stringify(
      { outcome: r.outcome, stoppedAt: r.stoppedAt, rounds: r.rounds, costUsd: r.costUsd },
      null,
      2,
    ),
  );
} else
  throw new Error(
    "usage: factory/engine/main.ts <issue> --workflow=<name> | --maintain <issue> | --report | --watch",
  );
