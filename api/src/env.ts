import { z } from "zod";

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(20),
  ALLOWED_ORIGIN: z.string().url().default("http://localhost:4321"),
  DAILY_BUDGET_USD: z.coerce.number().positive().default(1),
  PORT: z.coerce.number().int().default(8787),
});
export type Env = z.infer<typeof envSchema>;

// The only place a secret is read. Fails at boot, and never echoes a value.
export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error(`Invalid environment: ${names.join(", ")}`);
  }
  return result.data;
}
