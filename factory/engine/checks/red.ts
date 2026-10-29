import type { Check } from "../types.ts";

// TDD step one: the new tests must FAIL on the base commit. A test that already passes proves nothing.
export const red: Check = {
  size: "small",
  async run({ host, n }) {
    const r = await host.exec("npx", ["vitest", "run", `specs/${n}`], { ref: "base" });
    return r.code === 0
      ? {
          ok: false,
          evidence: `specs/${n} already passes on the base commit, so it proves nothing`,
        }
      : { ok: true, evidence: `fails on base as required (exit ${r.code})` };
  },
};
