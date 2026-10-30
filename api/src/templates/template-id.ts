import { z } from "zod";

// An allowlist of filename-safe characters: no separator, dot, NUL or `%` can reach a
// `templates/<id>.json` path. Wider than the 16 hex chars the api issues, so an unknown but
// well-formed id still gets the 404 the cache contract (specs/35) promises.
export const templateIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
