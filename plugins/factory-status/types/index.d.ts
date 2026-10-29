export type Run = { ticket: string; spendUsd: number; last: string };

declare module "claude-code" {
  interface PluginState {
    "factory-status": { run: Run | null };
  }
}
