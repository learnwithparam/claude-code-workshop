# Fix #26

- Added `shared/src/geist-font-face.ts`: Geist woff2 as a base64 `data:` `@font-face`.
- `shared/src/render.ts`: emit it in `<style>`; Geist first in the font stack.
- Locked test `specs/26/golden/font-face.golden.test.ts` passes; shared tests pass.
- `make check` lint still fails on `specs/26/lock.json` formatting (runner-owned, untouched).
