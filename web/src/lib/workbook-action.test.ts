import { describe, expect, it } from "vitest";
import worksheets from "../../../fixtures/worksheets.json" with { type: "json" };
import { makeWorkbook, showWorkbookAction } from "./workbook-action.ts";

const sheet = worksheets[0]?.worksheet as Parameters<typeof makeWorkbook>[0];

describe("workbook action", () => {
  it("is shown only when a worksheet is present (R19)", () => {
    expect(showWorkbookAction(null)).toBe(false);
    expect(showWorkbookAction(sheet)).toBe(true);
  });

  it("posts the worksheet to the API /workbook and returns the workbook (R12, R13)", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const payload = JSON.stringify({ workbook: { band: sheet.band }, html: "<p></p>" });
    const fakeFetch = (async (url: string, init?: { body?: string }) => {
      calls.push({ url: String(url), body: JSON.parse(init?.body ?? "null") });
      return new Response(`event: workbook\ndata: ${payload}\n\n`);
    }) as unknown as typeof fetch;
    const result = await makeWorkbook(sheet, fakeFetch);
    expect(calls[0]?.url).toMatch(/\/workbook$/);
    expect(calls[0]?.body).toEqual({ sheet });
    expect(result?.band).toBe(sheet.band);
  });

  it("returns null on a failed request, never throws a raw error (R16)", async () => {
    const failing = (async () => new Response("nope", { status: 500 })) as unknown as typeof fetch;
    expect(await makeWorkbook(sheet, failing)).toBeNull();
  });
});
