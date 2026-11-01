import { describe, expect, it } from "vitest";
import type { Lab } from "./catalog.ts";
import { runLab } from "./cli.ts";
import { lab, setup } from "./cli-fixtures.ts";

describe("LIVE=1", () => {
  const withTrick = (): Lab => ({
    ...lab("start-01", "start"),
    trick: "Use /memory.",
    steps: [{ where: "shell", text: "Do it.", expect: "EXPECT-HIDDEN" }],
  });

  it("walks the lab through the injected reader, one Enter per step", async () => {
    const s = setup(true);
    s.deps.labs = [withTrick()];
    let presses = 0;
    s.deps.env = { LIVE: "1" };
    s.deps.enter = async () => {
      presses += 1;
    };
    expect(await runLab(["lab"], s.deps)).toBe(0);
    expect(presses).toBe(1);
    expect(s.text()).toContain("Trick to keep: Use /memory.");
  });

  it("without LIVE the normal flow runs and never waits", async () => {
    const s = setup(true);
    s.deps.labs = [withTrick()];
    s.deps.enter = async () => {
      throw new Error("must not wait");
    };
    expect(await runLab(["lab"], s.deps)).toBe(0);
    expect(s.text()).toContain("Trick to keep: Use /memory.");
    expect(s.text()).toContain("EXPECT-HIDDEN");
  });

  it("LIVE with no path chosen still asks for the path", async () => {
    const s = setup(true, false);
    s.deps.env = { LIVE: "1" };
    s.deps.enter = async () => {};
    expect(await runLab(["lab"], s.deps)).toBe(2);
    expect(s.text()).toContain("PATH_ID=pro");
  });
});
