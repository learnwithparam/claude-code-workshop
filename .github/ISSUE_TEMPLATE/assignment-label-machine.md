---
name: Assignment: specify the label state machine
about: Workshop assignment. Run it with the feature-atdd workflow.
title: "Assignment: specify the label state machine"
labels: assignment
---

Add `factory/label-machine.ts` with `applyEvent(labels, event)` and `canBuild(labels)`, for the labels in `.factory/config.json`. Events: `plan-written`, `human-approved`, `build-requested`, `stuck`, `retry`.

Invariants:
- A build never starts without `plan:approved`.
- A new plan always clears `plan:approved`.
- `needs-human` is never cleared by the factory, only by `human-approved`.

Workflow: feature-atdd
Red test: `tests/assignments/label-machine.test.ts`. Run it with `ASSIGNMENT=1 npx vitest run tests/assignments/label-machine.test.ts`; it must fail for the reason above before any work.
