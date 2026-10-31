import { execFileSync } from "node:child_process";

const status = () => execFileSync("gh", ["auth", "status"], { stdio: "ignore" });

// The runner calls gh for approvals and agents never hold a login, so a missing one would read as
// "nobody approved". Fail before the first agent with a message that says what to do.
export function ghPreflight(run: () => unknown = status) {
  try {
    run();
  } catch {
    throw new Error(
      "gh is not logged in or not installed: run `gh auth login`, then start the run again",
    );
  }
}
