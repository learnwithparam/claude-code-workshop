import { describe, expect, it } from "vitest";
import { BAND_IDS } from "../../../shared/src/bands";
import { renderWorksheet } from "../../../shared/src/render";
import type { Worksheet } from "../../../shared/src/schema";

// Recorded from the base commit. A refactor of render.ts must leave every byte of these files alone.
const sheetFor = (band: Worksheet["band"]): Worksheet => ({
  title: `Tom & "Jerry" <${band}>`,
  band,
  subject: "Reading & <Writing>",
  sections: [
    {
      heading: "Read <first>",
      instruction: 'Say "hi" & answer.',
      items: [
        { prompt: "Who ran? <b>", answer: "Tom & Jerry", picture: "cat <img>" },
        { prompt: "No picture here", answer: 'The "dog"' },
      ],
    },
    {
      heading: "Then write",
      instruction: "One line each.",
      items: [{ prompt: "Name a colour", answer: "Red", picture: "paint" }],
    },
  ],
});

describe("renderWorksheet golden", () => {
  for (const band of BAND_IDS) {
    it(`renders ${band}`, async () => {
      await expect(renderWorksheet(sheetFor(band))).toMatchFileSnapshot(
        `./__snapshots__/${band}.html`,
      );
    });
  }

  it("renders a single-item sheet", async () => {
    const sheet: Worksheet = {
      title: "T",
      band: "kindergarten",
      subject: "S",
      sections: [{ heading: "H", instruction: "I", items: [{ prompt: "P", answer: "A" }] }],
    };
    await expect(renderWorksheet(sheet)).toMatchFileSnapshot("./__snapshots__/single-item.html");
  });

  it("is deterministic", () => {
    expect(renderWorksheet(sheetFor("grade-1-2"))).toBe(renderWorksheet(sheetFor("grade-1-2")));
  });
});
