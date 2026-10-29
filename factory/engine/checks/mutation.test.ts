import { describe, expect, it } from "vitest";
import { fakeHost } from "../fake-host.ts";
import { mutation } from "./mutation.ts";

const ctx = (changed: string[], code = 0) => {
  const { host, calls } = fakeHost({
    changed,
    exec: [{ match: "npx stryker", result: { code, output: "score 40" } }],
  });
  return { calls, run: () => mutation.run({ host, n: 1 } as never) };
};

describe("mutation", () => {
  it("passes without running Stryker when no source file changed", async () => {
    const { calls, run } = ctx(["docs/a.md", "shared/src/a.test.ts"]);
    expect((await run()).ok).toBe(true);
    expect(calls.join()).not.toContain("stryker");
  });
  it("mutates only the changed source files and fails when the score is under the floor", async () => {
    const { calls, run } = ctx(["shared/src/render.ts", "shared/src/a.test.ts", "web/x.ts"], 1);
    const r = await run();
    expect(r.ok).toBe(false);
    expect(r.evidence).toContain("score 40");
    expect(calls.join()).toContain("--mutate shared/src/render.ts");
    expect(calls.join()).not.toContain("a.test.ts");
  });
});
