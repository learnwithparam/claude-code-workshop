import type Anthropic from "@anthropic-ai/sdk";
import type { AgentResult } from "../../../api/src/agent/agent.ts";
import { parseEnv } from "../../../api/src/env.ts";
import { createApp } from "../../../api/src/server.ts";
import fixtures from "../../../fixtures/worksheets.json" with { type: "json" };
import type { Worksheet } from "../../../shared/src/index.ts";

// One test per scenario in specs/35/spec.md. Each fails on the base commit because no cache or template code exists.
// Contract the build must meet (see specs/35/contract.md): createApp builds its own cache and template store;
// the worksheet SSE event carries `sheetId`; POST /templates/good takes { sheetId }; a template fill is a
// run-level call, injected as `fill` next to `run` in createApp deps.

export const env = parseEnv({ ANTHROPIC_API_KEY: "x".repeat(30), DAILY_BUDGET_USD: "100" });
export const client = {} as Anthropic;
export const usage = { input: 100, cacheRead: 0, cacheWrite: 0, output: 50 };
export const base = fixtures.find((f) => f.worksheet.band === "grade-1-2")?.worksheet as Worksheet;

export const sheetWith = (band: Worksheet["band"], n: number): Worksheet => ({
  ...base,
  band,
  sections: [
    {
      heading: "Add",
      instruction: "Add the numbers.",
      items: Array.from({ length: n }, (_, i) => ({
        prompt: `${i} + 1`,
        answer: `${i + 1}`,
        picture: "ball" as const,
      })),
    },
  ],
});

export function harness(
  make: (call: number) => AgentResult = () => ({
    kind: "worksheet",
    sheet: sheetWith("grade-1-2", 5),
    usage,
  }),
) {
  let calls = 0;
  const run = async (): Promise<AgentResult> => make(calls++);
  let fills = 0;
  const filled: unknown[] = [];
  const fill = async (_c: unknown, args: { slots: string[]; values?: unknown }) => {
    fills++;
    filled.push(args);
    return {
      kind: "slots",
      values: args.slots.map((s) => `v-${s}`),
      usage: { ...usage, output: 10 },
    };
  };
  const app = createApp({ env, client, run, fill } as never);
  return { app, calls: () => calls, fills: () => fills, filled };
}
export type H = ReturnType<typeof harness>;

export const chat = async (h: H, content: string) => {
  const res = await h.app.request("/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content }] }),
  });
  const text = await res.text();
  const data = (name: string) => {
    const m = text.match(new RegExp(`event: ${name}\\ndata: (.*)`));
    return m?.[1] ? JSON.parse(m[1]) : undefined;
  };
  return { text, worksheet: data("worksheet"), usage: data("usage"), error: data("error") };
};
export const markGood = (h: H, sheetId: unknown) =>
  h.app.request("/templates/good", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sheetId }),
  });
