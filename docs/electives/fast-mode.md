# Elective: Fast mode

**Extends:** execution. **Proof:** Compare two timed runs by hand.

## Goal

Waiting on a large build stage costs minutes, and the model is not what is slow.

## The problem

Waiting on a large build stage costs minutes, and the model is not what is slow.

## Without

Run the same small build ticket normally and note the wall time and the cost in `cost.json`.

## The config

- `/fast` toggles fast mode in a session. It uses the same Opus model with faster output and is billed differently, so check the cost rather than assume it.
- The factory sets the model per stage in `.factory/config.json`, and fast mode is a session choice, not a stage setting.

## With

Toggle `/fast`, run the same ticket again and compare the wall time and the cost.

## Run it

1. Run a small ticket normally. Note the time and the spend.
2. Type `/fast` and run it again.
3. Compare the two.

## Prove it

There is no offline proof. The page asks for two numbers, and the discussion is only worth having with them.

## Exercise

Track A: record both runs in a table. Track B: decide for which of the six factory stages the extra price is worth it.

## Discussion

When is waiting less valuable than paying less?
