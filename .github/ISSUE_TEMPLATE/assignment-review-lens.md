---
name: Assignment: add a performance review lens
about: Workshop assignment. Run it with the llm-eval workflow.
title: "Assignment: add a performance review lens"
labels: assignment
---

Add a `performance-reviewer` agent in `.claude/agents/performance-reviewer.md`. It reads the diff and replies with a JSON array of findings with file, line, severity, claim and evidence.

Acceptance:
- Read-only tools (`Read, Grep, Glob`) and a `VERDICT:` line, like `security-reviewer`.
- A finding only one voter confirms is dropped.
- A workflow's `review: { lenses: [...] }` names it.

Workflow: llm-eval
Red test: `tests/assignments/review-lens.test.ts`. Run it with `ASSIGNMENT=1 npx vitest run tests/assignments/review-lens.test.ts`; it must fail for the reason above before any work.
