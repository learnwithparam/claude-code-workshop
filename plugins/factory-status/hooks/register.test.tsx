import { expect, test } from "claude-code/testing";

const BAND = {
  plugin: "factory-status",
  component: "AbovePrompt",
  props: { hasSurvey: false },
  surface: "terminal",
} as const;

test("the band shows the newest run: ticket, spend and last line", async ($, on) => {
  on("session.start", (_, e) => ({ cwd: e.cwd }));
  on("turn.complete", () => ({ text: "" }));
  // The engine's state: one slot, versioned.
  let held: { value: unknown; version: number } = { value: null, version: 0 };
  on("state.get", () => ({ value: held }));
  on("state.set", (_, e) => {
    held = { value: e.value, version: held.version + 1 };
    return { value: held };
  });
  on("fs.list", () => ({
    value: [{ name: "7", kind: "dir", size: 0, mtimeMs: 2, isLink: false }],
  }));
  on("fs.read", (_, e) => ({
    value: String(e.path).endsWith("cost.json") ? '{"totalUsd":1.5}' : "a\nreview passed",
  }));

  await $.session.start({ cwd: "/", surface: "terminal", isInteractive: true });
  await $.turn.complete({ text: "" });
  const ui = await $.ui.mount(BAND);
  expect((await ui.find({ type: "Text" }))?.text).toMatch(/#7.*1\.50.*review passed/);
  await ui.unmount();
});

test("with no run the band draws nothing of its own", async ($, on) => {
  on("state.get", () => ({ value: { value: null, version: 0 } }));
  on("ui.render", ($, e) => {
    const { Text } = $.ui.resolve(e);
    return <Text>engine</Text>;
  });
  const ui = await $.ui.mount(BAND);
  expect((await ui.find({ type: "Text" }))?.text).toBe("engine");
  await ui.unmount();
});
