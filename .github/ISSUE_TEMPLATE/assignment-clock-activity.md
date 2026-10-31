---
name: Assignment: add the clock activity kind
about: Workshop assignment. Run it with the feature-bdd workflow.
title: "Assignment: add the clock activity kind"
labels: assignment
---

Add the `clock` activity kind: the model supplies a time (`hour`, `minute`), the code draws the face.

Acceptance:
- `clock` is in `ACTIVITY_KINDS` and `activitySchema` accepts it.
- `renderActivity` draws an SVG face.
- It is listed in `kinds` for the bands that allow it in `shared/src/bands.ts`, and `checkBand` rejects it in the others.

Workflow: feature-bdd
Red test: `tests/assignments/clock-activity.test.ts`. Run it with `ASSIGNMENT=1 npx vitest run tests/assignments/clock-activity.test.ts`; it must fail for the reason above before any work.
