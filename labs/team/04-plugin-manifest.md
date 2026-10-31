# Package your setup as a plugin

**Pairs with:** `docs/levels/sharing.md`
**Help:** hinted

## Warm-up

Why does a deny rule in `.claude/settings.json` protect the whole team?
From: team-01
Answer: The file is committed, so every clone gets the same rule.

## Goal

Write a plugin manifest so a teammate can install your skill in one command.

## Predict

What turns a folder of skills and hooks into something a teammate can install?

Answer: A manifest with a name, a version and a description, because installing needs something to identify and update.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. See one: `ls plugins` then `cat plugins/factory-kit/.claude-plugin/plugin.json`.
   Expect: A list of plugin folders, then JSON with `name`, `version` and `description`.
3. Make the folder: `mkdir -p .labs/work/plugin/.claude-plugin`.
   Expect: No output. The folder `.labs/work/plugin/.claude-plugin` now exists.
4. [editor] Write `.labs/work/plugin/.claude-plugin/plugin.json` with `name`, `version` and `description`.
   Expect: No output from a command, since you are writing the file. Afterwards it is valid JSON with those three fields.
5. Copy your skill from the earlier lab into `.labs/work/plugin/skills/`.
   Expect: No output when the copy works. `ls .labs/work/plugin/skills` then lists your skill folder.

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
4. The plugin name is kebab-case, the version is semver, the description has words and a skill exists.

   ```sh
   node -e "const m=require('./.labs/work/plugin/.claude-plugin/plugin.json'); process.exit(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.name) && /^\d+\.\d+\.\d+$/.test(m.version) && String(m.description).split(' ').length>=4 ? 0 : 1)" && ls .labs/work/plugin/skills/*/SKILL.md >/dev/null
   ```

## Hints

1. The manifest is plain JSON with three string fields.
2. The version looks like `0.1.0`.
3. The name is kebab-case, such as `my-team-kit`.
4. Commands, in order: `ls plugins`, `cat plugins/factory-kit/.claude-plugin/plugin.json`, `mkdir -p .labs/work/plugin/.claude-plugin`.

## What you just learned

A plugin is your `.claude/` folder with a name and a version. Sharing becomes an install, not a copy and paste.
