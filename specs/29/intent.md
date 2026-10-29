# Design contract: issue 29, inline SVG icon set

**Not saved to `specs/29/` yet.** Plan mode only allows edits to the plan file, so I wrote this contract there instead. It still needs to be copied to `specs/29/contract.md`.

## Screen job

Show a small coloured picture in each worksheet picture box so a child can match it to the item. The model picks an icon id and never writes markup. `shared/` turns the id into SVG.

## Primary action

The teacher reads the worksheet and prints it. The picture must be recognisable at a glance, and it must not get in the way of the item text.

## States

- **Filled:** a known icon id renders its inline SVG inside the picture box.
- **Empty:** no picture is requested, so the box is omitted. The layout does not leave a gap.
- **Unknown id:** the schema rejects it. The api retries once, then shows the generic error "Couldn't make that worksheet, try again". The error names no model and no id.
- **Loading:** the existing chat streaming state. The icon appears with the worksheet and has no spinner of its own.
- **Print:** the icon is a vector with fixed colours, and it stays visible with background graphics off.

## Responsive rules

- The icon scales to its picture box with `viewBox` only. There are no fixed pixel sizes inside the SVG.
- At 375px the box is no wider than the column. There is no horizontal scroll and no clipping.
- At 1280px the box keeps the band's picture-box size and does not grow.
- Each icon has a title for assistive tech. Decorative use gets `aria-hidden`. Colour is never the only cue.

## Data and code rules

- About 40 icons live in `shared/src/art/`, one kebab-case file each, as formatted TypeScript string constants. Biome config and the other gate files are not touched.
- `shared/` owns an `icon-id` zod enum built from one registry module, so the ids and the SVGs cannot drift apart.
- The model tool schema takes the enum and nothing else. The renderer looks up the SVG by id.
- Tests sit beside the code:
  - A property check: for generated model output, nothing contains `<`, `>`, `<svg`, `javascript:` or `on*=`.
  - An unknown id fails the schema.
  - Every id has an SVG and every SVG has an id.
- Each file stays under 300 lines. Named exports only.

## Patterns to reject

- Any free-text, URL or markup field for a picture.
- Rendering model strings with `innerHTML` or `set:html`. Only registry constants may be injected.
- An icon font, an emoji fallback, an image CDN or a runtime fetch.
- One giant icons file, or an `utils/` or `common/` folder.
- Editing `biome.json` or any gate file to make the formatted constants pass.
- Showing the model name, an id list or a stack trace in an error shown to a customer.
- Hard-coded hex colours scattered through the renderer. Colours stay inside each icon constant.

## Budget

Tests use fixtures. Only one live smoke run, counted inside the $60 live-run cap.
