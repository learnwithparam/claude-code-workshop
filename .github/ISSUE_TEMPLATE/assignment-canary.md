---

name: "Assignment: canary prompt with rollback"
about: "Workshop assignment. Run it with the llm-eval workflow."
title: "Assignment: canary prompt with rollback"
labels: assignment
---

Add `api/src/agent/canary.ts` for the prompt in `api/src/agent/prompt.ts`.

Acceptance:
- `routePrompt(requestId, share)` returns `"candidate"` or `"current"`, the same way for the same id, and near `share` over many ids.
- `decideCanary({ current, candidate, margin })` returns `"rollback"` when the candidate's pass rate falls below the current one by more than `margin`, otherwise `"keep"`.
- After a rollback the share is 0 and the event is logged.

Workflow: llm-eval
Red test: `tests/assignments/canary.test.ts`. Run it with `ASSIGNMENT=1 npx vitest run tests/assignments/canary.test.ts`; it must fail for the reason above before any work.
