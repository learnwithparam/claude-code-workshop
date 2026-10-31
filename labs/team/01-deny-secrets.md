# Deny what Claude must never read

**Pairs with:** `docs/levels/boundary.md`

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

```sh
node -e "const s=require('./.labs/work/settings.json'); const d=s.permissions.deny; process.exit(d.includes('Read(./.env)') && d.includes('Read(./.env.*)') ? 0 : 1)"
```

## Hints

1. The shape is `{ "permissions": { "deny": ["..."] } }`.
2. Each entry is a tool name with a pattern in brackets.
3. The two entries to write are `Read(./.env)` and `Read(./.env.*)`.

## What you just learned

`.claude/settings.json` is committed, so a deny rule protects the whole team, not only you.
