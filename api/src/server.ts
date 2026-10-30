import { createHash } from "node:crypto";
import type Anthropic from "@anthropic-ai/sdk";
import {
  BANDS,
  checkBand,
  fillSlotsSchema,
  fillTemplate,
  parseBand,
  renderWorkbook,
  renderWorksheet,
  type Worksheet,
  worksheetSchema,
} from "@workshop/shared";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { type AgentResult, runAgent } from "./agent/agent.ts";
import { type FillResult, fillSlots } from "./agent/fill-template.ts";
import { LIVE_CAP_USD } from "./agent/live-cap.ts";
import { costUsd, type Usage } from "./agent/model.ts";
import { runWorkbookAgent } from "./agent/workbook-agent.ts";
import { createPromptCache, normalisePrompt } from "./cache/prompt-cache.ts";
import type { Env } from "./env.ts";
import { distillTemplate } from "./templates/distill-template.ts";
import { templateIdSchema } from "./templates/template-id.ts";
import { createTemplateStore } from "./templates/template-store.ts";

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .min(1)
    .max(20),
});

const workbookBodySchema = z.object({ sheet: worksheetSchema });

const MAX_BODY_BYTES = 16_000;
const RATE_PER_MINUTE = 10;

const goodSchema = z.object({ sheetId: templateIdSchema });
const MAX_SHEETS = 500;
const NO_USAGE: Usage = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };

type Deps = {
  env: Env;
  client: Anthropic;
  run?: typeof runAgent;
  runWorkbook?: typeof runWorkbookAgent;
  fill?: (client: Anthropic, args: { slots: string[]; prompt: string }) => Promise<FillResult>;
  templates?: ReturnType<typeof createTemplateStore>;
};

export function createApp({
  env,
  client,
  run = runAgent,
  runWorkbook = runWorkbookAgent,
  fill = fillSlots,
  templates = createTemplateStore(),
}: Deps) {
  const app = new Hono();
  const cache = createPromptCache();
  // Every sheet the api sent, so "mark good" can name one by id without trusting a client copy.
  const sheets = new Map<string, { sheet: Worksheet; prompt: string }>();
  const remember = (sheet: Worksheet, prompt: string) => {
    const id = createHash("sha256").update(JSON.stringify(sheet)).digest("hex").slice(0, 16);
    sheets.set(id, { sheet, prompt });
    const oldest = sheets.keys().next().value;
    if (sheets.size > MAX_SHEETS && oldest !== undefined) sheets.delete(oldest);
    return id;
  };
  const hits = new Map<string, number[]>();
  let spentUsd = 0;
  let day = new Date().toDateString();

  app.use("*", cors({ origin: env.ALLOWED_ORIGIN, allowMethods: ["POST", "GET"] }));
  app.get("/health", (c) => c.json({ ok: true }));

  app.post("/templates/good", async (c) => {
    const admitted = await admit(c);
    if (admitted instanceof Response) return admitted;
    const body = goodSchema.safeParse(admitted.json);
    if (!body.success) return c.json({ error: "Bad request" }, 400);
    const known = sheets.get(body.data.sheetId);
    if (!known) return c.json({ error: "Unknown sheet" }, 404);
    const result = distillTemplate(known.sheet, known.prompt);
    if (!result.ok) return c.json({ error: "Sheet does not meet its band" }, 422);
    templates.add(result.template);
    return c.json({ ok: true });
  });

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
        const { messages } = body.data;
        const last = messages[messages.length - 1];
        // Only a lone request is a stable key; a reply to a question depends on the turns before it.
        const prompt = messages.length === 1 && last?.role === "user" ? last.content : null;
        const band = prompt ? parseBand(prompt) : null;
        const sendSheet = async (sheet: Worksheet, usage: Usage) => {
          const cost = costUsd(usage);
          spentUsd += cost;
          await send("worksheet", {
            sheet,
            html: renderWorksheet(sheet),
            sheetId: remember(sheet, prompt ?? ""),
          });
          await send("usage", { ...usage, costUsd: cost });
        };

        // Cache hits return before this, so a repeat never spends the shared live-run cap.
        const capped = () => env.LIVE_SPENT_USD + spentUsd >= LIVE_CAP_USD;
        const refuse = () => send("error", { message: "Could not make a worksheet. Try again." });

        if (prompt && band) {
          const hit = cache.get(prompt, band);
          if (hit && checkBand(hit).ok) return await sendSheet(hit, NO_USAGE);
          if (hit) cache.delete(prompt, band);

          const found = templates.find(band, normalisePrompt(prompt).split(" "));
          // A slot count past the band's limit could never pass checkBand, so skip it up front.
          const template = found && found.slots.length <= BANDS[band].maxItems ? found : undefined;
          if (template) {
            if (capped()) return await refuse();
            const filled = await fill(client, { slots: template.slots, prompt });
            spentUsd += costUsd(filled.usage);
            const values =
              filled.kind === "slots" ? fillSlotsSchema(template).safeParse(filled) : null;
            const sheet = values?.success ? fillTemplate(template, values.data.values) : null;
            if (!sheet || !checkBand(sheet).ok) {
              await send("error", { message: "Could not make a worksheet. Try again." });
              return;
            }
            cache.set(prompt, band, sheet);
            return await sendSheet(sheet, { ...filled.usage });
          }
        }

        if (capped()) return await refuse();
        const result: AgentResult = await run(client, messages);
        if (result.kind === "worksheet") {
          if (prompt && band) cache.set(prompt, band, result.sheet);
          return await sendSheet(result.sheet, result.usage);
        }
        const cost = costUsd(result.usage);
        spentUsd += cost;
        if (result.kind === "question") await send("question", { text: result.text });
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
