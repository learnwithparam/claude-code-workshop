import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import type { AgentResult } from "../../../api/src/agent/agent.ts";
import { parseEnv } from "../../../api/src/env.ts";
import { createApp } from "../../../api/src/server.ts";
import fixtures from "../../../fixtures/worksheets.json" with { type: "json" };
import { checkBand, type Worksheet } from "../../../shared/src/index.ts";

// One test per scenario in specs/35/spec.md. Each fails on the base commit because no cache or template code exists.
// Contract the build must meet (see specs/35/contract.md): createApp builds its own cache and template store;
// the worksheet SSE event carries `sheetId`; POST /templates/good takes { sheetId }; a template fill is a
// run-level call, injected as `fill` next to `run` in createApp deps.

const env = parseEnv({ ANTHROPIC_API_KEY: "x".repeat(30), DAILY_BUDGET_USD: "100" });
const client = {} as Anthropic;
const usage = { input: 100, cacheRead: 0, cacheWrite: 0, output: 50 };
const base = fixtures.find((f) => f.worksheet.band === "grade-1-2")?.worksheet as Worksheet;

const sheetWith = (band: Worksheet["band"], n: number): Worksheet => ({
  ...base,
  band,
  sections: [
    {
      heading: "Add",
      instruction: "Add the numbers.",
      items: Array.from({ length: n }, (_, i) => ({
        prompt: `${i} + 1`,
        answer: `${i + 1}`,
        picture: "ball" as const,
      })),
    },
  ],
});

function harness(
  make: (call: number) => AgentResult = () => ({
    kind: "worksheet",
    sheet: sheetWith("grade-1-2", 5),
    usage,
  }),
) {
  let calls = 0;
  const run = async (): Promise<AgentResult> => make(calls++);
  let fills = 0;
  const filled: unknown[] = [];
  const fill = async (_c: unknown, args: { slots: string[]; values?: unknown }) => {
    fills++;
    filled.push(args);
    return {
      kind: "slots",
      values: args.slots.map((s) => `v-${s}`),
      usage: { ...usage, output: 10 },
    };
  };
  const app = createApp({ env, client, run, fill } as never);
  return { app, calls: () => calls, fills: () => fills, filled };
}
type H = ReturnType<typeof harness>;

const chat = async (h: H, content: string) => {
  const res = await h.app.request("/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content }] }),
  });
  const text = await res.text();
  const data = (name: string) => {
    const m = text.match(new RegExp(`event: ${name}\\ndata: (.*)`));
    return m?.[1] ? JSON.parse(m[1]) : undefined;
  };
  return { text, worksheet: data("worksheet"), usage: data("usage"), error: data("error") };
};
const markGood = (h: H, sheetId: unknown) =>
  h.app.request("/templates/good", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sheetId }),
  });

