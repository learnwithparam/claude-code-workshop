# Visual guide: how the factory docs show, not just tell

The house style for every page in `docs/factory/`. Read it before you add a module or a picture. `tests/structure/factory-visuals.test.ts` holds the rules a test can check.

## What the best teaching docs do

| Source                                                                                                                                                              | Pattern we take                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [Anthropic, Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)                                                             | One diagram per pattern, placed right after the paragraph that names it, with a caption. The text points at a part of the picture ("the gate"). |
| [Diataxis, tutorials](https://diataxis.fr/tutorials/)                                                                                                               | Show the destination first, give a visible result at every step, show the exact expected output, and point out what the learner should notice.  |
| [Stripe, accept a payment](https://docs.stripe.com/payments/accept-a-payment.md?payment-ui=checkout&ui=stripe-hosted)                                               | Each step is tagged with where it runs, ends in a "verify" block, and has an "if it is not working" list. Real test values in a table.          |
| [Julia Evans, documenting a project with comics](https://jvns.ca/blog/2018/12/09/how-do-you-document-a-tech-project-with-comics/)                                   | The information is the main thing, not the art. Draw stable concepts, not flags that change. One picture holds a few points.                    |
| [GitHub alerts](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) | Five callout types, used rarely and never back to back.                                                                                         |
| [Claude Code, everything you need to know](https://github.com/wesammustafa/Claude-Code-Everything-You-Need-to-Know)                                                 | Captioned figures of the real tool, a "for you if" line per level, help that fades as the reader advances.                                      |

## The patterns, and when to use each

- **Pipeline strip.** Boxes left to right, one per stage, with the artifact under each box and the gate on the arrow. Use it when order is the lesson. Example: `img/pipeline.svg`.
- **Funnel.** Wide at the top, narrow at the bottom, with the rule that drops items at each step. Use it when a stage filters. Example: `img/review-funnel.svg`.
- **Ladder.** Rungs from low to high with the cost of each rung. Use it for tiers, sizes and approvals. Example: `img/risk-ladder.svg`.
- **Decision tree.** Questions in boxes, answers on the arrows, a named result at each leaf. Use it when the reader must choose. Example: `img/workflow-selector.svg`.
- **Loop.** A ring with the trigger, the action and the way back. Use it for feedback. Example: `img/sigma-loop.svg`.
- **Timeline of a real run.** Events in order, each quoting a committed file, with the failure in red. Use it once per real run you can cite. Example: `img/run-35-timeline.svg`.
- **Before and after.** Two panels, the same ticket, without the layer and with it. Put this in the story, as prose, when no picture is needed.

## The story opening

Every module opens with `## Story`, three short paragraphs before the goal:

1. **The ticket.** A real issue from `specs/<n>/`, named by number.
2. **Without the layer.** What went wrong, or would have, quoted from a committed file.
3. **What the layer did.** The check, gate or file that caught it, by name.

Quote only what a file in this repo says. If no run shows the failure, say that the story is the test.

## Captions

The line under each picture starts with `*Notice:*` and names the one thing to look at. A caption that only repeats the title is cut.

## Callouts

Use GitHub alerts, at most two per module, never back to back.

- `> [!NOTE]` a limit of the code today, such as a stage that tests call but no run reaches.
- `> [!TIP]` a shortcut that saves a learner time.
- `> [!WARNING]` a step that spends tokens or changes shared state.

## Palette tokens

Colour carries meaning, and the same meaning on every picture. Each SVG draws its own card, so it reads on a light or a dark page, and switches to the dark values under `prefers-color-scheme: dark`.

| Token   | Means                          | Light     | Dark      |
| ------- | ------------------------------ | --------- | --------- |
| `card`  | the picture background         | `#ffffff` | `#0a0a0a` |
| `ink`   | text                           | `#171717` | `#ededed` |
| `muted` | secondary text                 | `#525252` | `#a1a1a1` |
| `line`  | borders and arrows             | `#d4d4d4` | `#3f3f3f` |
| `model` | a step a model does            | `#0062d1` | `#52a8ff` |
| `code`  | a check that code decides      | `#107d32` | `#3fb950` |
| `human` | a gate a person passes         | `#a35200` | `#f5a623` |
| `fail`  | a stop, a failure, a red check | `#c4171c` | `#ff6166` |
| `file`  | an artifact on disk            | `#7d2fd0` | `#bf7af0` |

Each colour token has a tint for box fills (`*-bg`), set in the same `<style>` block. Text is always `ink` or `muted` on a tint, so contrast does not depend on the hue. Never use colour alone: every box also has a label.

## SVG rules

- Hand-written, in `docs/factory/img/`, kebab-case names.
- `role="img"`, a `<title>` and a `<desc>` that says what the picture shows in a sentence or two, linked with `aria-labelledby`.
- Text is real `<text>`, never paths, so it can be searched, copied and translated.
- Font stack: `Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`, and `"Geist Mono", ui-monospace, Menlo, Consolas, monospace` for file names.
- Text at least 12px at the picture's own width. A picture is at most 960 wide.
- Under 40 KB. No embedded fonts or bitmaps.
- Draw only what the code does today. A part that only tests reach is drawn dashed and labelled "tests only".
- Mermaid only where a custom picture cannot show it, such as a graph generated from data.

## Embedding

```markdown
![The six stages from a ready ticket to a merged pull request](img/pipeline.svg)

_Notice:_ each arrow is a check that reads an exit code or a hash.
```

The alt text says what the picture shows. The caption says what to notice.
