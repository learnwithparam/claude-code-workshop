---

name: "Assignment: fuzz the worksheet tool input"
about: "Workshop assignment. Run it with the security workflow."
title: "Assignment: fuzz the worksheet tool input"
labels: assignment
---

Property-test the worksheet tool input. Write the generator `arbWorksheet` in `shared/src/arb-worksheet.ts`: worksheet-shaped objects with hostile text, extreme sizes and every activity kind.

Acceptance:
- Every worksheet the schema accepts renders, and markup in a text field never reaches the page raw.
- `checkBand` reports problems instead of throwing.
- Plant a mutant (an escaping step removed) and show the property fails on it.

Workflow: security
Red test: `tests/assignments/fuzz-tool-input.test.ts`. Run it with `ASSIGNMENT=1 npx vitest run tests/assignments/fuzz-tool-input.test.ts`; it must fail for the reason above before any work.
