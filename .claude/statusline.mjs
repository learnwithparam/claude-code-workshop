// The status line is a command: Claude Code sends the session as JSON on stdin and shows one line back.
import { pathToFileURL } from "node:url";

export function statusLine(session) {
  const model = String(session?.model?.display_name ?? "claude");
  const cost = Number(session?.cost?.total_cost_usd);
  return `${model} | $${(Number.isFinite(cost) ? cost : 0).toFixed(2)}`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  let session = {};
  try {
    session = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    // A bad payload still gets a line, because an empty status bar looks broken.
  }
  console.log(statusLine(session));
}
