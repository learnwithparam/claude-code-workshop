# Hand-built: the app before any AI helps

**Layer:** audit. **Proof:** `make prove LEVEL=hand-built`.

## Goal

Know exactly what you are about to hand to an agent. A band table, a schema, a checker and a renderer, all written by a person, all tested.

## The problem

Brightpath Tutoring needs a worksheet that fits the learner. A kindergartener needs 26 px text and 8 items. A university student needs a dense page. Ask a model to write the whole page and you get 6,000 tokens of HTML, and the band is often wrong.

## Without

Open `shared/src/bands.ts`. There is no AI here. A person decided every limit. That is the point: the model will only fill content later, and this code will decide layout.

## The code

- `shared/src/bands.ts` holds seven bands, each with a font, a size, an item cap and aliases.
- `shared/src/schema.ts` is the zod shape of a worksheet.
- `shared/src/check.ts` returns the problems a worksheet has for its band.
- `shared/src/render.ts` turns a worksheet into a HyperFrames still composition.
- `web/` is a static Astro page. Example buttons render fixtures, so it works with no API.

## Run it

1. Type `make dev`. Say nothing. Expect a page with a chat on the left and a preview on the right.
2. Click an example button. Expect a worksheet in the preview.
3. Click Print / Save PDF. Expect the browser print dialog.

If the page is blank, run `make doctor` and check you are on Node 22.

## Prove it

`make prove LEVEL=hand-built` renders all seven bands, runs `hyperframes lint` on each, and checks that nothing in `web/` calls an API. Expect `PASS hand-built`.

## Exercise

Track A: add a band alias such as "year 1" and make the structural test pass. Track B: add a band for adult learners with its own font size and item cap.

Catch up with `make levels LEVEL=hand-built`, then open `supplied/hand-built`.

## Go further: a clean place to start

Run `make doctor` before anything else. It names what is missing instead of failing three steps later. `/help` lists the commands in your version, and `/doctor` checks the install.

## Discussion

Which parts of your own product are decided by a person and should stay that way?
