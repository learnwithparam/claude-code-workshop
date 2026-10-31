import type Anthropic from "@anthropic-ai/sdk";
import worksheets from "../../fixtures/worksheets.json" with { type: "json" };
import type { AgentResult } from "./agent/agent.ts";
import { describe, expect, it } from "vitest";
import { parseEnv } from "./env.ts";
import { createApp } from "./server.ts";

const env = parseEnv({ ANTHROPIC_API_KEY: "x".repeat(30) });
const app = () => createApp({ env, client: {} as Anthropic });
const mark = (a: ReturnType<typeof app>, body: string) =>
  a.request("/templates/good", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

// The route writes to the shared template store, so it takes the same body cap and rate limit as /chat.
describe("POST /templates/good", () => {
  it("refuses an oversized body", async () => {
    const res = await mark(app(), JSON.stringify({ sheetId: "x".repeat(100_000) }));
    expect(res.status).toBe(413);
  });

  it("rate limits repeated marks from one caller", async () => {
    const a = app();
    const codes: number[] = [];
    for (let i = 0; i < 40; i++)
      codes.push((await mark(a, JSON.stringify({ sheetId: "nope" }))).status);
    expect(codes).toContain(429);
  });

  it("refuses to distill a sheet whose remembered prompt is empty", async () => {
    const sheet = worksheets[0]?.worksheet as never;
    const usage = { input: 1, cacheRead: 0, cacheWrite: 0, output: 1 };
    const run = async (): Promise<AgentResult> => ({ kind: "worksheet", sheet, usage });
    const a = createApp({ env, client: {} as Anthropic, run });
    // Two turns make the request unstable, so the api remembers the sheet with an empty prompt.
    const chat = await a.request("/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "user", content: "a" },
          { role: "assistant", content: "b" },
          { role: "user", content: "c" },
        ],
      }),
    });
    const sheetId = /"sheetId":"([0-9a-f]+)"/.exec(await chat.text())?.[1];
    expect(sheetId).toBeTruthy();
    expect((await mark(a, JSON.stringify({ sheetId }))).status).toBe(422);
  });
});
