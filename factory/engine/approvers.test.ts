import { describe, expect, it } from "vitest";
import { approvalIn, writersFrom } from "./approvers.ts";
import { fakeHost } from "./fake-host.ts";

const line = "approve spec abc";
const by = (login: string, extra = {}) => ({
  body: line,
  authorAssociation: "COLLABORATOR",
  author: { login, ...extra },
});
const perms: Record<string, string> = {
  alice: "write",
  bob: "admin",
  carol: "read",
  eve: "maintain",
  "ci[bot]": "admin",
  robo: "admin",
};
const permissionOf = async (login: string) => perms[login] ?? "none";

describe("writersFrom", () => {
  it("keeps comment authors with write, maintain or admin and drops the rest", async () => {
    const c = [by("alice"), by("bob"), by("carol"), by("eve"), by("nobody")];
    expect(await writersFrom(c, permissionOf)).toEqual(["alice", "bob", "eve"]);
  });
  it("never counts a bot, even one with admin", async () => {
    const c = [by("ci[bot]"), by("robo", { is_bot: true }), by("alice")];
    expect(await writersFrom(c, permissionOf)).toEqual(["alice"]);
  });
  it("lists a person once however many comments", async () => {
    expect(await writersFrom([by("alice"), by("alice")], permissionOf)).toEqual(["alice"]);
  });
  it("lets a high-tier gate be met by two real writers", async () => {
    const c = [by("alice"), by("bob")];
    const writers = await writersFrom(c, permissionOf);
    expect(approvalIn(c, "spec", "abc", writers, 2)).toBe(true);
    expect(approvalIn([by("alice"), by("alice")], "spec", "abc", writers, 2)).toBe(false);
  });
  it("needs at least one person even when the list is empty", async () => {
    expect(approvalIn([by("ci[bot]")], "spec", "abc", [], 1)).toBe(false);
  });
});

describe("fake host writers", () => {
  it("answers from the script", async () => {
    expect(await fakeHost({ writers: ["alice"] }).host.writers(1)).toEqual(["alice"]);
    expect(await fakeHost().host.writers(1)).toEqual([]);
  });
});
