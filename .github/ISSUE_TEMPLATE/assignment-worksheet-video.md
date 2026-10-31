---
name: Assignment: render a worksheet as a HyperFrames video
about: Workshop assignment. Run it with the ui-visual workflow.
title: "Assignment: render a worksheet as a HyperFrames video"
labels: assignment
---

Render a worksheet as a HyperFrames video with `renderWorksheetVideo` in `shared/src/render-video.ts`.

Acceptance:
- Every item appears once, in page order, as one `data-scene` element.
- The answer key is the final scene, `data-scene="answer-key"`.
- `hyperframes lint` passes on the output.

Workflow: ui-visual
Red test: `tests/assignments/worksheet-video.test.ts`. Run it with `ASSIGNMENT=1 npx vitest run tests/assignments/worksheet-video.test.ts`; it must fail for the reason above before any work.
