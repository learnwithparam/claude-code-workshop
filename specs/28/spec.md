Feature: Activity kinds drawn by code and limited by band

Background:
Given the activity kinds are count, match, circle, fill-blank, trace, number-line, ten-frame, fraction-bar, table, steps and short
And the model only picks a kind and fills content
And shared code decides how each kind is drawn

Scenario: Count renders its items
Given a worksheet item of kind "count" with 5 pictures to count
When the worksheet is rendered
Then the item shows 5 pictures and one answer box

Scenario: Match renders two columns
Given a worksheet item of kind "match" with left "cat, dog, cow" and right "meow, woof, moo"
When the worksheet is rendered
Then the item shows 3 left entries and 3 right entries

Scenario: Circle renders choices
Given a worksheet item of kind "circle" with choices "2, 4, 6" and prompt "Circle the even number greater than 3"
When the worksheet is rendered
Then the item shows 3 choices to circle

Scenario: Fill-blank renders one blank
Given a worksheet item of kind "fill-blank" with text "3 + _ = 7"
When the worksheet is rendered
Then the item shows exactly 1 blank where "_" was

Scenario: Trace renders a tracing guide
Given a worksheet item of kind "trace" with text "cat"
When the worksheet is rendered
Then the item shows "cat" as a dotted tracing guide

Scenario: Number-line renders its range
Given a worksheet item of kind "number-line" from 0 to 10 with the start at 3
When the worksheet is rendered
Then the item shows a line with 11 ticks labelled 0 to 10

Scenario: Ten-frame renders filled cells
Given a worksheet item of kind "ten-frame" with 7 filled cells
When the worksheet is rendered
Then the item shows 10 cells, 7 filled and 3 empty

Scenario: Fraction-bar renders shaded parts
Given a worksheet item of kind "fraction-bar" with 3 of 4 parts shaded
When the worksheet is rendered
Then the item shows a bar of 4 parts with 3 shaded

Scenario: Table renders rows and columns
Given a worksheet item of kind "table" with 3 columns and 2 rows
When the worksheet is rendered
Then the item shows a header row and 2 body rows of 3 cells each

Scenario: Steps renders numbered steps
Given a worksheet item of kind "steps" with 3 steps
When the worksheet is rendered
Then the item shows steps numbered 1, 2 and 3 in order

Scenario: Short renders an answer space
Given a worksheet item of kind "short" with prompt "Why is the sky blue?"
When the worksheet is rendered
Then the item shows the prompt and a writing space for the answer

Scenario: checkBand accepts an allowed kind
Given a band that allows the kind "count"
And a worksheet whose items are all of kind "count"
When checkBand runs
Then it reports no errors

Scenario: checkBand rejects a disallowed kind
Given a band that does not allow the kind "table"
And a worksheet with one item of kind "table"
When checkBand runs
Then it reports an error naming the kind "table" and the band

Scenario: Unknown kind fails schema validation
Given a model tool input with an item of kind "puzzle"
When the input is validated with zod
Then validation fails and no worksheet is rendered

Scenario: Every item appears exactly once (property)
Given any valid worksheet with N items of any mix of the 11 kinds, for N from 1 to 20
When the worksheet is rendered
Then each item id appears exactly once in the output
And the number of rendered items equals N

Scenario: Kind choice is the only layout input from the model
Given a model tool input that includes layout fields such as font size or position
When the input is validated with zod
Then the layout fields are rejected or ignored
And the rendered layout comes from the band table
