import { describe, expect, it } from "vitest";
import { ask, chat, GRADE3_SHEET, harness, markGood, sheetWith, usage } from "./harness.ts";

// One test per scenario in specs/35/spec.md (cache and mark-good). All fail on the base commit: no cache or template code exists.
const FRACTIONS = ask("Fractions worksheet", 3);

describe("exact prompt cache", () => {
  it("A repeat prompt is served from the exact cache", async () => {
    const h = harness();
    const first = await chat(h, FRACTIONS);
    const again = await chat(h, FRACTIONS);
    expect(h.calls()).toBe(1);
    expect(again.usage.input).toBe(0);
    expect(again.usage.output).toBe(0);
    expect(again.worksheet.sheet).toEqual(first.worksheet.sheet);
  });

  it("The cache key ignores case and surrounding whitespace", async () => {
    const h = harness();
    const first = await chat(h, FRACTIONS);
    const again = await chat(h, "  fractions   WORKSHEET   for  GRADE 3 ");
    expect(h.calls()).toBe(1);
    expect(again.worksheet.sheet).toEqual(first.worksheet.sheet);
  });

  it("The cache key includes the band", async () => {
    const h = harness((n) => ({
      kind: "worksheet",
      sheet: sheetWith(n === 0 ? "grade-3-5" : "grade-6-8", 3),
      usage,
    }));
    await chat(h, FRACTIONS);
    await chat(h, FRACTIONS);
    expect(h.calls()).toBe(1);
    await chat(h, ask("Fractions worksheet", 7));
    expect(h.calls()).toBe(2);
  });

  it("A different prompt in the same band misses the cache", async () => {
    const h = harness();
    await chat(h, FRACTIONS);
    await chat(h, FRACTIONS);
    expect(h.calls()).toBe(1);
    await chat(h, ask("Spelling worksheet", 3));
    expect(h.calls()).toBe(2);
  });

  it("Two grades in the same band share a cache entry", async () => {
    const h = harness();
    const first = await chat(h, FRACTIONS);
    const again = await chat(h, ask("Fractions worksheet", 4));
    expect(h.calls()).toBe(1);
    expect(again.worksheet.sheet).toEqual(first.worksheet.sheet);
  });

  it("A clarifying question is not cached", async () => {
    const h = harness(() => ({ kind: "question", text: "Which grade is this for?", usage }));
    await chat(h, "Make a worksheet");
    await chat(h, "Make a worksheet");
    expect(h.calls()).toBe(2);
    // Contrast: a worksheet answer is cached, so the cache exists and the question was skipped on purpose.
    const w = harness();
    await chat(w, FRACTIONS);
    await chat(w, FRACTIONS);
    expect(w.calls()).toBe(1);
  });

  it("An invalid model reply is not cached", async () => {
    const h = harness((n) => (n === 0 ? { kind: "failed", usage } : GRADE3_SHEET()));
    const bad = await chat(h, FRACTIONS);
    expect(bad.error).toBeDefined();
    expect(JSON.stringify(bad.error)).not.toMatch(/claude|haiku|token|\.ts:/i);
    await chat(h, FRACTIONS);
    expect(h.calls()).toBe(2);
    // The valid retry is stored, so the cache exists and only the failure was skipped.
    await chat(h, FRACTIONS);
    expect(h.calls()).toBe(2);
    // An over-limit sheet that slips through is not served from the cache either.
    const over = harness((n) => ({
      kind: "worksheet",
      sheet: sheetWith("grade-3-5", n === 0 ? 40 : 3),
      usage,
    }));
    await chat(over, FRACTIONS);
    const second = await chat(over, FRACTIONS);
    expect(over.calls()).toBe(2);
    expect(second.worksheet.sheet.sections[0].items).toHaveLength(3);
  });
});

describe("marking a sheet good", () => {
  it("Marking a sheet good distills a template", async () => {
    const { distillTemplate } = await import("../../../api/src/templates/distill-template.ts");
    const sheet = sheetWith("grade-3-5", 5);
    const result = distillTemplate(sheet, FRACTIONS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const t = result.template;
    expect(t.band).toBe("grade-3-5");
    expect(t.slots).toHaveLength(5);
    expect(t.sections[0]?.heading).toBe(sheet.sections[0]?.heading);
    expect(t.sections[0]?.instruction).toBe(sheet.sections[0]?.instruction);
    expect(JSON.stringify(t)).not.toContain("0 + 1");

    // Through the route: marking a served sheet good makes the next matching request a slot fill.
    const h = harness();
    const { worksheet } = await chat(h, FRACTIONS);
    expect((await markGood(h, worksheet.sheetId)).status).toBe(200);
    await chat(h, ask("Fractions worksheet with 5 items", 3));
    expect(h.fills()).toBe(1);
  });

  it("Marking the same sheet good twice stores one template", async () => {
    const { createTemplateStore } = await import("../../../api/src/templates/template-store.ts");
    const { distillTemplate } = await import("../../../api/src/templates/distill-template.ts");
    const store = createTemplateStore();
    const r = distillTemplate(sheetWith("grade-3-5", 5), FRACTIONS);
    if (!r.ok) throw new Error("distil failed");
    store.add(r.template);
    store.add(r.template);
    expect(store.size()).toBe(1);

    const h = harness();
    const { worksheet } = await chat(h, FRACTIONS);
    expect((await markGood(h, worksheet.sheetId)).status).toBe(200);
    expect((await markGood(h, worksheet.sheetId)).status).toBe(200);
    await chat(h, ask("Fractions worksheet with 5 items", 3));
    expect(h.fills()).toBe(1);
  });

  it("Marking an unknown sheet good is rejected", async () => {
    const h = harness();
    const res = await markGood(h, "does-not-exist");
    expect(res.status).toBe(404);
    await chat(h, ask("Fractions worksheet with 5 items", 3));
    expect(h.fills()).toBe(0);
    // Contrast: a real sheet id is accepted, so the 404 above comes from the route, not from a missing one.
    const other = harness();
    const { worksheet } = await chat(other, FRACTIONS);
    expect((await markGood(other, worksheet.sheetId)).status).toBe(200);
  });

  it("The mark-good request body is validated", async () => {
    const h = harness();
    const empty = await h.app.request("/templates/good", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(empty.status).toBe(400);
    expect((await markGood(h, "")).status).toBe(400);
    await chat(h, ask("Fractions worksheet with 5 items", 3));
    expect(h.fills()).toBe(0);
  });
});
