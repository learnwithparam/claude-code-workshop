# ADR: where learned templates live

This is a paper comparison. I benchmarked nothing, spent no tokens, and only grepped the repo to confirm no template storage exists yet.

**Decision: files.** Each template is stored as `templates/<id>.json` and validated with the shared zod schema on read and write.
- The api writes files atomically, to a temp file and then a rename.
- `<id>` is limited to `[a-z0-9-]`, which blocks path traversal.
- All access goes through one `api/` template-store module, so a later backend swap touches only that module.

**Why files:**
- The issue already names `templates/<id>.json`.
- The data is a few hundred small documents, written rarely by one writer.
- Files can be diffed, reviewed in a pull request and used as eval fixtures.
- They need no new dependency, secret or service.
- `web/` stays static and `api/` stays the only holder of secrets.

**Rejected:**
- **SQLite:** it adds a native dependency or an experimental Node flag, and its rows can't be diffed. We don't need queries at this scale. Revisit if we need to search across templates.
- **Hosted database:** it adds a secret, a network failure mode, cost and a vendor, and it breaks the no-setup test loop. Revisit if the api runs on several instances or templates become per-user.

**What this rules out:**
- Concurrent writers, such as several api instances.
- Cross-template queries beyond scanning the directory.
- Per-user templates.
- Writes from anything other than the api.

**Open risk:** templates created at run time need durable storage, because container disks are ephemeral. The deploy target needs a volume or a commit step.
