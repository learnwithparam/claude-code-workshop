# Design contract: issue 32, page strip and example picker

I did not write `specs/32/contract.md`. Plan mode is on and only allows edits to the plan file, so the contract is at `/var/folders/57/8pd9jzz53rz3bydfggfv_1x40000gn/T/factory-home-Uxwekh/.claude/plans/stage-contract-write-a-cozy-goblet.md`. It needs copying to `specs/32/contract.md` once plan mode is off.

## Screen job

A visitor can start a worksheet without writing a prompt. They can also move between the pages of the sheet they already have.
- **Example picker:** a short list of example prompts that fills the prompt box.
- **Page strip:** one thumbnail per page of the current sheet. It shows the active page and switches the preview when a page is chosen.

## Primary action

- **No sheet yet:** choosing an example fills the input and moves focus to it. It does not auto-submit, because a submit spends tokens. The visitor presses Generate.
- **Sheet exists:** choosing a page shows that page in the preview.

## States

Example picker:
- **Default:** 4 to 6 static examples. They are constants, not model output.
- **Selected:** the chosen example is marked with `aria-pressed`.
- **Disabled:** all examples are inert while a generation is streaming.

Page strip:
- **Empty:** hidden, with no placeholder box and no gap.
- **Loading:** skeleton thumbnails, with pages already received shown.
- **One page:** a single thumbnail, or hidden if that is cleaner. The build stage picks one and tests it.
- **Many pages:** the active page has `aria-current="page"`.
- **Error:** keep the pages already received. The error text is generic, with no model name, token count or stack.

## Responsive rules (checked at 375 and 1280)

- **375:**
  - No page-level horizontal scroll. The strip is one row that scrolls inside its own box.
  - Examples are full-width buttons in one column.
  - Tap targets are at least 44px.
- **1280:**
  - Examples sit in a wrapped row under the input.
  - The strip sits beside or under the preview and does not push the sheet off-screen.
- **Thumbnails:** they come from the `shared/` render at a fixed aspect ratio. Code sets the layout, not the model.
- **Print:** unaffected. Neither the strip nor the picker prints.

## Keyboard and accessibility

- Every example and page is a native `<button>`. Tab order is input, examples, strip, preview.
- Enter and Space activate. The focus ring is visible at 3:1 contrast or better. Focus survives strip updates.
- The strip is a labelled region. Each thumbnail has a name like "Page 2 of 4".
- Text contrast is at least 4.5:1. The font is Geist.

## Constraints

- **Astro and env:** static output only. `PUBLIC_API_URL` is the only config, and no key goes in `web/`.
- **Example list:** a zod-validated constant in its own kebab-case module, with a `.test.ts` beside it.
- **Code standards:** named exports only, except in `web/src/pages/`. Files stay under 300 lines. No `utils/` or `common/`.
- **Gate:** `make check` is clean and `visual` passes at 375 and 1280.
- **Cost:** `visual` runs on fixtures with no live model calls. Live runs count against the $60 cap.

## Patterns to reject

- Examples that auto-submit.
- A carousel with autoplay, or arrows with no keyboard path.
- A `div` with a click handler in place of a button.
- Hover-only controls or labels.
- Page-level horizontal scroll at 375.
- A fixed-pixel strip wider than the viewport.
- Thumbnails built from model-supplied HTML or layout.
- Color alone to show the active page.
- Layout shift when pages arrive. Reserve the strip height.
- A spinner with no skeleton.
- Raw error, model or token text shown to the visitor.
- `any`, a default export outside the pages folder, or a generic `helpers` module.
