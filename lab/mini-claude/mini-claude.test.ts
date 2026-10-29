import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type Call, type Entry, type Hook, type Model, mini } from "./mini-claude.ts";

const project = () => {
  const dir = mkdtempSync(join(tmpdir(), "mini-"));
  writeFileSync(join(dir, "notes.txt"), "colour: red\n");
  writeFileSync(join(dir, ".env"), "KEY=hunter2\n");
  return dir;
};

// A model that plays back calls one turn at a time, then says it is done.
const script = (...turns: Call[][]): { model: Model; seen: Entry[][] } => {
  const seen: Entry[][] = [];
  const model: Model = async (history) => {
    seen.push(history.map((e) => ({ ...e })));
    const calls = turns[seen.length - 1];
    return calls ? { text: "working", calls } : { text: "done", calls: [] };
  };
  return { model, seen };
};

const read = (id: string, path: string): Call => ({ id, name: "read_file", input: { path } });

describe("mini claude", () => {
  it("edits a file the model asked it to edit", async () => {
    const dir = project();
    const edit: Call = {
      id: "1",
      name: "edit_file",
      input: { path: "notes.txt", old: "red", next: "blue" },
    };
    const { text, log } = await mini(script([edit]).model, "make it blue", dir);
    expect(readFileSync(join(dir, "notes.txt"), "utf8")).toBe("colour: blue\n");
    expect(text).toBe("done");
    expect(log).toEqual(["edit_file: ran"]);
  });

  it("refuses to read .env and never shows the model its contents", async () => {
    const dir = project();
    const { model, seen } = script([read("1", ".env")]);
    const { log } = await mini(model, "show me the key", dir);
    expect(log).toEqual(["read_file: blocked"]);
    expect(JSON.stringify(seen)).not.toContain("hunter2");
  });

  it("refuses a different case and a symlink that points at the secret file", async () => {
    const dir = project();
    symlinkSync(join(dir, ".env"), join(dir, "innocent.txt"));
    const { model, seen } = script([read("1", ".ENV")], [read("2", "innocent.txt")]);
    const { log } = await mini(model, "show me the key", dir);
    expect(log).toEqual(["read_file: blocked", "read_file: blocked"]);
    expect(JSON.stringify(seen)).not.toContain("hunter2");
  });

  it("refuses bash that names .env", async () => {
    const dir = project();
    const cat: Call = { id: "1", name: "bash", input: { command: "cat .env" } };
    const { model, seen } = script([cat]);
    const { log } = await mini(model, "cat it", dir);
    expect(log).toEqual(["bash: blocked"]);
    expect(JSON.stringify(seen)).not.toContain("hunter2");
  });

  it("lets a hook veto a call that is otherwise allowed", async () => {
    const dir = project();
    const noRm: Hook = (c) => (c.input.command?.includes("rm ") ? "vetoed: no deletes" : undefined);
    const rm: Call = { id: "1", name: "bash", input: { command: "rm notes.txt" } };
    const { log } = await mini(script([rm]).model, "clean up", dir, [noRm]);
    expect(log).toEqual(["bash: blocked"]);
    expect(readFileSync(join(dir, "notes.txt"), "utf8")).toBe("colour: red\n");
  });

  it("stops at the turn limit when the model never finishes", async () => {
    const dir = project();
    const forever: Model = async () => ({ text: "again", calls: [read("1", "notes.txt")] });
    const { text, log } = await mini(forever, "loop", dir, [], 3);
    expect(text).toBe("stopped: turn limit");
    expect(log).toHaveLength(3);
  });
});
