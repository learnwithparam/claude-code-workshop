Feature: Learn templates from good renders and cache them

Background:
Given the API is running with an empty cache and no templates
And the model is stubbed to report token usage

Scenario: First request is a cache miss and calls the model
Given no cache entry exists for prompt "fractions worksheet" and band "grade-2"
When a client sends the prompt "fractions worksheet" for band "grade-2"
Then the model is called exactly 1 time
And the response contains a worksheet

Scenario: Repeat prompt is served from cache with zero tokens
Given the prompt "fractions worksheet" for band "grade-2" was already answered
When a client sends the prompt "fractions worksheet" for band "grade-2" again
Then the model is called 0 times
And the reported output tokens are 0
And the worksheet is identical to the first response

Scenario: Prompt is normalised before the cache lookup
Given the prompt "fractions worksheet" for band "grade-2" was already answered
When a client sends the prompt `"  FRACTIONS   Worksheet "` for band "grade-2"
Then the model is called 0 times

Scenario: Same prompt in a different band is a cache miss
Given the prompt "fractions worksheet" for band "grade-2" was already answered
When a client sends the prompt "fractions worksheet" for band "grade-5"
Then the model is called exactly 1 time

Scenario: A clarifying question is not cached
Given the prompt "make a worksheet" has no clear grade
When the agent replies with one question about the grade
Then no cache entry is written for "make a worksheet"

Scenario: A worksheet that fails the shared check is not cached
Given the model returns a worksheet that fails the shared check for band "grade-2"
When the request finishes
Then no cache entry is written
And the customer sees a generic error message

Scenario: Marking a sheet good distils a template
Given a worksheet for "fractions worksheet" at band "grade-2" was rendered
When a client marks that worksheet as good
Then exactly 1 template exists for band "grade-2"
And the template keeps the section order and activity kinds of that worksheet
And every content field of the template is a named slot

Scenario: Marking the same sheet good twice keeps one template
Given a template was distilled from the worksheet "fractions worksheet" at band "grade-2"
When a client marks that worksheet as good again
Then exactly 1 template exists for band "grade-2"

Scenario: A matching request fills only the slots
Given a template exists for band "grade-2" with slot "title"
When a client sends the prompt "subtraction worksheet" for band "grade-2"
Then the model is called exactly 1 time with the template slots as its only tool input
And the response worksheet has the template's section order
And the slot "title" holds model-written text

Scenario: Slot input is validated with zod
Given a template exists for band "grade-2" with slot "title"
When the model returns slot input with a numeric "title" of 7
Then the request fails with a generic error message
And the message names no model, token count or stack trace
And nothing is written to the cache

Scenario: No template for the band falls back to full generation
Given a template exists only for band "grade-5"
When a client sends the prompt "subtraction worksheet" for band "grade-2"
Then the model generates the full worksheet without a template

Scenario: Template fill is cached like any other result
Given the prompt "subtraction worksheet" for band "grade-2" was filled from a template
When a client sends the prompt "subtraction worksheet" for band "grade-2" again
Then the model is called 0 times

Scenario: Eval shows fewer output tokens with a template
Given the eval runs the prompt "subtraction worksheet" for band "grade-2" without a template and records output tokens as N
When the eval runs the same prompt with a matching template and records output tokens as M
Then M is less than N

Scenario: Cache hits do not spend the live-run cap
Given the live-run spend is 10 dollars of the 60 dollar cap
When a client sends a prompt that hits the cache
Then the live-run spend is still 10 dollars

Scenario: Live calls stop at the cap
Given the live-run spend is 60 dollars of the 60 dollar cap
When a client sends a prompt that misses the cache
Then the model is called 0 times
And the customer sees a generic error message
