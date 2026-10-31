import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { renderWorksheet, worksheetSchema } from "../../shared/src/index";

// A picture of every band at phone and desktop width, for feedback. It spends no tokens: the
// worksheets come from fixtures and the page is the static build. Off in make check.
test.skip(!process.env.GALLERY, "set GALLERY=1 to write test-results/gallery");

const fixtures = JSON.parse(readFileSync("fixtures/worksheets.json", "utf8")) as {
  prompt: string;
  worksheet: unknown;
}[];
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const out = "test-results/gallery";

for (const width of [375, 1280]) {
  test(`the empty app at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await page.screenshot({ path: `${out}/app-${width}.png`, fullPage: true });
    expect(page.url()).toContain("localhost");
  });

  for (const { prompt, worksheet } of fixtures) {
    test(`${prompt} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(renderWorksheet(worksheetSchema.parse(worksheet)));
      await page.screenshot({ path: `${out}/${slug(prompt)}-${width}.png`, fullPage: true });
    });
  }
}

test("a print-view of each band", async ({ page }) => {
  await page.setViewportSize({ width: 816, height: 1056 });
  await page.emulateMedia({ media: "print" });
  for (const { prompt, worksheet } of fixtures) {
    await page.setContent(renderWorksheet(worksheetSchema.parse(worksheet)));
    await page.screenshot({ path: `${out}/${slug(prompt)}-print.png`, fullPage: true });
  }
});
