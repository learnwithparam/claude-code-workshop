---

name: "Assignment: a workflow from your own company"
about: "Workshop assignment. Run it with the the workflow you write workflow."
title: "Assignment: a workflow from your own company"
labels: assignment
---

Add `.factory/workflows/<name>.yaml` for <task>.

Acceptance:
- The first line is `# Method:`, and the file names its source.
- It uses only checks from `CHECK_NAMES` and loads.
- At least one step carries a check, with a failing input shown first.

Run the test with `WORKFLOW=<name>`.

Workflow: the workflow you write
Red test: `tests/assignments/own-workflow.test.ts`. Run it with `ASSIGNMENT=1 npx vitest run tests/assignments/own-workflow.test.ts`; it must fail for the reason above before any work.
