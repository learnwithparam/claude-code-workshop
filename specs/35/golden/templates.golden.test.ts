import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseEnv } from "../../../api/src/env.ts";
import { createApp } from "../../../api/src/server.ts";
import {
  ask,
  chat,
  client,
  env,
  GRADE3_SHEET,
  harness,
  markGood,
  sheetWith,
  usage,
} from "./harness.ts";

// One test per scenario in specs/35/spec.md (templates, eval, cap). All fail on the base commit.
const FRACTIONS = ask("Fractions worksheet", 3);
const FIVE = ask("Fractions worksheet with 5 items", 3);
const GENERIC = /claude|haiku|"input"|"output"|\.ts:|at \w+ \(/i;

async function withTemplate(h = harness()) {
  const { worksheet } = await chat(h, FRACTIONS);
  expect((await markGood(h, worksheet.sheetId)).status).toBe(200);
  return { h, source: worksheet };
}

const post = (app: ReturnType<typeof harness>["app"], content: string) =>
  app.request("/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content }] }),
  });

describe("template fill", () => {
  it("A matching request fills only the slots", async () => {
    const { h, source } = await withTemplate();
    const out = await chat(h, FIVE);
    expect(h.calls()).toBe(1);
    expect(h.fills()).toBe(1);
    expect((h.filled[0] as { slots: string[] }).slots).toHaveLength(5);
    expect(JSON.stringify(h.filled[0])).not.toMatch(/heading|instruction|band|sections/);
    expect(out.worksheet.sheet.sections[0].heading).toBe(source.sheet.sections[0].heading);
    expect(out.worksheet.html).toContain("v-");
  });

  it("A request with no matching template runs the full flow", async () => {
    const { h } = await withTemplate();
    await chat(h, ask("Spelling worksheet", 3));
    expect(h.fills()).toBe(0);
    expect(h.calls()).toBe(2);
  });

  it("A template from another band is not used", async () => {
    const { h } = await withTemplate();
    await chat(h, ask("Fractions worksheet", 7));
    expect(h.fills()).toBe(0);
    expect(h.calls()).toBe(2);
  });

  it("Slot output that fails validation is rejected", async () => {
    const { fillSlotsSchema, fillTemplate } = await import("../../../shared/src/template.ts");
    const { distillTemplate } = await import("../../../api/src/templates/distill-template.ts");
    const r = distillTemplate(sheetWith("grade-3-5", 5), FRACTIONS);
    if (!r.ok) throw new Error("distil failed");
    const schema = fillSlotsSchema(r.template);
    expect(schema.safeParse({ values: ["a", "b", "c", "d"] }).success).toBe(false);
    expect(schema.safeParse({ values: ["a", "b", "c", "d", "e"] }).success).toBe(true);
    expect(() => fillTemplate(r.template, ["a", "b", "c", "d"])).toThrow();

    // Through the route: a short slot list is an error event, and the retry is not served from the cache.
    const h = harness(GRADE3_SHEET, () => ["a", "b", "c", "d"]);
    const { worksheet } = await chat(h, FRACTIONS);
    await markGood(h, worksheet.sheetId);
    const bad = await chat(h, FIVE);
    expect(bad.error).toBeDefined();
    expect(bad.worksheet).toBeUndefined();
    expect(bad.text).not.toMatch(GENERIC);
    await chat(h, FIVE);
    expect(h.fills()).toBe(2);
  });

  it("Slot-filled output is still laid out by the band rules", async () => {
    // early-reader allows 6 items and 6 words each. A template cannot hold more than 6 slots, so the
    // model overruns the band the other way: too many words per slot. The check must reject it.
    const early = "Counting worksheet for age 4";
    const h = harness(
      () => ({ kind: "worksheet", sheet: sheetWith("early-reader", 6), usage }),
      (slots) => slots.map(() => "one two three four five six seven eight nine ten"),
    );
    const { worksheet } = await chat(h, early);
    expect((await markGood(h, worksheet.sheetId)).status).toBe(200);
    const again = `${early} with more`;
    const out = await chat(h, again);
    expect(h.fills()).toBe(1);
    expect(out.error).toBeDefined();
    expect(out.worksheet).toBeUndefined();
    await chat(h, again);
    expect(h.fills()).toBe(2);
  });

  it("A template-filled worksheet is cached under the exact key", async () => {
    const { h } = await withTemplate();
    await chat(h, FIVE);
    const again = await chat(h, FIVE);
    expect(h.fills()).toBe(1);
    expect(h.calls()).toBe(1);
    expect(again.usage.output).toBe(0);
  });
});

