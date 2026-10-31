import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { approvalIn } from "../../factory/engine/approvers.ts";
import { portableSchema } from "../../factory/engine/portable.ts";

// Assignment: two people at a high-risk gate. Skipped until you start: ASSIGNMENT=1 npx vitest run tests/assignments
const on = process.env.ASSIGNMENT === "1";
const line = "approve plan abc";
const from = (login: string) => ({
  body: line,
  authorAssociation: "MEMBER",
  author: { login },
});

describe.skipIf(!on)("assignment: named approvers", () => {
  it("reads an approvers list from the repo config", () => {
    expect(Object.keys(portableSchema.shape)).toContain("approvers");
  });

  it("opens a need of two with two listed people, and not with one person twice", () => {
    const listed = ["ana", "ben"];
    expect(approvalIn([from("ana"), from("ben")], "plan", "abc", listed, 2)).toBe(true);
    expect(approvalIn([from("ana"), from("ana")], "plan", "abc", listed, 2)).toBe(false);
    expect(approvalIn([from("ana"), from("zed")], "plan", "abc", listed, 2)).toBe(false);
  });

  it("does not assume the logged-in gh user in runIssue", () => {
    expect(readFileSync("factory/engine/cli.ts", "utf8")).not.toMatch(/api", "user"/);
  });
});
