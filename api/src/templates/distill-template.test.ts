import { describe, expect, it } from "vitest";
import fixtures from "../../../fixtures/worksheets.json" with { type: "json" };
import { distillTemplate } from "./distill-template.ts";

const sheet = fixtures[0]?.worksheet as never;

describe("distillTemplate", () => {
  it("makes one slot per item and drops the item text", () => {
    const result = distillTemplate(sheet, "Grade 2 sums");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const items = (sheet as { sections: { items?: unknown[] }[] }).sections.flatMap(
      (s) => s.items ?? [],
    );
    expect(result.template.slots).toHaveLength(items.length);
    expect(result.template.topic).toEqual(["grade", "2", "sums"]);
  });
});
