# Sharing: the factory installs in any repo with one command

**Layer:** sharing. **Proof:** `make prove LEVEL=sharing`.

## Goal

Package the agents, skills and guard you built as one plugin that a team installs, updates and checks, while `.claude/` stays the only place you edit them.

## The problem

A teammate wants your factory. They copy `.claude/` by hand. The hooks point at scripts that were not copied. A week later one skill is out of date in their repo, and nobody knows which.

## Without

Copy the folder. There is no version, no update, and no way to tell whether the copy still matches the original.

## The code

- `.claude-plugin/marketplace.json` lists one plugin, `factory-kit`. This repo is the marketplace.
- `plugins/factory-kit/.claude-plugin/plugin.json` holds the name, the version and the author. Users get an update only when `version` changes.
- `scripts/plugin.ts` copies the four generic skills, the five agents and the secrets guard from `.claude/` into the plugin. Nothing app-specific goes in: `worksheet-bands` and `rules/api.md` stay behind.
- `plugins/factory-kit/hooks/hooks.json` runs the guard with `${CLAUDE_PLUGIN_ROOT}`, not the project folder, because the plugin is copied to a cache when it is installed.
- `plugins/factory-kit/evals/` has two cases: one where the plugin should fire (triage a bug) and one where it should stay out (a question about France).

## With

A teammate runs two commands in their repo:

```
claude plugin marketplace add learnwithparam/claude-code-workshop
claude plugin install factory-kit@claude-code-workshop --scope project
```

When you bump `version` and push, `claude plugin update` brings the change to every repo that installed it.

## Run it

1. Type `npx tsx scripts/plugin.ts`. Expect `built plugins/factory-kit` and no change in `git status`.
2. Type `claude plugin validate plugins/factory-kit --strict`. Expect `Validation passed`.
3. Add a line to `.claude/skills/handoff/SKILL.md` and type `make prove LEVEL=sharing`. Expect FAIL with `skill handoff is stale`. Run step 1 and the proof passes again.
4. Optional, spends tokens: type `claude plugin eval plugins/factory-kit --threshold 0.8 --no-publish --trust-plugin`. It runs both cases with and without the plugin and prints the score difference.

## Prove it

`make prove LEVEL=sharing` rebuilds the plugin in a temporary folder, compares each skill with the committed copy, checks the marketplace lists `factory-kit`, and runs `claude plugin validate --strict` when `claude` is on the path. `tests/structure/plugin.test.ts` also checks that every file is a byte copy of `.claude/`, every hook path resolves inside the plugin, and that the version changed if any plugin file changed since the last tag.

## Exercise

Track A: install the kit into a fresh empty repo and run `/factory-kit:issue-triage` on an issue. Track B: move one more skill into the kit, add it to `KIT` in `scripts/plugin.ts`, bump the version, add an eval case for it, and pass `claude plugin validate --strict`.

## Discussion

A plugin's hooks run with your rights, outside the sandbox. Who reviews a marketplace before your team adds it, and what stops a later commit from changing what a hook does?
