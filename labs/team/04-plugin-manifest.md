# Package your setup as a plugin

**Pairs with:** `docs/levels/sharing.md`

## Goal

Write a plugin manifest so a teammate can install your skill and hook in one command.

## Steps

1. See one: `ls plugins` then `cat plugins/factory-kit/.claude-plugin/plugin.json`.
2. Make the folder: `mkdir -p .labs/work/plugin/.claude-plugin`.
3. Write `.labs/work/plugin/.claude-plugin/plugin.json` with `name`, `version` and `description`.
4. Copy your skill from the earlier lab into `.labs/work/plugin/skills/`.

## Proof

```sh
node -e "const m=require('./.labs/work/plugin/.claude-plugin/plugin.json'); process.exit(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.name) && /^\d+\.\d+\.\d+$/.test(m.version) && String(m.description).split(' ').length>=4 ? 0 : 1)" && ls .labs/work/plugin/skills/*/SKILL.md >/dev/null
```

## Hints

1. The manifest is plain JSON with three string fields.
2. The version looks like `0.1.0`.
3. The name is kebab-case, such as `my-team-kit`.

## What you just learned

A plugin is your `.claude/` folder with a name and a version. Sharing becomes an install, not a copy and paste.
