# Cheat sheet

Generated from the `## Trick` of each lab. Regenerate with `npx tsx scripts/labs/cheat-sheet.ts > docs/labs/cheat-sheet.md`.

## start

- **start-01** Ask Claude about the repo: Add `--output-format json` to `claude -p` and the answer comes back as one JSON result that a script can parse.
- **start-02** Run the gate yourself: Type `/gate` in Claude Code. The project command in `.claude/commands/gate.md` runs `make check` and reports only what failed.
- **start-03** Plan before you edit: Add `--permission-mode plan` to `claude -p` for any change you want to read before it happens. Claude plans and edits nothing.
- **start-04** Teach Claude a personal habit: Type `/memory` in Claude Code to see which instruction files loaded, so you can confirm your `CLAUDE.local.md` came in.

## daily

- **daily-01** Continue where you left off: Run `claude --continue` (or `-c`) to reopen the most recent conversation in this folder, or `claude --resume` to pick an older one.
- **daily-02** Write a rule that loads only where it applies: A rule file with no `paths:` list loads every session. Add the list and it costs context only when Claude works in matching files.
- **daily-03** Package a habit as a skill: Type `/` plus your skill name, such as `/commit-message`, to run it on purpose instead of waiting for Claude to match its description.
- **daily-04** Block a mistake with a hook: Start Claude Code with `claude --debug=hooks` to see each hook fire, what it received and what it returned.
