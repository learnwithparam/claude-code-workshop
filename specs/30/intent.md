# Design contract: issue 30, layout variety and print breaks

I didn't write `specs/30/contract.md`. Plan mode is on and only allows edits to the plan file. The contract is in the plan file at `/var/folders/57/8pd9jzz53rz3bydfggfv_1x40000gn/T/factory-home-yeZbEc/.claude/plans/stage-contract-write-a-async-noodle.md`. Once plan mode ends, I can copy it to `specs/30/contract.md`. I also couldn't call ExitPlanMode, because it isn't available here.

## Screen job

Give each worksheet section its own card, put short items in two columns, and put the answer key on its own page. Today every section uses the same single-column list.

## Primary action

The teacher prints the worksheet. Every item must stay whole on the page, and the answer key must come off as a separate sheet.

## States

- **Filled, mixed sections:** each section is a card with its heading and instruction. `shared/` decides one column or two, never the model.
- **Few or long items:** a section with fewer than 4 items, or any item over the band's length limit, stays single column. A grid never leaves a lone orphan item.
- **Single section or single item:** one card, no empty columns, no blank page.
- **No answer key:** no key page and no trailing blank page.
- **Activity and picture items:** their renderers stay as they are, inside the card.
- **Loading and error:** unchanged.
- **Print:** a card may break between items but never inside one. The key always starts a new page.

## Responsive rules

- The composition is fixed at 816px by 1056px. The `visual` check looks at 375px and 1280px in the web preview.
- At 375px the page scales down as a whole, with no horizontal scroll or clipping. At 1280px it keeps its natural width.
- Two-column grids apply only above the band's minimum width. Large-type bands (kindergarten, early-reader) stay single column.
- `#worksheet` has a fixed height and `overflow: hidden` today. The height becomes a minimum, or a multi-page sheet gets clipped.
- Print rules:
  - `break-inside: avoid` on every item and card heading.
  - `break-before: page` on the key.
  - `break-after: avoid` on headings.

## Data and code rules

- Layout is decided in `render-section.ts` and `render.ts` from section data. There are no new model fields.
- Files stay under 300 lines.
- Tests sit beside the code:
  - The key has a page-break rule.
  - Every item has `break-inside: avoid`.
  - The grid is used only above the item-count and length threshold.
- Golden snapshots are regenerated, not hand-edited.

## Patterns to reject

- A layout field in the model tool schema.
- Fixed heights that clip overflow.
- Page breaks made with spacer divs or `<br>`.
- Fake columns made with `display: contents` or absolute positioning.
- Hard-coded colours per section. Cards use band theme tokens.
- An orphan heading at the bottom of a page.
- Loosening the `visual` threshold or editing gate files to make it pass.
- New dependencies or a print library.

## Budget

Tests and `visual` use fixtures. One live smoke run, counted inside the $60 live-run cap.
