import { describe, expect, it } from "vitest";
import { checkBand } from "../../../shared/src/index.ts";
import { chat, harness, markGood, sheetWith, usage } from "./harness.ts";

describe("prompt cache and marking a sheet good", () => {
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
});
