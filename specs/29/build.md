# Build: issue 29, inline SVG icon set

## Fix for the failed check

`tests/e2e/layout.e2e.ts` "prints on one Letter page with nothing clipped" failed for the letter B fixture (early-reader, 30px type, 4 picture items): `#worksheet` scrollHeight exceeded its 1056px height.

Cause: the picture box held a 3.2em block SVG, baseline-aligned, so each row grew too tall.

Change, in `shared/src/render.ts` only:

- `.picture`: `vertical-align: middle`, dropped `min-height: 3.2em`. `min-width: 3.2em` stays.
- `.picture svg`: 2.2em square, centred with `margin: 0 auto`, still `viewBox`-scaled and `max-width: 100%`.
- Regenerated the specs/25 golden HTML snapshots, since they embed this CSS.

## Verified

- `npm run typecheck` is clean.
- `npm run lint` finds no lint errors in the code.
- `npm test` passes 624 of 625 run tests. The one failure is `factory/engine/real-host.test.ts`, which hit EPERM writing outside the sandbox. It is unrelated to this change.
- The golden test passes after regeneration.

## Not verified

The sandbox blocks port binding and Chromium launch, and the unsandboxed run was declined. So I did not run `npm run e2e` or `make check`. The one-page fit is unconfirmed. Run `make check` outside the sandbox. If the letter B sheet still clips, lower the icon size in `shared/src/render.ts` further.
