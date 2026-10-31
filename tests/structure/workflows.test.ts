import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const dir = ".github/workflows";
const files = readdirSync(dir).filter((f) => f.endsWith(".yml"));

// The API key is one secret in one job, and a workflow cannot hand it to code from a fork.
describe("workflows", () => {
  it.each(files)("%s never runs on pull_request_target", (file) => {
    const on = parse(readFileSync(`${dir}/${file}`, "utf8")).on;
    expect(Object.keys(typeof on === "string" ? { [on]: 1 } : on)).not.toContain(
      "pull_request_target",
    );
  });

  it("uses the API key only in the review workflow, and only for a same-repo pull request", () => {
    const using = files.filter((f) => readFileSync(`${dir}/${f}`, "utf8").includes("secrets."));
    expect(using).toEqual(["review.yml"]);
    const review = parse(readFileSync(`${dir}/review.yml`, "utf8"));
    expect(review.jobs.review.if).toContain("head.repo.full_name == github.repository");
    expect(review.permissions.contents).toBe("read");
  });

  it("names both review agents that exist", () => {
    const text = readFileSync(`${dir}/review.yml`, "utf8");
    for (const agent of ["reviewer", "design-reviewer"]) {
      expect(text).toContain(agent);
      expect(readFileSync(`.claude/agents/${agent}.md`, "utf8")).toContain(`name: ${agent}`);
    }
  });
});
