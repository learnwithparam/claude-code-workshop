import type { EngineInterface, Register } from "claude-code";
import { atom, read, update } from "claude-code";

import type { Run } from "../types";

const run = atom({ plugin: "factory-status", key: "run" } as const, null);

// The factory writes .factory/runs/<ticket>/cost.json and run.log; the newest folder is the live run.
async function latest($: EngineInterface): Promise<Run | null> {
  try {
    const dirs = (await $.fs.list(".factory/runs")).filter((d) => d.kind === "dir");
    if (dirs.length === 0) return null;
    const newest = dirs.sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
    const base = `.factory/runs/${newest.name}`;
    const cost = JSON.parse(await $.fs.read(`${base}/cost.json`));
    const lines = String(await $.fs.read(`${base}/run.log`))
      .trim()
      .split("\n");
    return {
      ticket: newest.name,
      spendUsd: Number(cost.totalUsd ?? 0),
      last: lines[lines.length - 1] ?? "",
    };
  } catch {
    // No run yet, or a half-written file: show nothing rather than fail the turn.
    return null;
  }
}

export const register: Register = (on) => {
  on("session.start", async ($, e, next) => {
    await update($, run, () => null);
    return next(e);
  });

  on("turn.complete", async ($, e, next) => {
    const found = await latest($);
    await update($, run, () => found);
    return next(e);
  });

  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    const current = await read($, run);
    if (e.props.hasSurvey || current === null) return next(e);

    const { Box, Text } = $.ui.resolve(e);
    return (
      <Box>
        <Text dimColor>
          Factory #{current.ticket}: ${current.spendUsd.toFixed(2)} spent. {current.last}
        </Text>
      </Box>
    );
  });
};
