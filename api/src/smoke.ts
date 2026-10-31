import Anthropic from "@anthropic-ai/sdk";
import { runAgent } from "./agent/agent.ts";
import { costUsd } from "./agent/model.ts";
import { runWorkbookAgent } from "./agent/workbook-agent.ts";
import { parseEnv } from "./env.ts";

// Live smoke: spends a few cents. Loads the key inside this process, prints no secret.
process.loadEnvFile(new URL("../.env", import.meta.url));
const env = parseEnv();
const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const vague = await runAgent(client, [{ role: "user", content: "a fractions worksheet" }]);
console.log("vague ->", vague.kind, vague.kind === "question" ? vague.text : "");
const clear = await runAgent(client, [
  { role: "user", content: "a grade 4 fractions worksheet, 6 items" },
]);
console.log("clear ->", clear.kind, clear.kind === "worksheet" ? clear.sheet.band : "");
// The workbook run is real spend too, so it is printed and totalled with the others.
const workbook = clear.kind === "worksheet" ? await runWorkbookAgent(client, clear.sheet) : null;
if (workbook) console.log("workbook ->", workbook.kind);
for (const r of workbook ? [vague, clear, workbook] : [vague, clear])
  console.log(r.kind, r.usage, `$${costUsd(r.usage).toFixed(5)}`);
