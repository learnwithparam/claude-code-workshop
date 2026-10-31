import { chromium } from "@playwright/test";
import { renderWorkbook } from "./render-workbook";
import type { Workbook } from "./workbook-schema";

// Counts /Type /Page objects, which is one per sheet. /Type /Pages is the tree node and is skipped.
export function countPdfPages(bytes: Uint8Array): number {
  const text = new TextDecoder("latin1").decode(bytes);
  return text.match(/\/Type\s*\/Page(?![s\w])/g)?.length ?? 0;
}

export async function renderWorkbookPdf(wb: Workbook): Promise<Uint8Array> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(renderWorkbook(wb));
    return await page.pdf({ preferCSSPageSize: true, printBackground: true });
  } finally {
    await browser.close();
  }
}
