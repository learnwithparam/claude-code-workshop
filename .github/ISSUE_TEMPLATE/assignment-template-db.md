---

name: "Assignment: move worksheet templates into a database"
about: "Workshop assignment. Run it with the spike, then feature-sdd workflow."
title: "Assignment: move worksheet templates into a database"
labels: assignment
---

Spike first: which store for worksheet templates, and what it rules out. File the spike alone and read its decision record before filing the build.

Then add `createDbTemplateStore(file)` in `api/src/templates/db-template-store.ts` with the same `add`, `size` and `find` as `template-store.ts`.

Acceptance:
- A second store opened on the same file finds a template the first saved.
- Adding the same template twice keeps one.

Workflow: spike, then feature-sdd
Red test: `tests/assignments/template-db.test.ts`. Run it with `ASSIGNMENT=1 npx vitest run tests/assignments/template-db.test.ts`; it must fail for the reason above before any work.
