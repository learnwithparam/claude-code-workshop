export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Usage = {
  input: number;
  cacheRead: number;
  cacheWrite: number;
  output: number;
  costUsd: number;
};
export type ChatEvent =
  | { event: "question"; data: { text: string } }
  | { event: "worksheet"; data: { html: string } }
  | { event: "usage"; data: Usage }
  | { event: "error"; data: { message: string } };

// The only config the browser has: where the API lives. No key, no secret, nothing else.
const API_URL: string = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8787";

export function parseSse(chunk: string): ChatEvent[] {
  return chunk.split("\n\n").flatMap((block) => {
    const event = /^event: (.+)$/m.exec(block)?.[1];
    const data = /^data: (.+)$/m.exec(block)?.[1];
    return event && data ? [{ event, data: JSON.parse(data) } as ChatEvent] : [];
  });
}

export async function* chat(messages: ChatMessage[]): AsyncGenerator<ChatEvent> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok || !res.body) {
    yield { event: "error", data: { message: "The service is busy. Try again soon." } };
    return;
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const cut = buffer.lastIndexOf("\n\n");
    if (cut === -1) continue;
    yield* parseSse(buffer.slice(0, cut + 2));
    buffer = buffer.slice(cut + 2);
  }
}
