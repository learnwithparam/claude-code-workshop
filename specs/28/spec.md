Feature: Activity kinds on a worksheet

Background:
Given the activity kinds are count, match, circle, fill-blank, trace, number-line, ten-frame, fraction-bar, table, steps and short
And the band table in shared/src/bands.ts lists the kinds each band may use
And the model only names a kind and supplies content, while code draws it

Scenario: Count draws one picture group per item
Given a kindergarten worksheet with a count activity of items "3 apples" and "5 stars"
When the worksheet is rendered
Then the output contains a group of 3 apples and a group of 5 stars
And each group is followed by one answer box

Scenario: Match pairs a left column with a right column
Given a grade-1-2 worksheet with a match activity of pairs "cat" to "meow" and "dog" to "woof"
When the worksheet is rendered
Then the left column shows "cat" and "dog" in the given order
And the right column shows "meow" and "woof"
And one connector dot sits beside each entry

Scenario: Circle marks the choices to pick from
Given a kindergarten worksheet with a circle activity with prompt "Circle the red one" and choices "red ball", "blue ball" and "green ball"
When the worksheet is rendered
Then the output shows 3 choices, each inside a circle target
And the prompt "Circle the red one" appears above them

Scenario: Fill-blank renders a blank where the marker is
Given a grade-3-5 worksheet with a fill-blank activity with the sentence "The cat sat on the _**"
    When the worksheet is rendered
    Then the output shows "The cat sat on the" followed by one blank line
    And the marker "**_" is not printed

Scenario: Trace draws dotted letters
Given an early-reader worksheet with a trace activity of item "A"
When the worksheet is rendered
Then the output shows "A" in dotted outline at 30px Nunito
And a row of empty practice lines sits below it

Scenario: Number-line draws ticks between start and end
Given a grade-1-2 worksheet with a number-line activity from 0 to 10 with step 1
When the worksheet is rendered
Then the line has 11 ticks labelled 0 through 10

Scenario: Ten-frame shades the given count
Given a kindergarten worksheet with a ten-frame activity of items with values 4 and 7
When the worksheet is rendered
Then the first frame has 10 cells with 4 filled
And the second frame has 10 cells with 7 filled

Scenario: Fraction-bar shades the numerator
Given a grade-3-5 worksheet with a fraction-bar activity of item 3 over 4
When the worksheet is rendered
Then the bar has 4 equal parts with 3 shaded

Scenario: Table renders headers and rows
Given a grade-6-8 worksheet with a table activity of headers "Item" and "Cost" and 3 rows
When the worksheet is rendered
Then the table has 2 header cells and 3 body rows
And every row has 2 cells

Scenario: Steps numbers the lines in order
Given a grade-6-8 worksheet with a steps activity of "Mix", "Heat" and "Cool"
When the worksheet is rendered
Then the output shows "1. Mix", "2. Heat" and "3. Cool" in that order

Scenario: Short gives a short-answer box
Given a grade-9-12 worksheet with a short activity with the question "Why did the Roman Republic fall?"
When the worksheet is rendered
Then the output shows the question followed by 3 answer lines

Scenario: A band refuses a kind it does not allow
Given an early-reader worksheet whose activity kind is "table"
When checkBand runs
Then the result is not ok
And a problem names the kind "table" and the band "early-reader"

Scenario: A band accepts a kind it allows
Given an early-reader worksheet whose activity kind is "count" with 4 items
When checkBand runs
Then the result is ok
And the problems list is empty

Scenario: An unknown kind is rejected at the boundary
Given a model tool input with activity kind "crossword"
When the worksheet schema parses it
Then parsing fails
And no worksheet is rendered

Scenario: Item count over the band limit is still reported
Given a kindergarten worksheet with a count activity of 9 items
When checkBand runs
Then a problem reads "9 items, band allows 8"

Scenario Outline: Every item appears exactly once for each kind
Given a worksheet of kind "<kind>" with <n> distinct items in a band that allows it
When the worksheet is rendered
Then each of the <n> items appears exactly once in the output
And no item is dropped
And no item is repeated

    Examples:
      | kind        | n |
      | count       | 5 |
      | match       | 4 |
      | circle      | 3 |
      | fill-blank  | 4 |
      | trace       | 3 |
      | number-line | 2 |
      | ten-frame   | 2 |
      | fraction-bar| 3 |
      | table       | 3 |
      | steps       | 4 |
      | short       | 3 |

Scenario: Every item appears exactly once for any generated worksheet
Given any worksheet generated with fast-check whose kind is allowed by its band and whose item count is within the band limit
When the worksheet is rendered
Then every item appears exactly once in the output
And the count of rendered items equals the count of input items
