Feature: Learn templates from good renders and cache them

Background:
Given the api holds ANTHROPIC_API_KEY and the model is Claude Haiku 5.5
And the cache and template store are empty

Scenario: A repeat prompt in the same band spends zero tokens
Given the prompt "Fractions worksheet" for band "grade 3" was answered once
When the same prompt "Fractions worksheet" is sent for band "grade 3"
Then the model is called 0 times
And the response reports 0 output tokens

Scenario: A cache hit returns the identical worksheet
Given the prompt "Fractions worksheet" for band "grade 3" returned a worksheet titled "Fractions Practice"
When the same prompt is sent again for band "grade 3"
Then the worksheet event is deeply equal to the first worksheet

Scenario: Case and spacing do not change the cache key
Given the prompt "Fractions worksheet" for band "grade 3" was answered once
When the prompt " FRACTIONS Worksheet " is sent for band "grade 3"
Then the model is called 0 times

Scenario: Trailing punctuation does not change the cache key
Given the prompt "Fractions worksheet" for band "grade 3" was answered once
When the prompt "fractions worksheet!" is sent for band "grade 3"
Then the model is called 0 times

Scenario: The same prompt in another band is a cache miss
Given the prompt "Fractions worksheet" for band "grade 3" was answered once
When the prompt "Fractions worksheet" is sent for band "grade 5"
Then the model is called 1 time

Scenario: A different prompt in the same band is a cache miss
Given the prompt "Fractions worksheet" for band "grade 3" was answered once
When the prompt "Spelling worksheet" is sent for band "grade 3"
Then the model is called 1 time

Scenario: An unclear grade still gets one question and no cache lookup
Given the prompt "Make a worksheet" names no grade
When the prompt "Make a worksheet" is sent
Then the agent asks exactly 1 question about the grade
And the cache is not read or written

Scenario: A failed generation is not cached
Given the model returns tool input that fails the schema for the prompt "Fractions worksheet" in band "grade 3"
When the same prompt is sent again for band "grade 3"
Then the model is called 1 time on the second request

Scenario: Marking a sheet good stores a template
Given a rendered sheet with sheetId "s-1" for the prompt "Fractions worksheet" in band "grade 3"
When the sheet "s-1" is marked good
Then 1 template exists for band "grade 3"
And the template records the sheet's layout and its content slots

Scenario: A template holds slots and no filled content
Given the sheet "s-1" with the item text "What is 1/2 + 1/4?" is marked good
When the template is read
Then the slot for that item is empty
And the string "What is 1/2 + 1/4?" does not appear anywhere in the template

Scenario: Marking the same sheet good twice keeps one template
Given the sheet "s-1" is already marked good
When the sheet "s-1" is marked good again
Then 1 template exists for band "grade 3"

Scenario: A sheet that fails the shared check cannot be marked good
Given a stored sheet "s-2" that fails the shared check for band "grade 3"
When the sheet "s-2" is marked good
Then the response status is 422
And no template is created

Scenario: Marking an unknown sheet good is refused
When the sheet "s-missing" is marked good
Then the response status is 404
And no template is created

Scenario: Mark-good body is validated with zod
When a mark-good request is sent with the body {"sheetId": 7}
Then the response status is 400
And no template is created

Scenario: A matching request fills only the slots
Given a template for the prompt "Fractions worksheet" in band "grade 3" with 6 empty item slots
When the prompt "Fractions worksheet about thirds" is sent for band "grade 3"
Then the model is called 1 time
And the tool schema offered to the model contains only the 6 item slots
And the tool schema contains no layout fields

Scenario: A template fill is rendered with the template's layout
Given a template with 6 item slots for band "grade 3"
When the model fills the 6 slots
Then the worksheet uses the template's layout
And the layout is decided by shared code, not by the model

Scenario: A template fill with a missing slot is rejected
Given a template with 6 item slots for band "grade 3"
When the model returns content for 5 slots
Then the worksheet event is not sent
And the customer sees a generic error

Scenario: A template never exceeds the band's item limit
Given a template with 8 item slots and band "grade 3" allows at most 6 items
When the template is matched to a request for band "grade 3"
Then the template is not used
And the model generates the worksheet in full

Scenario: A template from another band is never matched
Given a template exists only for band "grade 5"
When the prompt "Fractions worksheet" is sent for band "grade 3"
Then the template is not used
And the model generates the worksheet in full

Scenario: A request with no matching template generates in full
Given no template exists for band "grade 3"
When the prompt "Fractions worksheet" is sent for band "grade 3"
Then the model is called 1 time
And the tool schema offered to the model contains the full worksheet schema

Scenario: An exact cache hit wins over a matching template
Given the prompt "Fractions worksheet" for band "grade 3" is cached
And a template exists for band "grade 3"
When the same prompt is sent for band "grade 3"
Then the model is called 0 times

Scenario: A template fill is cached for the next repeat
Given a template exists for band "grade 3"
And the prompt "Fractions worksheet about thirds" was answered through that template
When the same prompt is sent again for band "grade 3"
Then the model is called 0 times

Scenario: The eval shows fewer output tokens with a template
Given the eval runs the prompt "Fractions worksheet" for band "grade 3" once without a template
And the eval runs it once with a template distilled from a good sheet
When the eval compares the two runs
Then the output tokens with the template are fewer than without it
And the eval fails if they are not fewer

Scenario: The eval reports both token counts
When the eval finishes the template comparison
Then the report lists output tokens without a template and output tokens with a template as two numbers

Scenario: Customer errors never expose internals
Given the model call fails with a 529 overloaded error
When the prompt "Fractions worksheet" is sent for band "grade 3"
Then the error message shown to the customer is generic
And it contains no model name, no token count and no stack trace

Scenario: The browser never sees the API key or cache internals
When the web build output is searched
Then it contains no ANTHROPIC_API_KEY value
And the only environment variable web reads is PUBLIC_API_URL

Scenario: Live eval spend counts against the $60 cap
Given $59.90 of the $60 live-run cap is already spent
When the eval is asked to run a live comparison estimated at $0.50
Then the eval does not call the model
And it reports that the budget cap would be exceeded
