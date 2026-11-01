# Route a step to its model

**Pairs with:** `docs/factory/f12-model-routing.md`
**Help:** goal

## Warm-up

How many humans must approve a change that touches .github/?
From: factory-08
Answer: Two. The workflow folder is a high tier path.

## Goal

Write .labs/work/route.ts, which prints the model the factory picks for a step name and a ticket type from .factory/config.json. The proof must pass.

## Predict

The docs workflow names its build step write. A bug ticket and a docs ticket both run a step called write. Do they get the same model?

Answer: No. The step name maps to the build stage, and the docs route replaces the build model with Haiku. A bug ticket keeps the build default, Sonnet.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read the model routing doc.
3. Make the lab work folder.
4. [editor] Write .labs/work/route.ts. It takes a step name and a ticket type from the command line and prints the model.
5. Run it for a build step on a bug ticket and for a write step on a docs ticket.
   Expect: `claude-sonnet-5-5` for the build step and `claude-haiku-5-5` for the docs write step.

## Proof

1. route.ts gives the model for three pairs the lab does not show you.

   ```sh
   test "$(npx tsx .labs/work/route.ts build bug)" = "claude-sonnet-5-5"
   test "$(npx tsx .labs/work/route.ts intent bug)" = "claude-haiku-5-5"
   test "$(npx tsx .labs/work/route.ts write docs)" = "claude-haiku-5-5"
   ```
2. The ticket type decides, not the step name alone.

   ```sh
   test "$(npx tsx .labs/work/route.ts write bug)" = "claude-sonnet-5-5"
   ```

## Hints

1. `resolveModel` in `factory/engine/models.ts` is the one place a step's model is decided.
2. It needs the config: `loadConfig()` from `factory/config.ts` reads .factory/config.json.
3. Print what `resolveModel` returns. A script that always prints Sonnet passes the build pair and fails the intent pair.
4. Commands: `cat docs/factory/f12-model-routing.md`, `mkdir -p .labs/work`, `npx tsx .labs/work/route.ts build bug`, `npx tsx .labs/work/route.ts write docs`. The script is `import { loadConfig } from "../../factory/config.ts"; import { resolveModel } from "../../factory/engine/models.ts"; const [step = "", type = ""] = process.argv.slice(2); console.log(resolveModel({ cfg: loadConfig(), step, type }));`.

## What you just learned

One function decides every model. The step name picks a stage, the ticket type can override the stage's model, and the config file holds both tables.
