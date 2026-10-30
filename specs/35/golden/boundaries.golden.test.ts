import type Anthropic from "@anthropic-ai/sdk";
import { fillTemplate, type Template } from "@workshop/shared";
import { describe, expect, it } from "vitest";
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

// Scenarios in specs/35/spec.md that cache/templates goldens do not reach. Each fails on the base commit.
// The spec says "grade 5" for another band; grade 5 is in the same band as grade 3 (grade-3-5), so grade 7 stands in.
// Dynamic, so a missing module fails the one test that needs it rather than the whole file.
const distill = async (
  ...a: Parameters<typeof import("../../../api/src/templates/distill-template.ts").distillTemplate>
) => (await import("../../../api/src/templates/distill-template.ts")).distillTemplate(...a);
const newStore = async () =>
  (await import("../../../api/src/templates/template-store.ts")).createTemplateStore();
const FRACTIONS = ask("Fractions worksheet", 3);
const THIRDS = ask("Fractions worksheet about thirds", 3);
const GENERIC = /claude|haiku|529|overloaded|token|\.ts:|at \w+ \(/i;

async function withTemplate(h = harness()) {
  const { worksheet } = await chat(h, FRACTIONS);
  expect((await markGood(h, worksheet.sheetId)).status).toBe(200);
  return { h, source: worksheet };
}

describe("cache key and mark-good edges", () => {
  it("Trailing punctuation does not change the cache key", async () => {
    const h = harness();
    await chat(h, FRACTIONS);
    const again = await chat(h, "fractions worksheet for grade 3!");
    expect(h.calls()).toBe(1);
    expect(again.usage.output).toBe(0);
  });

  it("A sheet that fails the shared check cannot be marked good", async () => {
    const h = harness(() => ({ kind: "worksheet", sheet: sheetWith("grade-3-5", 40), usage }));
    const { worksheet } = await chat(h, FRACTIONS);
    expect((await markGood(h, worksheet.sheetId)).status).toBe(422);
    await chat(h, THIRDS);
    expect(h.fills()).toBe(0);
  });

  it("Mark-good body is validated with zod", async () => {
    const { h } = await withTemplate();
    expect((await markGood(h, 7)).status).toBe(400);
    expect((await markGood(h, null)).status).toBe(400);
    // The 200 above came from a string id, so the 400s are the type check, not a dead route.
  });

  it("A template holds slots and no filled content", async () => {
    const sheet = sheetWith("grade-3-5", 2);
    const first = sheet.sections[0];
    if (!first?.items?.[0]) throw new Error("fixture has no item");
    first.items[0] = { ...first.items[0], prompt: "What is 1/2 + 1/4?", answer: "3/4" };
    const r = await distill(sheet, FRACTIONS);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const json = JSON.stringify(r.template);
    expect(json).not.toContain("What is 1/2 + 1/4?");
    expect(json).not.toContain("3/4");
    expect(r.template.slots).toHaveLength(2);
  });
});

describe("template fill", () => {
  it("The model is offered a schema of only the slots", async () => {
    const offered: Anthropic.Tool[][] = [];
    const spy = {
      messages: {
        create: async (params: { tools: Anthropic.Tool[] }) => {
          offered.push(params.tools);
          return {
            content: [
              {
                type: "tool_use",
                id: "t",
                name: "submit_slots",
                input: { values: Array.from({ length: 5 }, (_, i) => `q${i} => a${i}`) },
              },
            ],
            usage: { input_tokens: 50, output_tokens: 10 },
          };
        },
      },
    } as unknown as Anthropic;
    const app = createApp({ env, client: spy, run: async () => GRADE3_SHEET() } as never);
    const post = (content: string) =>
      app.request("/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content }] }),
      });
    const seed = await (await post(FRACTIONS)).text();
    const sheetId = JSON.parse(seed.match(/event: worksheet\ndata: (.*)/)?.[1] ?? "{}").sheetId;
    await markGood({ app } as never, sheetId);
    await (await post(THIRDS)).text();

    const tool = offered[0]?.[0];
    expect(offered).toHaveLength(1);
    expect(tool?.name).toBe("submit_slots");
    const schema = JSON.stringify(tool?.input_schema);
    expect(Object.keys(tool?.input_schema.properties ?? {})).toEqual(["values"]);
    expect(schema).toContain('"minItems":5');
    expect(schema).not.toMatch(/heading|instruction|band|sections|picture|title/);
  });

  it("A request with no matching template offers the full worksheet schema", async () => {
    const tools: string[] = [];
    const spy = {
      beta: {
        messages: {
          toolRunner: (params: { tools: Array<{ name: string }> }) => {
            tools.push(...params.tools.map((t) => t.name));
            return (async function* () {})();
          },
        },
      },
    } as unknown as Anthropic;
    const app = createApp({ env, client: spy } as never);
    await (
      await app.request("/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: FRACTIONS }] }),
      })
    ).text();
    expect(tools).toEqual(["submit_worksheet"]);
  });

  it("A template fill is rendered with the template's layout", async () => {
    const { h, source } = await withTemplate();
    const out = await chat(h, THIRDS);
    const r = await distill(source.sheet, FRACTIONS);
    if (!r.ok) throw new Error("distil failed");
    const values = r.template.slots.map((s) => `v-${s}`);
    expect(out.worksheet.sheet).toEqual(fillTemplate(r.template, values));
  });

  it("A template over the band's item limit is not used", async () => {
    const r = await distill(sheetWith("grade-3-5", 12), FRACTIONS);
    if (!r.ok) throw new Error("distil failed");
    const t = r.template;
    const first = t.sections[0];
    if (!first?.pictures) throw new Error("fixture has no items");
    // 13 slots: one past grade-3-5's 12-item limit, which no marked-good sheet can reach.
    const over: Template = {
      ...t,
      slots: [...t.slots, "slot-13"],
      sections: [{ ...first, pictures: [...first.pictures, undefined] }],
    };
    const attempt = async (template: Template) => {
      const templates = await newStore();
      templates.add(template);
      let fills = 0;
      let calls = 0;
      const app = createApp({
        env,
        client,
        templates,
        run: async () => {
          calls++;
          return GRADE3_SHEET();
        },
        fill: async (_c: unknown, a: { slots: string[] }) => {
          fills++;
          return { kind: "slots", values: a.slots.map((s) => `v-${s}`), usage };
        },
      } as never);
      const res = await app.request("/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: FRACTIONS }] }),
      });
      expect(await res.text()).toContain("event: worksheet");
      return { fills, calls };
    };
    // Contrast: the same injected store at the limit is used, so the store override is wired.
    expect(await attempt(t)).toEqual({ fills: 1, calls: 0 });
    expect(await attempt(over)).toEqual({ fills: 0, calls: 1 });
  });

  it("An exact cache hit wins over a matching template", async () => {
    const { h } = await withTemplate();
    const again = await chat(h, FRACTIONS);
    expect(h.calls()).toBe(1);
    expect(h.fills()).toBe(0);
    expect(again.usage.output).toBe(0);
  });
});

