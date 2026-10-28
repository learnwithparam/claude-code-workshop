import { describe, expect, it } from "vitest";
import type { ChatMessage } from "./api.ts";
import { remember } from "./history.ts";

describe("remember", () => {
  it("keeps the assistant question so the next turn answers it", () => {
    const history: ChatMessage[] = [{ role: "user", content: "a worksheet" }];
    remember(history, { event: "question", data: { text: "Which grade?" } });
    expect(history.at(-1)).toEqual({ role: "assistant", content: "Which grade?" });
  });

  it("shows an error but never sends it back as history", () => {
    const history: ChatMessage[] = [];
    expect(remember(history, { event: "error", data: { message: "busy" } })).toBe("busy");
    expect(history).toEqual([]);
  });
});
