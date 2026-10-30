import type Anthropic from "@anthropic-ai/sdk";
import { renderWorkbook, renderWorksheet, worksheetSchema } from "@workshop/shared";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { type AgentResult, runAgent } from "./agent/agent.ts";
import { costUsd } from "./agent/model.ts";
import { runWorkbookAgent } from "./agent/workbook-agent.ts";
import type { Env } from "./env.ts";

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .min(1)
    .max(20),
});

const workbookBodySchema = z.object({ sheet: worksheetSchema });

const MAX_BODY_BYTES = 16_000;
const RATE_PER_MINUTE = 10;

type Deps = {
  env: Env;
  client: Anthropic;
  run?: typeof runAgent;
  runWorkbook?: typeof runWorkbookAgent;
};

export function createApp({ env, client, run = runAgent, runWorkbook = runWorkbookAgent }: Deps) {
  const app = new Hono();
  const hits = new Map<string, number[]>();
  let spentUsd = 0;
  let day = new Date().toDateString();

  app.use("*", cors({ origin: env.ALLOWED_ORIGIN, allowMethods: ["POST", "GET"] }));
  app.get("/health", (c) => c.json({ ok: true }));

  // Rate limit, daily budget and body size are shared by every route that spends tokens.
  async function admit(c: Context): Promise<{ json: unknown } | Response> {
    const now = Date.now();
    const ip = c.req.header("x-forwarded-for") ?? "local";
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
    if (recent.length >= RATE_PER_MINUTE) return c.json({ error: "Too many requests" }, 429);
    hits.set(ip, [...recent, now]);

    if (new Date().toDateString() !== day) {
      day = new Date().toDateString();
      spentUsd = 0;
    }
    if (spentUsd >= env.DAILY_BUDGET_USD) return c.json({ error: "Daily limit reached" }, 429);

    const raw = await c.req.text();
    if (raw.length > MAX_BODY_BYTES) return c.json({ error: "Request too large" }, 413);
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return c.json({ error: "Bad request" }, 400);
    }
    return { json };
  }

  app.post("/chat", async (c) => {
    const admitted = await admit(c);
    if (admitted instanceof Response) return admitted;
    const body = bodySchema.safeParse(admitted.json);
    if (!body.success) return c.json({ error: "Bad request" }, 400);

    return streamSSE(c, async (stream) => {
      const send = (event: string, data: unknown) =>
        stream.writeSSE({ event, data: JSON.stringify(data) });
      try {
        const result: AgentResult = await run(client, body.data.messages);
        const cost = costUsd(result.usage);
        spentUsd += cost;
        if (result.kind === "question") await send("question", { text: result.text });
        else if (result.kind === "worksheet")
          await send("worksheet", { sheet: result.sheet, html: renderWorksheet(result.sheet) });
        else await send("error", { message: "Could not make a worksheet. Try again." });
        await send("usage", { ...result.usage, costUsd: cost });
      } catch {
        // Generic body: no model name, token detail or stack ever reaches a customer.
        await send("error", { message: "Something went wrong. Try again." });
      }
    });
  });

  app.post("/workbook", async (c) => {
    const admitted = await admit(c);
    if (admitted instanceof Response) return admitted;
    const body = workbookBodySchema.safeParse(admitted.json);
    if (!body.success) return c.json({ error: "Bad request" }, 400);

    return streamSSE(c, async (stream) => {
      const send = (event: string, data: unknown) =>
        stream.writeSSE({ event, data: JSON.stringify(data) });
      try {
        const result = await runWorkbook(client, body.data.sheet);
        const cost = costUsd(result.usage);
        spentUsd += cost;
        if (result.kind === "workbook")
          await send("workbook", {
            workbook: result.workbook,
            html: renderWorkbook(result.workbook),
          });
        else await send("error", { message: "Could not make a workbook. Try again." });
        await send("usage", { ...result.usage, costUsd: cost });
      } catch {
        await send("error", { message: "Something went wrong. Try again." });
      }
    });
  });

  return app;
}
