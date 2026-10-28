import { describe, expect, it } from "vitest";
import { decideDelivery, parseFacts, type SubIssue, subIssueNumbers } from "./delivery.ts";

const sub = (number: number, o: Partial<SubIssue> = {}): SubIssue => ({
  number,
  apiChange: false,
  small: true,
  dependsOn: [],
  ...o,
});

describe("decideDelivery", () => {
  it("releases on a user-visible API change, even when work is independent", () =>
    expect(decideDelivery([sub(1, { apiChange: true }), sub(2)])).toMatchObject({
      delivery: "release",
    }));
  it("splits independent sub-issues into separate PRs", () =>
    expect(decideDelivery([sub(1), sub(2)])).toMatchObject({ delivery: "separate-prs" }));
  it("keeps coupled sub-issues in one PR, small or not", () => {
    expect(decideDelivery([sub(1), sub(2, { dependsOn: [1] })])).toMatchObject({
      delivery: "single-pr-commits",
    });
    expect(decideDelivery([sub(1, { small: false }), sub(2, { dependsOn: [1] })])).toMatchObject({
      delivery: "single-pr-commits",
    });
  });
  it("errors on an empty epic and on a dependency outside it", () => {
    expect(decideDelivery([])).toHaveProperty("error");
    expect(decideDelivery([sub(1, { dependsOn: [99] })])).toHaveProperty("error");
  });
});

describe("parseFacts", () => {
  it("parses a FACTS line and rejects bad input", () => {
    expect(
      parseFacts('FACTS: [{"number":1,"apiChange":false,"small":true,"dependsOn":[]}]'),
    ).toHaveLength(1);
    for (const bad of ["nothing", "FACTS: [{", 'FACTS: [{"number":"x"}]'])
      expect(parseFacts(bad)).toHaveProperty("error");
  });
});

describe("subIssueNumbers", () => {
  it("reads the checklist", () =>
    expect(subIssueNumbers("x\n- [ ] #4 a\n- [x] #5 b\ntext #9")).toEqual([4, 5]));
});
