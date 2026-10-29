import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import worksheets from "../../../fixtures/worksheets.json" with { type: "json" };
import { type AgentResult, runAgent } from "./agent.ts";
import { runManualAgent } from "./manual-loop.ts";

const good = worksheets[0]?.worksheet;
const overfull = { ...good, sections: [{ ...good?.sections[0], items: Array(60).fill(good?.sections[0]?.items[0]) }] };

const toolTurn = (id: string, input: unknown) => ({
  id: `msg_${id}`,
  type: "message",
  role: "assistant",
  model: "claude-haiku-5-5",
  stop_reason: "tool_use",
  content: [{ type: "tool_use", id: `tu_${id}`, name: "submit_worksheet", input }],
  usage: { input_tokens: 100, output_tokens: 40 },
});
const textTurn = (text: string) => ({
  id: "msg_end",
  type: "message",
  role: "assistant",
  model: "claude-haiku-5-5",
  stop_reason: "end_turn",
  content: [{ type: "text", text }],
  usage: { input_tokens: 120, output_tokens: 10 },
});

// A real SDK client whose network is a script, so both loops run their real code.
function scripted(turns: unknown[]) {
  const seen: unknown[] = [];
  const fetch = async (_url: unknown, init?: { body?: unknown }) => {
    seen.push(JSON.parse(String(init?.body)));
    const turn = turns[Math.min(seen.length - 1, turns.length - 1)];
    return new Response(JSON.stringify(turn), { headers: { "content-type": "application/json" } });
  };
  const client = new Anthropic({ apiKey: "x".repeat(30), fetch: fetch as typeof globalThis.fetch });
  return { client, seen };
}

const ask = [{ role: "user" as const, content: "a fractions worksheet for grade 4" }];

async function bothRun(turns: unknown[]) {
  const a = scripted(turns);
  const b = scripted(turns);
  const viaRunner: AgentResult = await runAgent(a.client, ask);
  const viaLoop: AgentResult = await runManualAgent(b.client, ask);
  return { viaRunner, viaLoop, callsRunner: a.seen.length, callsLoop: b.seen.length };
}

describe("manual loop", () => {
  it("returns what toolRunner returns when the model fixes a bad worksheet", async () => {
    const turns = [toolTurn("1", overfull), toolTurn("2", good), textTurn("Done.")];
    const { viaRunner, viaLoop, callsRunner, callsLoop } = await bothRun(turns);
    expect(viaLoop).toEqual(viaRunner);
    expect(viaLoop.kind).toBe("worksheet");
    expect(callsLoop).toBe(callsRunner);
  });

  it("returns a question when the model only asks one", async () => {
    const { viaRunner, viaLoop } = await bothRun([textTurn("Which grade?")]);
    expect(viaLoop).toEqual(viaRunner);
    expect(viaLoop.kind).toBe("question");
  });

  it("stops at the iteration cap and returns failed, as toolRunner does", async () => {
    const { viaRunner, viaLoop, callsLoop } = await bothRun([toolTurn("x", overfull)]);
    expect(callsLoop).toBe(4);
    expect(viaLoop.kind).toBe("failed");
    expect(viaLoop).toEqual(viaRunner);
  });
});
