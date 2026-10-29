# Build: band themes, palettes, header art (issue 27)

## Changed

- `shared/src/band-theme.ts` (+test): zod `bandThemeSchema` (paper, ink, muted, accent, accentInk, rule, art id), `contrastRatio`, `textPairs`.
- `shared/src/bands.ts`: a `theme` on every band. This is the only place palette tokens live.
- `shared/src/render-header-art.ts` (+test): pure theme-to-inline-SVG. A fixed 688x56 strip above the title. `aria-hidden`, no text, no external refs, colours from `accent` and `rule` only.
- `shared/src/render.ts` (+test): palette comes from the band theme, art strip sits above the h1, long titles wrap (`overflow-wrap: anywhere`), top padding 56 to 40 so the 56px strip costs 28px net.
- `shared/src/index.ts`: exports `band-theme`.
- `specs/25/golden/__snapshots__/*.html`: regenerated. The diff is palette colours and the art element only.

## Verified

- Typecheck (astro check 0/0/0, tsc) and the web build pass. Lint has one error that is a sandbox read denial on a git-ignored env file, not a code finding.
- vitest: all pass except `factory/engine/real-host.test.ts`, which hits `EPERM mkdir` under the sandbox temp dir. It is unrelated to this change.
- Every band's text pairs pass 4.5:1 in `band-theme.test.ts`.

## Not verified here

- `npm run e2e` and `npm run prove` could not run: the sandbox denies local port and pipe binding. `visual` and axe at 375 and 1280 are therefore unproven.
- "Max-items sheet fits 1056px" has no browser measurement. The art box is fixed-height and `#worksheet` keeps `overflow: hidden`, but a real render is needed to confirm no body text is clipped.
- No `web/` change was needed, since the preview renders the shared HTML.
