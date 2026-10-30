import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { parseEnv } from "../../../api/src/env.ts";
import { createApp } from "../../../api/src/server.ts";

// Issue 37. The only id a caller names is `sheetId` on POST /templates/good. It must be a strict
// allowlist (the 16 hex chars the api issues), so no id with a path meaning gets past the boundary.
// On the base commit the schema is any 1-100 char string, so these reach the lookup and return 404.
const env = parseEnv({ ANTHROPIC_API_KEY: "x".repeat(30), DAILY_BUDGET_USD: "100" });
const mark = (sheetId: string) =>
  createApp({ env, client: {} as Anthropic }).request("/templates/good", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sheetId }),
  });

describe("template id boundary", () => {
  it.each([
    ["parent directory", "../x"],
    ["nested parent", "../../etc/x"],
    ["absolute path", "/etc/x"],
    ["separator", "a/b"],
    ["backslash", "..\\x"],
    ["encoded", "%2e%2e%2fx"],
    ["nul byte", "ab\u0000cd"],
  ])("rejects a %s id with a generic 400", async (_name, id) => {
    const res = await mark(id);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Bad request" });
  });

  it("still treats a well-formed unknown id as unknown", async () => {
    expect((await mark("0123456789abcdef")).status).toBe(404);
  });
});
