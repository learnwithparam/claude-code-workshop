// Paths the docs name that are not in the repo, each with the reason. A path that now exists is stale.
// A `make <target>` entry is stale once the Makefile defines the target.
export type Reason =
  | "learner-made"
  | "assignment-made"
  | "gitignored"
  | "example"
  | "generated"
  | "external";

export const ALLOWED: { path: string; reason: Reason }[] = [
  { path: "api/src/agent/canary.ts", reason: "assignment-made" },
  { path: "shared/src/arb-worksheet.ts", reason: "assignment-made" },
  { path: ".claude/hooks/pretooluse-judge.mjs", reason: "assignment-made" },
  { path: "factory/label-machine.ts", reason: "assignment-made" },
  { path: ".claude/agents/performance-reviewer.md", reason: "assignment-made" },
  { path: "api/src/templates/db-template-store.ts", reason: "assignment-made" },
  { path: "fixtures/incidents/breach.json", reason: "assignment-made" },
  { path: "shared/src/render-video.ts", reason: "assignment-made" },
  { path: ".claude/settings.local.json", reason: "gitignored" },
  { path: ".claude/logs/teams.log", reason: "gitignored" },
  { path: "api/.env", reason: "gitignored" },
  { path: "web/dist/", reason: "gitignored" },
  { path: ".factory/runs/", reason: "gitignored" },
  { path: ".factory/series.json", reason: "generated" },
  { path: ".factory/holdout/", reason: "generated" },
  { path: "api/src/a.test.ts", reason: "example" },
  { path: "api/src/x.ts", reason: "example" },
  { path: "docs/a.md", reason: "example" },
  { path: ".factory/workflows/typo.yaml", reason: "example" },
  { path: "specs/1/", reason: "example" },
  { path: "specs/25/golden/__snapshots__/adult-learners.html", reason: "example" },
  { path: "make deploy", reason: "example" },
  { path: "fixtures/take-home/eval.json", reason: "learner-made" },
  { path: "api/src/scratch-greet.ts", reason: "learner-made" },
];
