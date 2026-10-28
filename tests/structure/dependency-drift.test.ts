import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findDrift } from "../../scripts/dependencies.ts";

const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));

describe("dependency drift", () => {
  it("flags a package whose range differs between manifests", () => {
    const drift = findDrift({
      root: { devDependencies: { zod: "^4.1.0" } },
      api: { dependencies: { zod: "^4.2.0" } },
    });
    expect(drift).toEqual(["zod: ^4.1.0 in root vs ^4.2.0 in api"]);
  });

  it("passes matching ranges and skips internal packages", () => {
    expect(
      findDrift({
        root: { dependencies: { zod: "^4.1.0" } },
        web: { dependencies: { zod: "^4.1.0", "@workshop/shared": "*" } },
        api: { dependencies: { "@workshop/shared": "1.0.0" } },
      }),
    ).toEqual([]);
  });

  it("finds no drift across this repo's manifests", () => {
    const manifests = Object.fromEntries(
      ["package.json", "shared/package.json", "web/package.json", "api/package.json"].map((p) => [
        p,
        read(p),
      ]),
    );
    expect(findDrift(manifests)).toEqual([]);
  });
});
