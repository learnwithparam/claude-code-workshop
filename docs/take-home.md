# Take-home: multi-page worksheets

Teach the agent to produce a worksheet with more than one page. Example: a three-page grade 3 maths pack with practice, a challenge page, then the answer key.

Do it through the factory you built, not by hand.

## The brief

File one epic issue and three sub-issues, then run each through `make factory`.

1. **Schema.** A worksheet has `pages[]`, each with its own sections. Each band gets a `maxItemsPerPage` in `shared/src/bands.ts`.
2. **Render and check.** `render.ts` adds page breaks and page numbers. `check.ts` checks each page against its band.
3. **Agent and page.** The agent asks how many pages only when the prompt does not say. The preview shows a strip of pages.

## Done means

- `make check` passes with zero errors and zero warnings.
- The answer key is always the last page.
- No page goes over its band's `maxItemsPerPage`.
- Printing gives exactly as many pages as the worksheet has.
- Three pages cost under 2,500 output tokens. Re-record `fixtures/eval.json` and let `make prove LEVEL=skills` judge it.
- Every bug you fix ships a test that fails without the fix.
- The pull request came from your own factory run, with the plan comment and a human merge.

## Stretch

Replace the layout test with a Playwright check at 375 px and an axe pass. Add a retro stage that proposes one change to `.claude/`.
