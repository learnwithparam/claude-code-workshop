# Elective: Screenshots

**Extends:** verification. **Proof:** Compare a described bug with a pasted one by hand.

## Goal

A layout bug is easier to show than to describe.

## The problem

A layout bug is easier to show than to describe.

## Without

Describe an overflowing worksheet in words and see how close the fix lands.

## The config

- Paste or drag an image into the prompt, or give Claude a file path to a PNG.
- `tests/e2e/layout.e2e.ts` is the proof that a fix holds. It asserts no sideways scroll, no serious accessibility violation and no clipped print page.

## With

Take a screenshot of a clipped worksheet, paste it with one sentence, and let Claude fix the render. Then run the layout test.

## Run it

1. Open a worksheet that clips and take a screenshot.
2. Paste it into the prompt.
3. Type `npm run e2e` after the fix.

## Prove it

The layout test must pass after the fix. It is the same test that guards the repo, so a picture gets no special trust.

## Exercise

Track A: fix one clipped band from a screenshot. Track B: write the failing layout assertion first, then fix from the screenshot.

## Discussion

When does a picture beat a paragraph, and when does it hide the cause?
