# Assignment: render a worksheet as a HyperFrames video

## Brief

Render a worksheet as a HyperFrames video with `renderWorksheetVideo` in `shared/src/render-video.ts`.

## Level

senior

## Acceptance

- Every item appears once, in page order, as one `data-scene` element.
- The answer key is the final scene, `data-scene="answer-key"`.
- `hyperframes lint` passes on the output.

## Workflow

`ui-visual`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/worksheet-video.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `ASSIGNMENT=1 npx vitest run tests/assignments/worksheet-video.test.ts`.
   Expect: It fails because `shared/src/render-video.ts` does not exist.
2. File the issue: `gh issue create --title "Assignment: render a worksheet as a HyperFrames video" --body-file assignments/worksheet-video.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `shared/src/render-video.ts`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=ui-visual`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `ASSIGNMENT=1 npx vitest run tests/assignments/worksheet-video.test.ts`.
   Expect: It passes.

## Discussion

Why does the video reuse the page's item order instead of rendering its own?

- **Principal:** A video renderer and a page renderer now both walk the worksheet. What stops the two from drifting, and which of them should own the order?

## File it

```sh
gh issue create --title "Assignment: render a worksheet as a HyperFrames video" --body-file assignments/worksheet-video.md --label assignment
```
