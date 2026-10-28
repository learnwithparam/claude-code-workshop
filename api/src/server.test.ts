import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import type { AgentResult } from "./agent/agent.ts";
import { parseEnv } from "./env.ts";
import { createApp } from "./server.ts";

const env = parseEnv({ ANTHROPIC_API_KEY: "x".repeat(30), DAILY_BUDGET_USD: "1" });
const usage = { input: 100, cacheRead: 0, cacheWrite: 0, output: 50 };
const client = {} as Anthropic;

const post = (app: ReturnType<typeof createApp>, body: unknown, headers = {}) =>
  app.request("/chat", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const ask = { messages: [{ role: "user", content: "worksheet please" }] };

describe("POST /chat", () => {
  it("streams question then usage, in that order", async () => {
    const run = async (): Promise<AgentResult> => ({
      kind: "question",
      text: "Which grade?",
      usage,
    });
    const res = await post(createApp({ env, client, run }), ask);
    const text = await res.text();
    expect(text.indexOf("event: question")).toBeGreaterThanOrEqual(0);
    expect(text.indexOf("event: question")).toBeLessThan(text.indexOf("event: usage"));
  });

  it("sends a generic error with no model, token or stack detail", async () => {
    const run = async (): Promise<AgentResult> => {
      throw new Error("claude-haiku-5-5 401 sk-ant-secret at /api/src/agent.ts:12");
    };
    const text = await (await post(createApp({ env, client, run }), ask)).text();
    expect(text).toContain("event: error");
    expect(text).not.toMatch(/claude|haiku|sk-ant|\.ts:|token/i);
  });

  it("rejects a bad body, an oversized body and the 11th request in a minute", async () => {
    const run = async (): Promise<AgentResult> => ({ kind: "failed", usage });
    const app = createApp({ env, client, run });
    expect((await post(app, { messages: [] })).status).toBe(400);
    expect((await post(app, "x".repeat(20_000))).status).toBe(413);
    for (let i = 0; i < 8; i++) await post(app, ask);
    expect((await post(app, ask)).status).toBe(429);
  });

  it("stops at the daily budget", async () => {
    const tight = parseEnv({ ANTHROPIC_API_KEY: "x".repeat(30), DAILY_BUDGET_USD: "0.0000001" });
    const run = async (): Promise<AgentResult> => ({ kind: "question", text: "?", usage });
    const app = createApp({ env: tight, client, run });
    await (await post(app, ask)).text();
    expect((await post(app, ask)).status).toBe(429);
  });

  it("only allows the configured origin", async () => {
    const run = async (): Promise<AgentResult> => ({ kind: "failed", usage });
    const res = await post(createApp({ env, client, run }), ask, {
      origin: "http://localhost:4321",
    });
    expect(res.headers.get("access-control-allow-origin")).toBe(env.ALLOWED_ORIGIN);
  });
});

describe("parseEnv", () => {
  it("fails fast and never echoes the value", () => {
    expect(() => parseEnv({ ANTHROPIC_API_KEY: "short" })).toThrow(/ANTHROPIC_API_KEY/);
    expect(() => parseEnv({ ANTHROPIC_API_KEY: "short" })).not.toThrow(/short/);
  });
});
