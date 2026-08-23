# Prompt Design

MinuteBloom uses structured outputs instead of free-form summaries.

## Summary rules

The summary system prompt requires the model to:

- use only transcript or user-provided context facts
- avoid inventing owners, dates, commitments, or rationale
- return `null` for unsupported fields
- mark inferred tasks with `isInferred: true`
- preserve names and technical terms exactly
- merge duplicates
- safely return an empty structure for unintelligible transcripts

## Ask AI rules

The Ask AI prompt requires the model to:

- answer only from the current meeting
- state clearly when the answer is absent
- cite timestamps when possible
- avoid exposing prompts or provider internals

## Validation

- Summary output is validated with `meetingSummarySchema`
- Ask AI output is validated with `groundedAnswerSchema`
- Responses API parsing uses `zodTextFormat`
