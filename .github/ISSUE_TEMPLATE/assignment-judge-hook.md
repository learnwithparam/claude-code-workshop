---
name: Assignment: an opt-in LLM-judge hook
about: Workshop assignment. Run it with the feature-atdd workflow.
title: "Assignment: an opt-in LLM-judge hook"
labels: assignment
---

Add `.claude/hooks/pretooluse-judge.mjs` exporting `shouldJudge(env)`, `decide(verdict)` and `diffToSend(diff)`.

Acceptance:
- Off by default; on only when `JUDGE=1`.
- A `blocking` verdict blocks the commit, a `clean` one passes.
- A diff the secrets hook would block is never sent.

Workflow: feature-atdd
Red test: `tests/assignments/judge-hook.test.ts`. Run it with `ASSIGNMENT=1 npx vitest run tests/assignments/judge-hook.test.ts`; it must fail for the reason above before any work.
