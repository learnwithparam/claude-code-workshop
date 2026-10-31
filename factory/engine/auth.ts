import { spawnSync } from "node:child_process";
import { z } from "zod";

// How the agents reach the model: a Console API key billed per token, or a Pro/Max/Team plan's
// token from `claude setup-token`. docs/factory/auth-modes.md has the sources and what was tested.
export const authMode = z.enum(["api-key", "subscription", "auto"]);
export type AuthMode = z.infer<typeof authMode>;
export const TOKEN_ENV = "CLAUDE_CODE_OAUTH_TOKEN";
// The one resolved credential. Its value goes to the agent env and nowhere else.
export type Auth = {
  mode: "api-key" | "subscription";
  credential: { name: string; value: string };
};
export type SubscriptionCap = { calls: number; tokens: number };

const SETUP =
  "the agents run with a throwaway HOME, so a stored claude.ai login cannot reach them. " +
  `Run \`claude setup-token\` and export ${TOKEN_ENV} in this shell, or pass --auth=api-key.`;

export function resolveAuth(o: {
  mode: AuthMode;
  env: Record<string, string | undefined>;
  keyEnv: string;
  // Called only when the key is the chosen credential, so a subscription run never opens the key file.
  loadKey: () => string | undefined;
  storedLogin: () => boolean;
}): Auth {
  const token = o.env[TOKEN_ENV];
  const key = () => o.env[o.keyEnv] || o.loadKey();
  const sub = (value: string): Auth => ({
    mode: "subscription",
    credential: { name: TOKEN_ENV, value },
  });
  const api = (value: string): Auth => ({ mode: "api-key", credential: { name: o.keyEnv, value } });
  if (o.mode === "subscription") {
    if (token) return sub(token);
    throw new Error(`auth subscription: ${TOKEN_ENV} is not set; ${SETUP}`);
  }
  if (o.mode === "api-key") {
    const k = key();
    if (k) return api(k);
    throw new Error(`auth api-key: ${o.keyEnv} is not set and the key file does not define it`);
  }
  if (token) return sub(token);
  const k = key();
  if (k) return api(k);
  if (o.storedLogin()) throw new Error(`auth auto: found a claude.ai login but ${SETUP}`);
  throw new Error(
    `auth auto: no credential. Set ${TOKEN_ENV} (from \`claude setup-token\`) or ${o.keyEnv}.`,
  );
}

const BASE_ENV = ["PATH", "SHELL", "TERM", "LANG"];

// What the agent process inherits: a short allow-list plus exactly one credential. Every other
// credential variable in the runner's environment (the other mode's, ANTHROPIC_AUTH_TOKEN) stays out.
export function agentEnv(
  auth: Auth | undefined,
  source: Record<string, string | undefined>,
): Record<string, string> {
  const env: Record<string, string> = {};
  for (const k of BASE_ENV) {
    const v = source[k];
    if (v) env[k] = v;
  }
  if (auth) env[auth.credential.name] = auth.credential.value;
  return env;
}

// A plan has no dollar bill, so a subscription run stops on agent calls or tokens instead.
// Checked before each call; one call can still run past the token cap, bounded by its maxTurns.
export function runCap(
  mode: Auth["mode"] | undefined,
  cap: SubscriptionCap,
  used: { calls: number; tokens: number },
): string | undefined {
  if (mode !== "subscription") return undefined;
  if (used.calls >= cap.calls) return `subscription cap: ${used.calls} of ${cap.calls} agent calls`;
  if (used.tokens >= cap.tokens) return `subscription cap: ${used.tokens} of ${cap.tokens} tokens`;
  return undefined;
}

export function parseAuthFlag(argv: string[]): AuthMode | undefined {
  const a = argv.find((x) => x.startsWith("--auth="));
  return a === undefined ? undefined : authMode.parse(a.slice(7));
}

// True when `claude auth status` reports a login. Only the loggedIn field is read; nothing is printed.
export function storedLogin(): boolean {
  const r = spawnSync("claude", ["auth", "status", "--json"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  try {
    return z.object({ loggedIn: z.boolean() }).parse(JSON.parse(r.stdout)).loggedIn;
  } catch {
    return false;
  }
}
