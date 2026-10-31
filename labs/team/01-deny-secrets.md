# Deny what Claude must never read

**Pairs with:** `docs/levels/boundary.md`

## Goal

Write a settings file that denies reading `.env` files, so the rule holds for everyone who clones the repo.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
2. Read the real one: `cat .claude/settings.json`.
3. Make the folder: `mkdir -p .labs/work`.
4. Write `.labs/work/settings.json` with a `permissions.deny` list that blocks `Read(./.env)` and `Read(./.env.*)`.
5. Check it is valid JSON: `node -e "JSON.parse(require('fs').readFileSync('.labs/work/settings.json','utf8'))"`.

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
