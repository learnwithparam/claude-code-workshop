# Threat model: template id path traversal (issue 37)

## Scope

- **Workflow:** `security`.
- **Concern:** a template id that becomes part of a filesystem path, `templates/<id>.json`, must not be able to leave `templates/`.
- **Current tree:** `api/src/templates/template-store.ts` appears to be in-memory. A grep found no `templates/<id>.json` file read or write in `api/`. The route `POST /templates/good` in `api/src/server.ts:79` takes `{ sheetId }`, not a template id. Before the plan is approved, confirm where an id first reaches a path. The model below covers that point wherever it is.

## Attacker

An unauthenticated remote caller of the public API. This also covers anyone who can get a crafted id into a stored or derived template, such as through a prompt that is normalised into an id. The attacker needs no account. The only gates are the per-IP rate limit and the daily budget in `admit`.

## Assets

1. Files outside `templates/` on the API host that the process can read or overwrite. The main one is `ANTHROPIC_API_KEY`, which lives only in the api process environment and possibly in `.env*` files.
2. Integrity of the learned-template set. A template drives layout and content for later worksheets.
3. Availability of the API process.
4. The $60 live-run cap, which a crashed or looping process could burn.

## Entry point

Any id, name or key that is joined into `templates/<id>.json`. The candidates are the HTTP body, a path or query parameter, and a model- or prompt-derived key. Each one is untrusted. A value such as `../x`, an absolute path, a path with a separator or NUL byte, or an encoded variant of those must be rejected before it reaches the filesystem.

## STRIDE

| Category                   | Applies  | Threat                                                                                                                                       | Required control                                                                                                                             |
| -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **S**poofing               | Low      | An attacker names an id that belongs to another template.                                                                                    | Out of scope. Ids are not identities.                                                                                                        |
| **T**ampering              | **High** | A write to `templates/<id>.json` lands outside `templates/` and overwrites a file.                                                           | Validate the id at the boundary with zod. Accept only a strict allowlist pattern with a length cap. Reject anything else with a generic 400. |
| **R**epudiation            | Low      | Rejected ids leave no trace.                                                                                                                 | Log the rejection server-side without echoing the raw id into customer output.                                                               |
| **I**nformation disclosure | **High** | A read of `templates/../..` returns files outside the directory, such as the env file or source. Error text could also leak a path or stack. | The same boundary validation. The error body stays generic, with no path, stack or model name.                                               |
| **D**enial of service      | Medium   | A traversal id points at a directory or a huge or special file and crashes or stalls the process. Oversized ids add to this.                 | The length cap and allowlist. A fixed, resolved base directory. A missing template returns 404, not a 500.                                   |
| **E**levation of privilege | Medium   | An overwrite of code or config that is later executed, which turns a file write into code execution.                                         | Reject at the boundary. As defence in depth, resolve the final path and assert it stays under the templates directory.                       |

## Required properties

- The id is validated with zod at the first boundary it crosses. No unvalidated id reaches a path join.
- The schema is a positive allowlist, not a blocklist of `..`.
- A failing test using a traversal id exists before the fix. It covers at least `../x`, an absolute path, a path with a separator, and an encoded variant. It also proves that a valid id still works.
- Rejection is a generic 400 with no internal detail.
- No new dependency, no widened permission, and no change to the secret boundary.

## Out of scope

- Exploit payload catalogues.
- Authentication or authorisation redesign.
- Rate limits beyond the existing `admit`.

## Residual risk

If a second path-joining site exists, such as a loader or an eval script, the fix must cover it too. The plan stage should list every site.
