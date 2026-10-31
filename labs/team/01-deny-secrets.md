# Deny what Claude must never read

**Pairs with:** `docs/levels/boundary.md`
**Help:** hinted

## Goal

Write a settings file that denies reading `.env` files, so the rule holds for everyone who clones the repo.

## Steps

1. Read the real one: `cat .claude/settings.json`.
   Expect: JSON with a `permissions` object that has `deny` rules, and probably `allow` rules and `hooks` too.
2. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
3. Write `.labs/work/settings.json` with a `permissions.deny` list that blocks `Read(./.env)` and `Read(./.env.*)`.
   Expect: No output from a command, since you are writing the file. Afterwards the `deny` list holds both `Read(./.env)` and `Read(./.env.*)`.
4. Check it is valid JSON: `node -e "JSON.parse(require('fs').readFileSync('.labs/work/settings.json','utf8'))"`.
   Expect: No output when the JSON is valid. A `SyntaxError` with a position means a missing comma or quote.

## Proof

1. settings.json denies reading the secrets file.

   ```sh
   node -e "process.exit(require('./.labs/work/settings.json').permissions.deny.includes('Read(./.env)') ? 0 : 1)"
   ```
2. settings.json denies reading the variant secrets files.

   ```sh
   node -e "process.exit(require('./.labs/work/settings.json').permissions.deny.includes('Read(./.env.*)') ? 0 : 1)"
   ```

## Hints

1. The shape is `{ "permissions": { "deny": ["..."] } }`.
2. Each entry is a tool name with a pattern in brackets.
3. The two entries to write are `Read(./.env)` and `Read(./.env.*)`.
4. Commands, in order: `cat .claude/settings.json`, `mkdir -p .labs/work`, `node -e "JSON.parse(require('fs').readFileSync('.labs/work/settings.json','utf8'))"`.

## What you just learned

`.claude/settings.json` is committed, so a deny rule protects the whole team, not only you.