describe("errors, eval and cap", () => {
  it("Customer errors never expose a 529", async () => {
    const overloaded = Object.assign(new Error("529 overloaded_error claude-haiku-5-5"), {
      status: 529,
    });
    const app = createApp({
      env,
      client,
      run: async () => {
        throw overloaded;
      },
    } as never);
    const res = await app.request("/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: FRACTIONS }] }),
    });
    const text = await res.text();
    expect(text).toContain("event: error");
    expect(text).not.toMatch(GENERIC);
  });

  it("The eval compares output tokens with and without a template", async () => {
    const { runTemplateEval } = await import("../../../api/src/agent/template-eval.ts");
    const deps = (fillOutput: number) => ({
      prompt: FRACTIONS,
      spentUsd: 0,
      estimateUsd: 0.05,
      capUsd: 60,
      run: async () => ({ ...GRADE3_SHEET(), usage: { ...usage, output: 400 } }),
      fill: async (_c: unknown, a: { slots: string[] }) => ({
        kind: "slots" as const,
        values: a.slots.map((s) => `v-${s}`),
        usage: { ...usage, output: fillOutput },
      }),
    });
    const fewer = await runTemplateEval(deps(60) as never);
    expect(fewer).toMatchObject({ kind: "report", without: 400, withTemplate: 60, ok: true });
    const notFewer = await runTemplateEval(deps(400) as never);
    expect(notFewer).toMatchObject({ kind: "report", without: 400, withTemplate: 400, ok: false });
  });

  it("Live eval refuses a comparison that would pass the cap", async () => {
    const { runTemplateEval } = await import("../../../api/src/agent/template-eval.ts");
    let calls = 0;
    const model = async () => {
      calls++;
      return { kind: "failed" as const, usage };
    };
    const out = await runTemplateEval({
      prompt: FRACTIONS,
      spentUsd: 59.9,
      estimateUsd: 0.5,
      capUsd: 60,
      run: model,
      fill: model,
    } as never);
    expect(calls).toBe(0);
    expect(out).toMatchObject({ kind: "over-budget" });
    expect((out as { message: string }).message).toMatch(/budget cap would be exceeded/i);
  });
});
