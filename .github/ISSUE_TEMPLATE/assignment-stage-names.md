---
name: Assignment: a model for every stage name
about: Workshop assignment. Run it with the llm-eval workflow.
title: "Assignment: a model for every stage name"
labels: assignment
---

Every stage name in every workflow resolves to a config stage, or the workflow test fails.

Acceptance:
- Each name used in `.factory/workflows/` is a key of `stepStages` or one of `STAGE_NAMES`.
- Each step resolves to a model in `allowedModels`.

Workflow: llm-eval
Red test: `tests/assignments/stage-names.test.ts`. Run it with `ASSIGNMENT=1 npx vitest run tests/assignments/stage-names.test.ts`; it must fail for the reason above before any work.
