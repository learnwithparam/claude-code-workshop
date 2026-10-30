import { writeFileSync } from "node:fs";

import Anthropic from "@anthropic-ai/sdk";
import { checkBand, parseBand } from "@workshop/shared";
import fixtures from "../../fixtures/worksheets.json" with { type: "json" };
import { runAgent } from "./agent/agent.ts";
import { fillSlots } from "./agent/fill-template.ts";
import { LIVE_CAP_USD, withinLiveCap } from "./agent/live-cap.ts";
import { costUsd } from "./agent/model.ts";
import { runTemplateEval } from "./agent/template-eval.ts";
import { runWorkbookAgent } from "./agent/workbook-agent.ts";
import { parseEnv } from "./env.ts";

// Live eval: runs every fixture prompt through the agent and records the result for offline replay.
process.loadEnvFile(new URL("../.env", import.meta.url));
const env = parseEnv();
const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// Generous per-call ceiling (max_tokens 2000 on Haiku), so the cap is never crossed by a call in flight.
const CALL_CEILING_USD = 0.02;
let spent = env.LIVE_SPENT_USD;
const canSpend = () => withinLiveCap(spent, CALL_CEILING_USD, LIVE_CAP_USD);

const rows = [];
for (const { prompt } of fixtures) {
  if (!canSpend()) {
    console.log("live-run cap reached, stopping before the next call");
    break;
  }
  const result = await runAgent(client, [{ role: "user", content: prompt }]);
  spent += costUsd(result.usage);
  const compliant = result.kind === "worksheet" && checkBand(result.sheet).ok;
  const bandMatches = result.kind === "worksheet" && result.sheet.band === parseBand(prompt);
  rows.push({
    prompt,
    kind: result.kind,
    compliant,
    bandMatches,
    outputTokens: result.usage.output,
    costUsd: Number(costUsd(result.usage).toFixed(5)),
  });
  console.log(prompt.slice(0, 40), result.kind, compliant, result.usage.output);
  // One workbook per fixture, recorded as its own row so its spend counts toward the live-run cap.
  if (result.kind === "worksheet") {
    const workbook = await runWorkbookAgent(client, result.sheet);
    rows.push({
      prompt: `workbook: ${prompt}`,
      kind: workbook.kind,
      compliant: workbook.kind === "workbook",
      bandMatches: workbook.kind === "workbook" && workbook.workbook.band === result.sheet.band,
      outputTokens: workbook.usage.output,
      costUsd: Number(costUsd(workbook.usage).toFixed(5)),
    });
  }
}
// Acceptance: a template fill spends fewer output tokens than a full generation of the same prompt.
const comparison = await runTemplateEval({
  prompt: "Grade 2 addition worksheet, 5 items",
  spentUsd: spent,
  estimateUsd: CALL_CEILING_USD * 2,
  capUsd: LIVE_CAP_USD,
  client,
  run: runAgent,
  fill: fillSlots,
});
if (comparison.kind === "over-budget") console.log(comparison.message);
else
  console.log(
    "output tokens without template:",
    comparison.without,
    "with template:",
    comparison.withTemplate,
  );

writeFileSync("fixtures/eval.json", `${JSON.stringify(rows, null, 2)}\n`);
if (comparison.kind === "report" && !comparison.ok) {
  console.error("template fill did not use fewer output tokens");
  process.exit(1);
}
