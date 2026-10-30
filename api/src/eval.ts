import { writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { checkBand, parseBand } from "@workshop/shared";
import fixtures from "../../fixtures/worksheets.json" with { type: "json" };
import { runAgent } from "./agent/agent.ts";
import { costUsd } from "./agent/model.ts";
import { runWorkbookAgent } from "./agent/workbook-agent.ts";
import { parseEnv } from "./env.ts";

// Live eval: runs every fixture prompt through the agent and records the result for offline replay.
process.loadEnvFile(new URL("../.env", import.meta.url));
const client = new Anthropic({ apiKey: parseEnv().ANTHROPIC_API_KEY });

const rows = [];
for (const { prompt } of fixtures) {
  const result = await runAgent(client, [{ role: "user", content: prompt }]);
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
writeFileSync("fixtures/eval.json", `${JSON.stringify(rows, null, 2)}\n`);
