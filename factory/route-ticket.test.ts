import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.ts";
import { parseTriage, routeTicket } from "./route-ticket.ts";

const cfg = loadConfig();
const { high, mid, low } = cfg.tiers;

describe("ticket routing", () => {
  it("sends epics and high risk to the top model for the plan", () => {
    expect(routeTicket(cfg, "epic", "large", "low").plan).toBe(high);
    expect(routeTicket(cfg, "bug", "small", "high").plan).toBe(high);
  });

  it("sends docs and small low-risk tickets to the cheap model", () => {
    expect(routeTicket(cfg, "docs", "large", "medium")).toEqual({ plan: low, build: low });
    expect(routeTicket(cfg, "bug", "small", "low")).toEqual({ plan: low, build: low });
  });

  it("uses the middle model for everything else", () => {
    expect(routeTicket(cfg, "feature", "medium", "medium")).toEqual({ plan: mid, build: mid });
  });

  it("treats a missing SIZE or RISK as medium size and high risk", () => {
    expect(parseTriage("TYPE: bug DECISION: proceed")).toEqual({ size: "medium", risk: "high" });
    expect(parseTriage("SIZE: small RISK: low")).toEqual({ size: "small", risk: "low" });
    expect(parseTriage("SIZE: huge RISK: bogus")).toEqual({ size: "medium", risk: "high" });
  });
});