describe("eval and boundaries", () => {
  it("The eval shows fewer output tokens with a template", async () => {
    // Fill output is a short list of values, so its reported output is below a full worksheet's.
    const { h } = await withTemplate();
    const full = await chat(h, ask("Spelling worksheet", 3));
    const filled = await chat(h, FIVE);
    expect(filled.usage.output).toBeLessThan(full.usage.output);
    // eval.ts runs live on import, so check what it prints from its source.
    const src = readFileSync(new URL("../../../api/src/eval.ts", import.meta.url), "utf8");
    expect(src).toMatch(/fillSlots/);
    expect(src).toMatch(/console\.log\([^)]*without[^)]*with/is);
  });

  it("Cache and template stores stay on the api", async () => {
    const { execSync } = await import("node:child_process");
    const root = new URL("../../../", import.meta.url);
    const code = execSync(
      "grep -rlE 'prompt-cache|template-store|distill-template|ANTHROPIC_API_KEY' web/src || true",
      { cwd: root },
    ).toString();
    expect(code.trim()).toBe("");
    const envUse = execSync("grep -rhoE 'import\\.meta\\.env\\.[A-Z_]+' web/src || true", {
      cwd: root,
    })
      .toString()
      .split("\n")
      .filter(Boolean);
    expect([...new Set(envUse)]).toEqual(["import.meta.env.PUBLIC_API_URL"]);
    // Red on base: the api module the guard protects must exist.
    expect(await import("../../../api/src/cache/prompt-cache.ts")).toBeDefined();
  });

  it("Customer errors reveal no internals", async () => {
    const leak = () => {
      throw new Error("claude-haiku-5-5 used 4242 tokens at store.ts:12");
    };
    let calls = 0;
    const app = createApp({
      env,
      client,
      run: async () => (calls++ === 0 ? GRADE3_SHEET() : leak()),
      fill: async () => leak(),
    } as never);
    const seed = await (await post(app, FRACTIONS)).text();
    const sheetId = JSON.parse(seed.match(/event: worksheet\ndata: (.*)/)?.[1] ?? "{}").sheetId;
    const marked = await app.request("/templates/good", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sheetId }),
    });
    expect(marked.status).toBe(200);
    for (const prompt of [FIVE, ask("Spelling worksheet", 3)]) {
      const text = await (await post(app, prompt)).text();
      expect(text).toContain("event: error");
      expect(text).not.toMatch(/claude|haiku|4242|store\.ts/i);
    }
  });

  it("Live eval spend stays inside the cap", async () => {
    const capOf = (spent: string) =>
      parseEnv({
        ANTHROPIC_API_KEY: "x".repeat(30),
        DAILY_BUDGET_USD: "100",
        LIVE_SPENT_USD: spent,
      });
    let calls = 0;
    const capped = createApp({
      env: capOf("60"),
      client,
      run: async () => {
        calls++;
        return GRADE3_SHEET();
      },
    } as never);
    const text = await (await post(capped, FRACTIONS)).text();
    expect(calls).toBe(0);
    expect(text).toContain("event: error");
    expect(text).not.toMatch(GENERIC);

    // A cache hit never consults the cap, so it still answers when little is left.
    const hit = createApp({ env: capOf("10"), client, run: async () => GRADE3_SHEET() } as never);
    await (await post(hit, FRACTIONS)).text();
    expect(await (await post(hit, FRACTIONS)).text()).toContain("event: worksheet");

    const { withinLiveCap } = await import("../../../api/src/agent/live-cap.ts");
    expect(withinLiveCap(59.9, 0.2, 60)).toBe(false);
    expect(withinLiveCap(59.9, 0.05, 60)).toBe(true);
  });
});
