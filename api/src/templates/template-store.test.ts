import { describe, expect, it } from "vitest";
import fixtures from "../../../fixtures/worksheets.json" with { type: "json" };
import { distillTemplate } from "./distill-template.ts";
import { createTemplateStore } from "./template-store.ts";

describe("template store", () => {
  it("finds by band and topic words, and dedupes", () => {
    const store = createTemplateStore();
    const r = distillTemplate(fixtures[0]?.worksheet as never, "fractions");
    if (!r.ok) throw new Error("distil failed");
    store.add(r.template);
    store.add(r.template);
    expect(store.size()).toBe(1);
    expect(store.find(r.template.band, ["fractions", "pizza"])).toBeDefined();
    expect(store.find(r.template.band, ["sums"])).toBeUndefined();
  });
});
