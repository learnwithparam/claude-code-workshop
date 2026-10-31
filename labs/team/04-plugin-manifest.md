# Package your setup as a plugin

**Pairs with:** `docs/levels/sharing.md`
**Help:** hinted

## Goal

Write a plugin manifest so a teammate can install your skill and hook in one command.

## Steps

1. See one: `ls plugins` then `cat plugins/factory-kit/.claude-plugin/plugin.json`.
   Expect: A list of plugin folders, then JSON with `name`, `version` and `description`.
2. Make the folder: `mkdir -p .labs/work/plugin/.claude-plugin`.
   Expect: No output. The folder `.labs/work/plugin/.claude-plugin` now exists.
3. Write `.labs/work/plugin/.claude-plugin/plugin.json` with `name`, `version` and `description`.
   Expect: No output from a command, since you are writing the file. Afterwards it is valid JSON with those three fields.
4. Copy your skill from the earlier lab into `.labs/work/plugin/skills/`.
   Expect: No output when the copy works. `ls .labs/work/plugin/skills` then lists your skill folder.

## Proof

```sh
node -e "const m=require('./.labs/work/plugin/.claude-plugin/plugin.json'); process.exit(m.name && /^\d+\.\d+\.\d+$/.test(m.version) && m.description ? 0 : 1)"
```

## Hints

1. The manifest is plain JSON with three string fields.
2. The version looks like `0.1.0`.
3. The name is kebab-case, such as `my-team-kit`.
4. Commands, in order: `ls plugins`, `cat plugins/factory-kit/.claude-plugin/plugin.json`, `mkdir -p .labs/work/plugin/.claude-plugin`.

## What you just learned

A plugin is your `.claude/` folder with a name and a version. Sharing becomes an install, not a copy and paste.
