import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { agentEnv, parseAuthFlag, resolveAuth, runCap, TOKEN_ENV } from "./auth.ts";
import { loadPortable } from "./portable.ts";

const KEY = "ANTHROPIC_API_KEY";
const both = { [KEY]: "key-value", [TOKEN_ENV]: "token-value", PATH: "/bin" };
const resolve = (
  mode: "api-key" | "subscription" | "auto",
  env: Record<string, string | undefined>,
  o: { fileKey?: string; storedLogin?: boolean } = {},
) =>
  resolveAuth({
    mode,
    env,
    keyEnv: KEY,
    loadKey: () => o.fileKey,
    storedLogin: () => o.storedLogin ?? false,
  });

describe("resolveAuth", () => {
  it("api-key takes the key, from the environment or the key file", () => {
    expect(resolve("api-key", both)).toEqual({
      mode: "api-key",
      credential: { name: KEY, value: "key-value" },
    });
    expect(resolve("api-key", {}, { fileKey: "from-file" }).credential.value).toBe("from-file");
  });
  it("subscription takes the token and never reads the key file", () => {
    let read = false;
    const r = resolveAuth({
      mode: "subscription",
      env: both,
      keyEnv: KEY,
      loadKey: () => {
        read = true;
        return "k";
      },
      storedLogin: () => false,
    });
    expect(r).toEqual({
      mode: "subscription",
      credential: { name: TOKEN_ENV, value: "token-value" },
    });
    expect(read).toBe(false);
  });
  it("auto prefers the token, then the key", () => {
    expect(resolve("auto", both).mode).toBe("subscription");
    expect(resolve("auto", { [KEY]: "k" }).mode).toBe("api-key");
    expect(resolve("auto", {}, { fileKey: "f" }).mode).toBe("api-key");
  });
  it("names the fix, never a value, when the chosen credential is missing", () => {
    expect(() => resolve("subscription", { [KEY]: "key-value" })).toThrow(/claude setup-token/);
    expect(() => resolve("api-key", { [TOKEN_ENV]: "token-value" })).toThrow(/ANTHROPIC_API_KEY/);
    expect(() => resolve("api-key", { [TOKEN_ENV]: "token-value" })).not.toThrow(/token-value/);
  });
  it("auto with only a stored login says the isolated agents cannot use it", () => {
    expect(() => resolve("auto", {}, { storedLogin: true })).toThrow(/setup-token/);
    expect(() => resolve("auto", {}, { storedLogin: false })).toThrow(/no credential/);
  });
});

describe("agentEnv", () => {
  it("passes exactly the chosen credential, never both", () => {
    const key = agentEnv(resolve("api-key", both), both);
    expect(key[KEY]).toBe("key-value");
    expect(key[TOKEN_ENV]).toBeUndefined();
    const sub = agentEnv(resolve("subscription", both), both);
    expect(sub[TOKEN_ENV]).toBe("token-value");
    expect(sub[KEY]).toBeUndefined();
    expect(sub.PATH).toBe("/bin");
  });
  it("passes no credential when none was resolved", () => {
    const e = agentEnv(undefined, { ...both, ANTHROPIC_AUTH_TOKEN: "x" });
    expect(Object.keys(e)).toEqual(["PATH"]);
  });
});

describe("runCap", () => {
  const cap = { calls: 2, tokens: 100 };
  it("stops a subscription run at the call or token cap", () => {
    expect(runCap("subscription", cap, { calls: 1, tokens: 50 })).toBeUndefined();
    expect(runCap("subscription", cap, { calls: 2, tokens: 50 })).toMatch(/2 of 2 agent calls/);
    expect(runCap("subscription", cap, { calls: 1, tokens: 100 })).toMatch(/100 of 100 tokens/);
  });
  it("leaves an api-key run to the dollar cap", () => {
    expect(runCap("api-key", cap, { calls: 9, tokens: 999 })).toBeUndefined();
  });
});

describe("auth config and flag", () => {
  const withAuth = (line: string) => {
    const dir = mkdtempSync(join(tmpdir(), "auth-"));
    const f = join(dir, "config.yaml");
    writeFileSync(f, readFileSync(".factory/config.yaml", "utf8").replace(/^auth:.*$/m, line));
    return f;
  };
  it("the repo config names a mode and a subscription cap", () => {
    const p = loadPortable();
    expect(["api-key", "subscription", "auto"]).toContain(p.auth);
    expect(p.subscriptionCap.calls).toBeGreaterThan(0);
  });
  it("rejects an unknown mode in the config", () => {
    expect(loadPortable(withAuth("auth: auto")).auth).toBe("auto");
    expect(() => loadPortable(withAuth("auth: oauth"))).toThrow();
  });
  it("reads --auth= and rejects an unknown value", () => {
    expect(parseAuthFlag(["1", "--auth=subscription"])).toBe("subscription");
    expect(parseAuthFlag(["1"])).toBeUndefined();
    expect(() => parseAuthFlag(["--auth=both"])).toThrow();
  });
});
