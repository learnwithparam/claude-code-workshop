import { defineConfig } from "astro/config";

// Static output only: no adapter, no server code, so no secret can ever run here.
export default defineConfig({ output: "static" });
