import type { FactoryConfig, StageName } from "./config.ts";

export type Size = "small" | "medium" | "large";
export type Risk = "low" | "medium" | "high";

// Triage reports SIZE and RISK. A missing or odd value is treated as the costly case.
export function parseTriage(text: string): { size: Size; risk: Risk } {
  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const v = new RegExp(`${key}:\\s*(\\w+)`, "i").exec(text)?.[1]?.toLowerCase();
    return allowed.find((a) => a === v) ?? fallback;
  };
  return {
    size: pick("SIZE", ["small", "medium", "large"], "medium"),
    risk: pick("RISK", ["low", "medium", "high"], "high"),
  };
}

// Spend the top model where a mistake is expensive, the bottom one where it is cheap.
// Only plan and build are routed; review and verify keep their configured model.
export function routeTicket(
  cfg: FactoryConfig,
  type: string,
  size: Size,
  risk: Risk,
): Partial<Record<StageName, string>> {
  const { high, mid, low } = cfg.tiers;
  if (type === "epic" || risk === "high") return { plan: high, build: mid };
  if (type === "docs" || (size === "small" && risk === "low")) return { plan: low, build: low };
  return { plan: mid, build: mid };
}
