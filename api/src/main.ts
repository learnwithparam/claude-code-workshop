import Anthropic from "@anthropic-ai/sdk";
import { serve } from "@hono/node-server";
import { parseEnv } from "./env.ts";
import { createApp } from "./server.ts";

const env = parseEnv();
const app = createApp({ env, client: new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) });
serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => console.log(`api on :${port}`));
