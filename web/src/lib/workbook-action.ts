import { type BandId, bandIdSchema, type Worksheet } from "@workshop/shared";
import { z } from "zod";

const API_URL: string = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8787";

// The page only needs the band and the html the API already rendered, so the workbook is checked loosely here.
const workbookEventSchema = z.object({
  workbook: z.looseObject({ band: bandIdSchema }),
  html: z.string(),
});

export type WorkbookResult = { workbook: { band: BandId }; html: string };

export const showWorkbookAction = (sheet: Worksheet | null): boolean => sheet !== null;

// Null on any failure: the page shows its own generic message, never a raw error.
export async function requestWorkbook(
  sheet: Worksheet,
  doFetch: typeof fetch = fetch,
): Promise<WorkbookResult | null> {
  try {
    const res = await doFetch(`${API_URL}/workbook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sheet }),
    });
    if (!res.ok) return null;
    const block = (await res.text()).split("\n\n").find((b) => b.startsWith("event: workbook"));
    const data = /^data: (.+)$/m.exec(block ?? "")?.[1];
    if (!data) return null;
    const parsed = workbookEventSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function makeWorkbook(sheet: Worksheet, doFetch: typeof fetch = fetch) {
  return (await requestWorkbook(sheet, doFetch))?.workbook ?? null;
}
