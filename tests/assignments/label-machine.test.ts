import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../../factory/config.ts";

// Assignment: the label state machine. Skipped until you start: ASSIGNMENT=1 npx vitest run tests/assignments
const on = process.env.ASSIGNMENT === "1";
const MODULE = "../../factory/label-machine.ts";
const L = loadConfig().labels;
const EVENTS = ["plan-written", "human-approved", "build-requested", "stuck", "retry"] as const;
const events = fc.array(fc.constantFrom(...EVENTS), { maxLength: 30 });

describe.skipIf(!on)("assignment: label state machine", () => {
  it("never allows a build without the approved label", async () => {
    const { applyEvent, canBuild } = await import(MODULE);
    fc.assert(
      fc.property(events, (seq) => {
        let labels: string[] = [L.ready];
        for (const e of seq) {
          labels = applyEvent(labels, e);
          if (canBuild(labels)) expect(labels).toContain(L.approved);
        }
      }),
    );
  });

  it("clears the approved label whenever a new plan is written", async () => {
    const { applyEvent } = await import(MODULE);
    fc.assert(
      fc.property(events, (seq) => {
        let labels: string[] = [L.ready];
        for (const e of seq) {
          labels = applyEvent(labels, e);
          if (e === "plan-written") expect(labels).not.toContain(L.approved);
        }
      }),
    );
  });

  it("never clears needs-human by itself, only a human-approved event may", async () => {
    const { applyEvent } = await import(MODULE);
    fc.assert(
      fc.property(events, (seq) => {
        let labels: string[] = [L.ready];
        for (const e of seq) {
          const before = labels.includes(L.needsHuman);
          labels = applyEvent(labels, e);
          if (before && e !== "human-approved") expect(labels).toContain(L.needsHuman);
        }
      }),
    );
  });
});
