# Context: Claude gets the standards on the first try

**Layer:** context and memory. **Proof:** `make prove LEVEL=context`.

## Goal

Claude follows your conventions without being told each session, and the conventions cannot rot silently.

## The problem

In a cold repo, ask Claude to "add a helper that formats grade names". It creates `utils/helpers.ts` with a default export and an `any`. The repo says no `utils/`, no default exports, no `any`.

## Without

Delete `AGENTS.md` and `.claude/rules/` on a scratch branch and run the prompt. Then run `make check`. The result fails the naming and file checks.

## The config

- `AGENTS.md` holds the commands, the workspace map, the standards and the definition of done. Other tools read it too.
- `CLAUDE.md` is three lines: `@AGENTS.md` and the compaction instruction. Without the import, Claude ignores the standards.
- `.claude/rules/{web,api,shared,secrets}.md` are path-scoped. A rule loads only when Claude touches a matching file.
- `scripts/check-conventions.ts` enforces kebab-case, banned folder names and the 300-line cap.

## With

Run the same prompt. Claude adds `formatBand` to `shared/src/bands.ts` with a test beside it. Run `/context` while editing in `web/` and see the web rule loaded, the api rule not.

## Run it

1. Type `claude`. Say "add a helper that formats grade names". Expect `formatBand` in `shared`.
2. Type `/context`. Expect `AGENTS.md` and one rule listed.
3. Type `/compact keep file paths and decisions`. Expect a short summary that keeps both.

## Prove it

`make prove LEVEL=context` checks that `CLAUDE.md` imports `AGENTS.md` and is short, that every rule's `paths` glob matches a real file, and that the repo passes its own conventions.

## Exercise

Track A: add a rule for `tests/`. Track B: add a convention to `check-conventions.ts` and watch the proof catch a violation.

## Discussion

Which of your team's unwritten rules would Claude break today?
