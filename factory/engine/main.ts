import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { loadConfig } from "../config.ts";
import { parseAuthFlag, resolveAuth, storedLogin } from "./auth.ts";
import { ready, report, runIssue } from "./cli.ts";
import { portable } from "./portable.ts";

// Usage: tsx factory/engine/main.ts <issue-number> --workflow=<name> [--auth=api-key|subscription|auto]
//        tsx factory/engine/main.ts --report | --watch
const [first] = process.argv.slice(2);
const workflow = process.argv.find((a) => a.startsWith("--workflow="))?.slice(11);

if (first === "--report") console.log(JSON.stringify(report(), null, 2));
else if (first === "--watch")
  console.log(JSON.stringify(ready(loadConfig().labels.ready), null, 2));
else if (first && workflow) {
  // One credential for the agents, resolved here so it never appears on a command line.
  // The key file is opened only when the key is the chosen credential, and only that variable is taken.
  const { keySource, auth: configured } = portable();
  const auth = resolveAuth({
    mode: parseAuthFlag(process.argv) ?? configured,
    env: process.env,
    keyEnv: keySource.env,
    loadKey: () =>
      existsSync(keySource.file)
        ? parseEnv(readFileSync(keySource.file, "utf8"))[keySource.env]
        : undefined,
    storedLogin,
  });
  const r = await runIssue(Number(first), workflow, auth);
  const cap =
    auth.mode === "subscription"
      ? `no dollar bill: capped at ${r.subscriptionCap.calls} agent calls and ${r.subscriptionCap.tokens} tokens; estimatedUsd is the SDK's list-price estimate`
      : "billed per token: capped by spend.capUsd in .factory/config.json";
  console.log(
    JSON.stringify(
      {
        outcome: r.outcome,
        stoppedAt: r.stoppedAt,
        rounds: r.rounds,
        auth: auth.mode,
        costUsd: r.costUsd,
        usage: r.usage,
        cap,
      },
      null,
      2,
    ),
  );
} else
  throw new Error(
    "usage: factory/engine/main.ts <issue> --workflow=<name> [--auth=<mode>] | --report | --watch",
  );
