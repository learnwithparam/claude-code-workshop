---

name: worksheet-bands
description: Choose and apply a grade band when creating or changing a worksheet. Use when a task mentions a grade, age, band, font size, item limit or picture boxes.
---

1. Read `shared/src/bands.ts`. The table is the source of truth for font, size and limits.
2. Map the learner to a band with `parseBand`. If it returns null, ask one question.
3. Stay at or under `maxItems` and `maxWordsPerItem`. Add a picture idea when `pictureBoxes` is true.
4. Run `checkBand` on the result. Fix every problem it lists before showing the worksheet.
