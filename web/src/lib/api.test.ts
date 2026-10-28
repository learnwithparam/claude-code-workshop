import { describe, expect, it } from "vitest";
import { parseSse } from "./api.ts";

describe("parseSse", () => {
  it("reads event and data pairs", () => {
    const events = parseSse('event: question\ndata: {"text":"Which grade?"}\n\n');
    expect(events).toEqual([{ event: "question", data: { text: "Which grade?" } }]);
  });
});
