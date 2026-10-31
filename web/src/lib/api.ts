import { type ChatEvent, eventSchemas, type Usage } from "@workshop/shared";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type { ChatEvent, Usage };

// The only config the browser has: where the API lives. No key, no secret, nothing else.
const API_URL: string = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8787";

const DRIFTED: ChatEvent = {
  event: "error",
  data: { message: "Something went wrong. Try again." },
};

function parseBlock(block: string): ChatEvent[] {
  const event = /^event: (.+)$/m.exec(block)?.[1];
  const data = /^data: (.+)$/m.exec(block)?.[1];
  if (!event || !data) return [];
  const schema = eventSchemas[event as keyof typeof eventSchemas];
  try {
    const parsed = schema?.safeParse(JSON.parse(data));
    return parsed?.success ? [{ event, data: parsed.data } as ChatEvent] : [DRIFTED];
  } catch {
    return [DRIFTED];
  }
}

export function parseSse(chunk: string): ChatEvent[] {
  return chunk.split("\n\n").flatMap(parseBlock);
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
