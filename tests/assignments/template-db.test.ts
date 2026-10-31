import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { distillTemplate } from "../../api/src/templates/distill-template.ts";
import fixtures from "../../fixtures/worksheets.json" with { type: "json" };

// Assignment: templates in a database. Skipped until you start: ASSIGNMENT=1 npx vitest run tests/assignments
const on = process.env.ASSIGNMENT === "1";
const MODULE = "../../api/src/templates/db-template-store.ts";

describe.skipIf(!on)("assignment: templates in a database", () => {
  it("finds a saved template from a second store on the same file", async () => {
    const { createDbTemplateStore } = await import(MODULE);
    const file = join(mkdtempSync(join(tmpdir(), "templates-")), "templates.db");
    const made = distillTemplate(fixtures[0]?.worksheet as never, "letters");
    if (!made.ok) throw new Error("distill failed");
    createDbTemplateStore(file).add(made.template);
    const second = createDbTemplateStore(file);
    expect(second.size()).toBe(1);
    expect(second.find(made.template.band, ["letters"])).toBeDefined();
  });

  it("keeps one copy when the same template is added twice", async () => {
    const { createDbTemplateStore } = await import(MODULE);
    const file = join(mkdtempSync(join(tmpdir(), "templates-")), "templates.db");
    const made = distillTemplate(fixtures[0]?.worksheet as never, "letters");
    if (!made.ok) throw new Error("distill failed");
    const store = createDbTemplateStore(file);
    store.add(made.template);
    store.add(made.template);
    expect(store.size()).toBe(1);
  });
});
