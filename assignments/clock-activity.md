# Assignment: add the clock activity kind

## Brief

Add the `clock` activity kind: the model supplies a time (`hour`, `minute`), the code draws the face.

## Level

noob

## Acceptance

- `clock` is in `ACTIVITY_KINDS` and `activitySchema` accepts it.
- `renderActivity` draws an SVG face.
- It is listed in `kinds` for the bands that allow it in `shared/src/bands.ts`, and `checkBand` rejects it in the others.

## Workflow

`feature-bdd`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/clock-activity.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `ASSIGNMENT=1 npx vitest run tests/assignments/clock-activity.test.ts`.
   Expect: It fails because `clock` is not yet in `ACTIVITY_KINDS`.
2. File the issue: `gh issue create --title "Assignment: add the clock activity kind" --body-file assignments/clock-activity.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `shared/src/activity-kinds.ts`, `shared/src/render-activity.ts`, `shared/src/bands.ts`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=feature-bdd`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `ASSIGNMENT=1 npx vitest run tests/assignments/clock-activity.test.ts`.
   Expect: It passes.

## Discussion

Why does the model supply only `hour` and `minute` while the code draws the face?

- **Principal:** A new activity kind touches the schema, the renderer and the band table. How would you make forgetting one of them a failing test?

## File it

```sh
gh issue create --title "Assignment: add the clock activity kind" --body-file assignments/clock-activity.md --label assignment
```
