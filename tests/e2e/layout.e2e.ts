import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { renderWorksheet, worksheetSchema } from "../../shared/src/index";

const fixtures = JSON.parse(readFileSync("fixtures/worksheets.json", "utf8")) as {
  prompt: string;
  worksheet: unknown;
}[];

for (const width of [375, 1280]) {
  test(`the page does not scroll sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`no serious accessibility violation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const { violations } = await new AxeBuilder({ page }).analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => v.id)).toEqual([]);
  });
}

// Print clipped the answer key once: #worksheet is fixed-height with overflow hidden.
for (const { prompt, worksheet } of fixtures) {
  test(`prints on one Letter page with nothing clipped: ${prompt}`, async ({ page }) => {
    await page.setContent(renderWorksheet(worksheetSchema.parse(worksheet)));
    const clipped = await page.evaluate(() => {
      const sheet = document.getElementById("worksheet");
      return sheet ? sheet.scrollHeight - sheet.clientHeight : -1;
    });
    expect(clipped).toBeLessThanOrEqual(0);
    const pdf = await page.pdf({ format: "Letter", printBackground: true });
    const pages = pdf.toString("latin1").match(/\/Type\s*\/Page\b(?!s)/g)?.length ?? 0;
    expect(pages).toBe(1);
  });
}
