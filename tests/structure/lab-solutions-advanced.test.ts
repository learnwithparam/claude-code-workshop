import { expect, it } from "vitest";
import { proveLane, staleCloudGuards } from "./lab-harness.ts";

proveLane("advanced");

it("advanced-05 goes red when the deny list changes after cloud-guards.txt was saved", () => {
  expect(staleCloudGuards()).not.toBe(0);
});
