# factory-status

A mod that draws the factory's newest run above the prompt: ticket, spend so far and the last line of its run log. It reads `.factory/runs/<ticket>/cost.json` and `run.log` after each turn and shows nothing when there is no run. Install it as a plugin folder, or run `claude --plugin-dir plugins/factory-status`. Check it with `claude plugin validate plugins/factory-status` and `claude plugin test plugins/factory-status`.
