# Package your setup as a plugin

**Pairs with:** `docs/levels/sharing.md`
**Help:** hinted

## Goal

Write a plugin manifest so a teammate can install your skill and hook in one command.

## Predict

What turns a folder of skills and hooks into something a teammate can install?

Answer: A manifest with a name, a version and a description, because installing needs something to identify and update.

## Steps

1. See one: `ls plugins` then `cat plugins/factory-kit/.claude-plugin/plugin.json`.
2. Make the folder: `mkdir -p .labs/work/plugin/.claude-plugin`.
3. Write `.labs/work/plugin/.claude-plugin/plugin.json` with `name`, `version` and `description`.
4. Copy your skill from the earlier lab into `.labs/work/plugin/skills/`.

## Proof

1. plugin.json has a name.

   ```sh
   node -e "process.exit(require('./.labs/work/plugin/.claude-plugin/plugin.json').name ? 0 : 1)"
   ```
2. plugin.json has a version like 0.1.0.

   ```sh
   node -e "process.exit(/^\\d+\\.\\d+\\.\\d+$/.test(require('./.labs/work/plugin/.claude-plugin/plugin.json').version) ? 0 : 1)"
   ```
3. plugin.json has a description.

   ```sh
   node -e "process.exit(require('./.labs/work/plugin/.claude-plugin/plugin.json').description ? 0 : 1)"
   ```

## Hints

1. The manifest is plain JSON with three string fields.
2. The version looks like `0.1.0`.
3. The name is kebab-case, such as `my-team-kit`.
4. Commands, in order: `ls plugins`, `cat plugins/factory-kit/.claude-plugin/plugin.json`, `mkdir -p .labs/work/plugin/.claude-plugin`.

## What you just learned

A plugin is your `.claude/` folder with a name and a version. Sharing becomes an install, not a copy and paste.
