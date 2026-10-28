import type { ChatEvent, ChatMessage } from "./api.ts";

// What the page shows and what it sends back next turn must match. Drop the assistant's question
// from history and the agent asks it again forever.
export function remember(history: ChatMessage[], ev: ChatEvent): string | null {
  if (ev.event === "question") {
    history.push({ role: "assistant", content: ev.data.text });
    return ev.data.text;
  }
  if (ev.event === "worksheet") {
    history.push({ role: "assistant", content: "Here is your worksheet." });
    return "Here is your worksheet.";
  }
  return ev.event === "error" ? ev.data.message : null;
}
