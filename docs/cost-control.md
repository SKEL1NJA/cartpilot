# Cost Control

CartPilot makes several deliberate choices to avoid unnecessary LLM spend and
unbounded agent behavior. None of these are theoretical — each maps to a
specific, real decision made during the build.

## Model choice
Uses `gemini-3.6-flash` (a fast, low-cost tier), not a larger/more expensive
model. Flash-tier models are sufficient for structured tool-calling and
short conversational replies over a small (~20 SKU) catalog — the task
does not require frontier-model reasoning depth.

## Context window management
Only the last 8 messages of a conversation are sent to the model on every
call (`utils/context.js`, `getRecentMessages`), not the full history. A long
conversation costs the same per-call as a short one, rather than growing
unboundedly with conversation length.

## Bounded agent loop
The tool-calling loop (`agent/orchestrator.js`) has a hard cap of 5
iterations (`MAX_TOOL_ITERATIONS`). Without this, a confused model or an
unexpected tool-response shape could in principle loop indefinitely, making
repeated paid API calls with no user-facing progress.

## Deterministic rules instead of a second LLM call
Guardrail decisions (auto-approve / pending / reject) are evaluated by plain
JavaScript (`agent/rules.js`), not by asking the LLM "is this discount
reasonable?" This is both a safety decision and a cost decision:
zero additional API calls are spent on business-rule evaluation.

## Retry with backoff, not naive infinite retry
Transient failures (503 overload, 429 rate-limit) are retried a maximum of
2 times with increasing backoff (`services/geminiService.js`), then fall
back to a safe message. This avoids both silent failure and unbounded
retry spend.

## Evaluation harness paced to respect rate limits
The AI evaluation suite (`eval/runEval.js`) deliberately spaces requests
~13 seconds apart to stay under the free-tier rate limit, discovered after
an initial run hit a 429 error running 8 cases back-to-back (documented in
`docs/ai-evaluation.md`).

## Observability enables future cost monitoring
Every real Gemini call now logs prompt/completion/total token counts
(`utils/logger.js`, `gemini_call` events) — the foundation for tracking
actual spend per conversation, should this move beyond a demo.