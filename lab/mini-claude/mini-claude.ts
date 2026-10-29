import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

export type Call = {
  id: string;
  name: "read_file" | "edit_file" | "bash";
  input: Record<string, string>;
};
export type Turn = { text: string; calls: Call[] };
export type Entry = { role: "user" | "assistant" | "tool"; text: string };
// The model is any function from the chat so far to the next turn: the real API, or a script in a test.
export type Model = (history: Entry[]) => Promise<Turn>;
// A hook sees a call before it runs and returns a reason to veto it, as a PreToolUse hook does.
export type Hook = (call: Call) => string | undefined;

const SECRET_FILE = /^\.env(\..+)?$/;
const SECRET_IN_COMMAND = /(^|[\s/="'])\.env(\.\w+)?(?=$|[\s"';|&])/;

// Deny rules come first and cannot be talked around: the model's wording never reaches them.
export function denied(call: Call): string | undefined {
  const { path = "", command = "" } = call.input;
  if (call.name !== "bash" && SECRET_FILE.test(basename(path)))
    return "denied: .env files are off limits";
  if (call.name === "bash" && SECRET_IN_COMMAND.test(command))
    return "denied: .env files are off limits";
  return undefined;
}

function run(call: Call, cwd: string): string {
  const { path = "", old = "", next = "", command = "" } = call.input;
  if (call.name === "bash") {
    try {
      return execFileSync("sh", ["-c", command], { cwd, encoding: "utf8", timeout: 10_000 });
    } catch (e) {
      return `exit error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  const file = resolve(cwd, path);
  if (!file.startsWith(`${resolve(cwd)}/`)) return "denied: path is outside the project";
  const text = readFileSync(file, "utf8");
  if (call.name === "read_file") return text;
  if (text.split(old).length !== 2) return "edit failed: old text must appear exactly once";
  writeFileSync(
    file,
    text.replace(old, () => next),
  );
  return "ok";
}

export async function mini(
  model: Model,
  task: string,
  cwd: string,
  hooks: Hook[] = [],
  maxTurns = 8,
) {
  const history: Entry[] = [{ role: "user", text: task }];
  const log: string[] = [];
  for (let turn = 0; turn < maxTurns; turn++) {
    const reply = await model(history);
    history.push({ role: "assistant", text: reply.text });
    if (reply.calls.length === 0) return { text: reply.text, log };
    for (const call of reply.calls) {
      const veto = denied(call) ?? hooks.map((h) => h(call)).find(Boolean);
      const result = veto ?? run(call, cwd);
      log.push(`${call.name}: ${veto ? "blocked" : "ran"}`);
      history.push({ role: "tool", text: result });
    }
  }
  return { text: "stopped: turn limit", log };
}
