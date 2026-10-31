---

name: "Assignment: name the approvers for a high-risk gate"
about: "Workshop assignment. Run it with the feature-atdd workflow."
title: "Assignment: name the approvers for a high-risk gate"
labels: assignment
---

Read the approver logins from `.factory/config.yaml` (an `approvers` list in `portableSchema`) and pass them to `realHost` from `runIssue`.

Acceptance:
- A high-risk gate opens with two listed people, a medium one with one.
- One person commenting twice counts once.
- The logged-in user is no longer assumed.

Workflow: feature-atdd
Red test: `tests/assignments/approvers.test.ts`. Run it with `ASSIGNMENT=1 npx vitest run tests/assignments/approvers.test.ts`; it must fail for the reason above before any work.
