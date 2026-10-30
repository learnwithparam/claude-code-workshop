import type Anthropic from "@anthropic-ai/sdk";
import { buildWorkbook } from "@workshop/shared";
import { describe, expect, it } from "vitest";
import worksheets from "../../fixtures/worksheets.json" with { type: "json" };
import { parseEnv } from "./env.ts";
import { createApp } from "./server.ts";

const env = parseEnv({ ANTHROPIC_API_KEY: "x".repeat(30) });
const usage = { input: 100, cacheRead: 0, cacheWrite: 0, output: 50 };
const sheet = worksheets[0]?.worksheet;
const workbook = buildWorkbook({
  title: "T",
  band: "grade-3-5",
  subject: "S",
  cover: { title: "T", subtitle: "S" },
  chapters: [{ title: "C", items: [{ prompt: "Q", answer: "A" }] }],
});
const client = {} as Anthropic;
const post = (app: ReturnType<typeof createApp>, body: unknown) =>
  app.request("/workbook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /workbook", () => {
  it("sends the worksheet to the agent and streams the workbook back (R12, R13)", async () => {
    let seen: unknown;
    const runWorkbook = async (_c: Anthropic, s: unknown) => {
      seen = s;
      return { kind: "workbook" as const, workbook, usage };
    };
    const text = await (await post(createApp({ env, client, runWorkbook }), { sheet })).text();
    expect(seen).toEqual(sheet);
    expect(text).toContain("event: workbook");
  });

  it("validates the body with zod before using it (R14)", async () => {
    let called = false;
    const runWorkbook = async () => {
      called = true;
      return { kind: "failed" as const, usage };
    };
    const app = createApp({ env, client, runWorkbook });
    expect((await post(app, { sheet: { title: 1 } })).status).toBe(400);
    expect((await post(app, {})).status).toBe(400);
    expect(called).toBe(false);
  });

  it("answers failures and throws with a generic error only (R16)", async () => {
    const runWorkbook = async () => {
      throw new Error("claude-haiku-5-5 key-123 at agent.ts:9 token 123");
    };
    const text = await (await post(createApp({ env, client, runWorkbook }), { sheet })).text();
    expect(text).toContain("event: error");
    expect(text).not.toMatch(/claude|haiku|key-123|\.ts:|token/i);
  });

  it("counts workbook spend toward the daily budget (R20)", async () => {
    const tight = parseEnv({ ANTHROPIC_API_KEY: "x".repeat(30), DAILY_BUDGET_USD: "0.0000001" });
    const runWorkbook = async () => ({ kind: "workbook" as const, workbook, usage });
    const app = createApp({ env: tight, client, runWorkbook });
    await (await post(app, { sheet })).text();
    expect((await post(app, { sheet })).status).toBe(429);
  });
});
