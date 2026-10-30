Feature: Learn templates from good renders and cache them

Background:
Given the chat agent is Claude Haiku 5.5
And the cache and the template store are empty

Scenario: A repeat prompt is served from the exact cache
Given the prompt "Fractions worksheet" for grade 3 was answered once and cached
When the same prompt "Fractions worksheet" is sent for grade 3
Then the model is called 0 times
And 0 input tokens and 0 output tokens are spent
And the worksheet returned is identical to the cached one

Scenario: The cache key ignores case and surrounding whitespace
Given the prompt "Fractions worksheet" for grade 3 was answered and cached
When the prompt " fractions WORKSHEET " is sent for grade 3
Then the model is called 0 times
And the cached worksheet is returned

Scenario: The cache key includes the band
Given the prompt "Fractions worksheet" for grade 3 was answered and cached
When the prompt "Fractions worksheet" is sent for grade 7
Then the cache misses
And the model is called once

Scenario: A different prompt in the same band misses the cache
Given the prompt "Fractions worksheet" for grade 3 was answered and cached
When the prompt "Spelling worksheet" is sent for grade 3
Then the cache misses
And the model is called once

Scenario: Two grades in the same band share a cache entry
Given the prompt "Fractions worksheet" for grade 3 was answered and cached
When the prompt "Fractions worksheet" is sent for another grade that maps to the same band as grade 3
Then the model is called 0 times
And the cached worksheet is returned

Scenario: A clarifying question is not cached
Given the prompt "Make a worksheet" has no clear grade
When the prompt is sent and the agent asks "Which grade is this for?"
Then nothing is written to the cache

Scenario: An invalid model reply is not cached
Given the model returns a worksheet that fails the shared schema check
When the request finishes
Then nothing is written to the cache
And the customer sees a generic error with no model name or token count

Scenario: Marking a sheet good distills a template
Given a rendered worksheet for the prompt "Fractions worksheet" at grade 3
When the sheet is marked good
Then one template is stored for that prompt and band
And the template keeps the layout and fixed text
And the template lists the slots the model must fill, such as item text and answers

Scenario: Marking the same sheet good twice stores one template
Given a sheet already marked good and distilled into a template
When the same sheet is marked good again
Then the template store still holds exactly 1 template for that prompt and band

Scenario: Marking an unknown sheet good is rejected
When a request marks sheet id "does-not-exist" good
Then the response is 404
And no template is stored

Scenario: The mark-good request body is validated
When a request to mark a sheet good has an empty body
Then the response is 400
And no template is stored

Scenario: A matching request fills only the slots
Given a template exists for "Fractions worksheet" at grade 3
And the exact cache has no entry for the prompt "Fractions worksheet with 5 items"
When the prompt "Fractions worksheet with 5 items" is sent for grade 3
Then the model is asked to fill only the template slots
And the model is not asked to produce layout
And the returned worksheet passes the shared schema check

Scenario: A request with no matching template runs the full flow
Given a template exists for "Fractions worksheet" at grade 3
When the prompt "Spelling worksheet" is sent for grade 3
Then the model produces the whole worksheet

Scenario: A template from another band is not used
Given a template exists for "Fractions worksheet" at grade 3
When the prompt "Fractions worksheet" is sent for grade 7
Then the model produces the whole worksheet

Scenario: Slot output that fails validation is rejected
Given a template exists with an item slot
When the model returns slot content that fails zod validation
Then the customer sees a generic error
And nothing is written to the cache

Scenario: Slot-filled output is still laid out by the band rules
Given a template for grade 3 whose band allows at most 6 items
When the model returns 8 items for the slots
Then the check rejects the worksheet
And it is not cached

Scenario: A template-filled worksheet is cached under the exact key
Given a template exists for "Fractions worksheet" at grade 3
When "Fractions worksheet with 5 items" is answered through the template
And the same prompt is sent again for grade 3
Then the second request calls the model 0 times

Scenario: The eval shows fewer output tokens with a template
Given the eval prompt "Fractions worksheet" at grade 3
When the eval runs once without a template and once with a template
Then the output tokens with the template are fewer than the output tokens without it
And the eval prints both counts

Scenario: Cache and template stores stay on the api
When the web app is built
Then it reads only PUBLIC_API_URL
And no cache or template code is bundled into the static output

Scenario: Customer errors reveal no internals
Given the template store cannot be read
When any request is sent
Then the customer sees a generic error
And the body contains no model name, token count or stack trace

Scenario: Live eval spend stays inside the cap
Given the live-run cap is $60
When the eval runs
Then it stops before total spend exceeds the part of $60 left for this epic