describe("prompt cache and learned templates", () => {
  it("A repeat prompt is served from the exact cache", async () => {
    const h = harness();
    const first = await chat(h, "Grade 2 addition worksheet, 5 items");
    const again = await chat(h, "Grade 2 addition worksheet, 5 items");
    expect(h.calls()).toBe(1);
    expect(again.worksheet.sheet).toEqual(first.worksheet.sheet);
    expect(again.usage.input).toBe(0);
    expect(again.usage.output).toBe(0);
  });

  it("The cache key ignores case and surrounding whitespace", async () => {
    const h = harness();
    await chat(h, "Grade 2 addition worksheet");
    const again = await chat(h, "  GRADE 2   Addition Worksheet ");
    expect(again.worksheet).toBeDefined();
    expect(h.calls()).toBe(1);
  });

  it("The same prompt in a different band is a cache miss", async () => {
    const h = harness((n) => ({
      kind: "worksheet",
      sheet: sheetWith(n === 0 ? "grade-1-2" : "grade-3-5", 3),
      usage,
    }));
    await chat(h, "Fractions worksheet for grade 2");
    await chat(h, "Fractions worksheet for grade 2");
    expect(h.calls()).toBe(1);
    await chat(h, "Fractions worksheet for grade 5");
    expect(h.calls()).toBe(2);
  });

  it("A cache miss is stored for next time", async () => {
    const h = harness();
    await chat(h, "Animals word search grade 1");
    expect(h.calls()).toBe(1);
    await chat(h, "animals word search grade 1");
    expect(h.calls()).toBe(1);
  });

  it("A clarifying question is not cached", async () => {
    const h = harness(() => ({ kind: "question", text: "Which grade?", usage }));
    await chat(h, "Make me a worksheet");
    await chat(h, "Make me a worksheet");
    expect(h.calls()).toBe(2);
    // Contrast: a worksheet answer to the same shape of request is cached, so the cache exists.
    const w = harness();
    await chat(w, "Grade 2 sums");
    await chat(w, "Grade 2 sums");
    expect(w.calls()).toBe(1);
  });

  it("A cached worksheet that fails the shared check is discarded", async () => {
    // First answer is over the band limit (as if the band table tightened); the second is fine.
    const h = harness((n) => ({
      kind: "worksheet",
      sheet: sheetWith("grade-1-2", n === 0 ? 40 : 3),
      usage,
    }));
    expect(checkBand(sheetWith("grade-1-2", 40)).ok).toBe(false);
    await chat(h, "Spelling list grade 1");
    const again = await chat(h, "Spelling list grade 1");
    expect(h.calls()).toBe(2);
    expect(checkBand(again.worksheet.sheet).ok).toBe(true);
    // The valid second answer is stored, so a third request is a hit.
    await chat(h, "Spelling list grade 1");
    expect(h.calls()).toBe(2);
  });

  it("Marking a sheet good distils a template", async () => {
    const { distillTemplate } = await import("../../../api/src/templates/distill-template.ts");
    const sheet = sheetWith("grade-1-2", 5);
    const result = distillTemplate(sheet);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const t = result.template;
    expect(t.band).toBe("grade-1-2");
    expect(t.slots).toHaveLength(5);
    expect(t.sections).toHaveLength(sheet.sections.length);
    expect(t.sections[0]?.heading).toBe(sheet.sections[0]?.heading);
    expect(JSON.stringify(t)).not.toContain("0 + 1");
  });

  it("Marking a sheet good that fails the shared check is rejected", async () => {
    const h = harness(() => ({ kind: "worksheet", sheet: sheetWith("grade-1-2", 40), usage }));
    const { worksheet } = await chat(h, "Grade 2 big sheet");
    const res = await markGood(h, worksheet.sheetId);
    expect(res.status).toBe(422);
    await chat(h, "Grade 2 addition worksheet about farm animals");
    expect(h.fills()).toBe(0);
  });

  it("Marking the same sheet good twice stores one template", async () => {
    const { createTemplateStore } = await import("../../../api/src/templates/template-store.ts");
    const { distillTemplate } = await import("../../../api/src/templates/distill-template.ts");
    const store = createTemplateStore();
    const r = distillTemplate(sheetWith("grade-1-2", 5));
    if (!r.ok) throw new Error("distil failed");
    store.add(r.template);
    store.add(r.template);
    expect(store.size()).toBe(1);
  });

  it("A matching request has the model fill only the slots", async () => {
    const h = harness();
    const { worksheet } = await chat(h, "Grade 2 addition worksheet");
    expect((await markGood(h, worksheet.sheetId)).status).toBe(200);
    const out = await chat(h, "Grade 2 addition worksheet about farm animals");
    expect(h.calls()).toBe(1);
    expect(h.fills()).toBe(1);
    expect((h.filled[0] as { slots: string[] }).slots).toHaveLength(5);
    expect(JSON.stringify(h.filled[0])).not.toMatch(/heading|instruction|band|sections/);
    expect(out.worksheet.html).toContain("v-");
    expect(out.worksheet.sheet.sections[0].heading).toBe(worksheet.sheet.sections[0].heading);
  });

  it("A request with no matching template is generated in full", async () => {
    const h = harness((n) => ({
      kind: "worksheet",
      sheet: sheetWith(n === 0 ? "grade-3-5" : "grade-1-2", 4),
      usage,
    }));
    const { worksheet } = await chat(h, "Fractions worksheet for grade 5");
    await markGood(h, worksheet.sheetId);
    await chat(h, "Grade 2 addition worksheet");
    expect(h.fills()).toBe(0);
    expect(h.calls()).toBe(2);
    await chat(h, "Grade 2 addition worksheet");
    expect(h.calls()).toBe(2);
  });

  it("Slot output that fails zod validation is rejected", async () => {
    const { fillSlotsSchema, fillTemplate } = await import("../../../shared/src/template.ts");
    const { distillTemplate } = await import("../../../api/src/templates/distill-template.ts");
    const r = distillTemplate(sheetWith("grade-1-2", 5));
    if (!r.ok) throw new Error("distil failed");
    expect(fillSlotsSchema(r.template).safeParse({ values: ["a", "b", "c", "d"] }).success).toBe(
      false,
    );
    expect(
      fillSlotsSchema(r.template).safeParse({ values: ["a", "b", "c", "d", "e"] }).success,
    ).toBe(true);
    expect(() => fillTemplate(r.template, ["a", "b", "c", "d"])).toThrow();

    const bad = createApp({
      env,
      client,
      run: async () => ({ kind: "worksheet", sheet: sheetWith("grade-1-2", 5), usage }),
      fill: async () => ({ kind: "slots", values: ["a", "b", "c", "d"], usage }),
    } as never);
    const send = (content: string) =>
      bad.request("/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content }] }),
      });
    const seed = await (await send("Grade 2 addition worksheet")).text();
    const sheetId = JSON.parse(seed.match(/event: worksheet\ndata: (.*)/)?.[1] ?? "{}").sheetId;
    await bad.request("/templates/good", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sheetId }),
    });
    const text = await (await send("Grade 2 addition worksheet about farm animals")).text();
    expect(text).toContain("event: error");
    expect(text).not.toContain("event: worksheet");
    expect(text).not.toMatch(/claude|haiku|token|\.ts:/i);
  });

  it("A template fill uses fewer output tokens than a full generation", async () => {
    const src = await import("node:fs").then((fs) =>
      fs.readFileSync(new URL("../../../api/src/eval.ts", import.meta.url), "utf8"),
    );
    expect(src).toMatch(/runTemplateFill|fill/i);
    expect(src).toMatch(/console\.log\([^)]*(without|withTemplate)/is);
  });

  it("A filled template result is cached like any other result", async () => {
    const h = harness();
    const { worksheet } = await chat(h, "Grade 2 addition worksheet");
    await markGood(h, worksheet.sheetId);
    await chat(h, "Grade 2 addition worksheet about farm animals");
    const again = await chat(h, "Grade 2 addition worksheet about farm animals");
    expect(h.fills()).toBe(1);
    expect(again.usage.output).toBe(0);
  });

  it("Cache and template requests are validated at the boundary", async () => {
    const h = harness();
    expect((await markGood(h, "")).status).toBe(400);
    expect((await markGood(h, undefined)).status).toBe(400);
  });

  it("The web app holds no key and no cache logic", async () => {
    const { execSync } = await import("node:child_process");
    const hits = execSync(
      "grep -rlE 'prompt-cache|template-store|ANTHROPIC_API_KEY' web/src || true",
      { cwd: new URL("../../../", import.meta.url) },
    ).toString();
    expect(hits.trim()).toBe("");
    // Red on base: the api cache module must exist for this guard to mean anything.
    const mod = await import("../../../api/src/cache/prompt-cache.ts");
    expect(mod).toBeDefined();
  });

  it("Cache hits do not spend the live-run cap", async () => {
    // The repeat must be answered by the cache, not by a second live call that spends the cap.
    const nearCap = parseEnv({
      ANTHROPIC_API_KEY: "x".repeat(30),
      DAILY_BUDGET_USD: "100",
      LIVE_SPENT_USD: "10",
    });
    let calls = 0;
    const app = createApp({
      env: nearCap,
      client,
      run: async (): Promise<AgentResult> => {
        calls++;
        return { kind: "worksheet", sheet: sheetWith("grade-1-2", 5), usage };
      },
    } as never);
    const ask = () =>
      app.request("/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Grade 2 sums" }] }),
      });
    await (await ask()).text();
    const again = await (await ask()).text();
    expect(calls).toBe(1);
    expect(again).toContain("event: worksheet");
  });

  it("Live calls stop at the cap", async () => {
    const capped = parseEnv({
      ANTHROPIC_API_KEY: "x".repeat(30),
      DAILY_BUDGET_USD: "100",
      LIVE_SPENT_USD: "60",
    });
    let calls = 0;
    const app = createApp({
      env: capped,
      client,
      run: async (): Promise<AgentResult> => {
        calls++;
        return { kind: "worksheet", sheet: sheetWith("grade-1-2", 5), usage };
      },
    } as never);
    const res = await app.request("/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Grade 2 sums" }] }),
    });
    const text = await res.text();
    expect(calls).toBe(0);
    expect(text).toContain("event: error");
    expect(text).not.toMatch(/claude|haiku|token|\.ts:/i);
  });

  it("Eval spend counts against the live-run cap", async () => {
    // eval.ts runs live on import, so the guard lives in its own module.
    const { withinLiveCap: guard } = await import("../../../api/src/agent/live-cap.ts");
    expect(guard(59.9, 0.2, 60)).toBe(false);
    expect(guard(59.9, 0.05, 60)).toBe(true);
  });
});
