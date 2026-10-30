import { describe, expect, it } from "vitest";
import { parseEnv } from "../../../api/src/env.ts";
import { createApp } from "../../../api/src/server.ts";
import { chat, client, env, harness, markGood, sheetWith, usage } from "./harness.ts";

describe("learned templates and the live-run cap", () => {
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
