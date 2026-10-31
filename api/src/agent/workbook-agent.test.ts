import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import worksheets from "../../../fixtures/worksheets.json" with { type: "json" };
import { runWorkbookAgent } from "./workbook-agent.ts";

const sheet = worksheets[0]?.worksheet as Parameters<typeof runWorkbookAgent>[1];
const content = {
  title: "T",
  band: sheet.band,
  subject: "S",
  cover: { title: "T", subtitle: "S" },
  chapters: [{ title: "C", items: [{ prompt: "Q", answer: "A" }] }],
};

const base = { id: "m", type: "message", role: "assistant", model: "m" };
const usage = { input_tokens: 10, output_tokens: 5 };
const turn = (input: unknown) => ({
  ...base,
  stop_reason: "tool_use",
  content: [{ type: "tool_use", id: "tu", name: "submit_workbook", input }],
  usage,
});
const done = { ...base, stop_reason: "end_turn", content: [{ type: "text", text: "" }], usage };

function scripted(turns: unknown[]) {
  let n = 0;
  const fetch = async () =>
    new Response(JSON.stringify(turns[Math.min(n++, turns.length - 1)]), {
      headers: { "content-type": "application/json" },
    });
  return new Anthropic({ apiKey: "x".repeat(30), fetch: fetch as typeof globalThis.fetch });
}

describe("runWorkbookAgent", () => {
  it("returns a validated workbook that keeps the source band (R12, R13, R15)", async () => {
    const result = await runWorkbookAgent(scripted([turn(content), done]), sheet);
    expect(result.kind).toBe("workbook");
    if (result.kind === "workbook") expect(result.workbook.band).toBe(sheet.band);
  });

  it("rejects tool input that does not match the schema (R15, R16)", async () => {
    const result = await runWorkbookAgent(scripted([turn({ title: "x" }), done]), sheet);
    expect(result.kind).toBe("failed");
  });

  it("rejects a workbook whose band differs from the source (R13)", async () => {
    const other = sheet.band === "university" ? "kindergarten" : "university";
    const result = await runWorkbookAgent(
      scripted([turn({ ...content, band: other }), done]),
      sheet,
    );
    expect(result.kind).toBe("failed");
  });
});
