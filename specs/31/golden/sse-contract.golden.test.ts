import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AgentResult } from "../../../api/src/agent/agent.ts";
import { parseEnv } from "../../../api/src/env.ts";
import { createApp } from "../../../api/src/server.ts";
import { renderWorksheet, type Worksheet, worksheetSchema } from "../../../shared/src/index.ts";
import { type ChatEvent, chat } from "../../../web/src/lib/api.ts";
import { remember } from "../../../web/src/lib/history.ts";
import recorded from "./recorded-events.json";

// recorded-events.json is the wire the api wrote for each outcome. The worksheet html is replaced
// by a marker because it is the renderer's job, not the event's shape.
const MARKER = "<rendered>";
const env = parseEnv({ ANTHROPIC_API_KEY: "x".repeat(30), DAILY_BUDGET_USD: "1" });
const body = JSON.stringify({ messages: [{ role: "user", content: "a worksheet" }] });

async function apiWire(result: AgentResult | Error): Promise<string> {
  const run = async () => {
    if (result instanceof Error) throw result;
    return result;
  };
  const app = createApp({ env, client: {} as Anthropic, run });
  const res = await app.request("/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  return res.text();
}

// Small chunks so a frame is split across reads, as a real network would.
function replay(wire: string, size = 7) {
  const bytes = new TextEncoder().encode(wire);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += size) controller.enqueue(bytes.subarray(i, i + size));
      controller.close();
    },
  });
  vi.stubGlobal("fetch", async () => new Response(stream, { status: 200 }));
}

async function webEvents(wire: string): Promise<ChatEvent[]> {
  replay(wire);
  const events: ChatEvent[] = [];
  for await (const ev of chat([{ role: "user", content: "a worksheet" }])) events.push(ev);
  return events;
}

const frames = (wire: string) =>
  wire
    .split("\n\n")
    .filter(Boolean)
    .map((f) => ({
      event: /^event: (.+)$/m.exec(f)?.[1],
      data: JSON.parse(/^data: (.+)$/m.exec(f)?.[1] ?? "null"),
    }));

afterEach(() => vi.unstubAllGlobals());

describe("api writes the recorded events", () => {
  it.each(["question", "worksheet", "failed"] as const)("%s outcome", async (name) => {
    const { result, wire } = recorded[name];
    // sheetId is added by the template cache (spec 35) and is not part of the recorded wire.
    const live = (await apiWire(result as AgentResult)).replace(/,"sheetId":"[^"]*"/, "");
    const sheet = (result as { sheet?: Worksheet }).sheet;
    const shown = sheet
      ? live.replace(JSON.stringify(renderWorksheet(sheet)), `"${MARKER}"`)
      : live;
    expect(sheet ? shown.includes(`"${MARKER}"`) : true).toBe(true);
    expect(shown).toBe(wire);
  });

  it("a thrown run", async () => {
    expect(await apiWire(new Error("boom"))).toBe(recorded.thrown.wire);
  });
});

describe("web reads the recorded events", () => {
  it("keeps the whole sheet from a worksheet event, not just the html", async () => {
    const events = await webEvents(recorded.worksheet.wire);
    expect(events.map((e) => e.event)).toEqual(["worksheet", "usage"]);
    const ws = events[0]?.data as { sheet?: unknown; html?: unknown };
    expect(worksheetSchema.parse(ws.sheet)).toEqual(
      (recorded.worksheet.result as { sheet: Worksheet }).sheet,
    );
    expect(ws.html).toBe(MARKER);
  });

  it.each(["question", "failed", "thrown"] as const)("replays %s as recorded", async (name) => {
    const events = await webEvents(recorded[name].wire);
    expect(events.map((e) => ({ event: e.event, data: e.data }))).toEqual(
      frames(recorded[name].wire),
    );
  });

  it("remembers the question and the worksheet for the next turn", async () => {
    const history: { role: "user" | "assistant"; content: string }[] = [];
    for (const name of ["question", "worksheet"] as const)
      for (const ev of await webEvents(recorded[name].wire)) remember(history, ev);
    expect(history.map((m) => m.role)).toEqual(["assistant", "assistant"]);
  });
});

// If the api changes a shape, the web must say so instead of passing a half-event to the page.
describe("web refuses a changed event shape", () => {
  const drifted = {
    "worksheet without its sheet": 'event: worksheet\ndata: {"html":"<p>x</p>"}\n\n',
    "worksheet with a string sheet": 'event: worksheet\ndata: {"sheet":"x","html":"<p>x</p>"}\n\n',
    "question renamed to prompt": 'event: question\ndata: {"prompt":"Which grade?"}\n\n',
    "usage without costUsd":
      'event: usage\ndata: {"input":1,"cacheRead":0,"cacheWrite":0,"output":1}\n\n',
    "an event the client does not know": 'event: progress\ndata: {"pct":50}\n\n',
  };

  it.each(Object.entries(drifted))("%s", async (_name, wire) => {
    const events = await webEvents(wire);
    expect(events.map((e) => e.event)).toEqual(["error"]);
    expect(JSON.stringify(events)).not.toMatch(/claude|haiku|zod|invalid|\.ts:/i);
  });
});
