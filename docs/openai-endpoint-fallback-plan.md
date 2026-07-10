# OpenAI Endpoint Fallback Plan

## Goal

Allow rssnotify to try additional OpenAI-compatible endpoints when the primary endpoint is unavailable or failing, without changing automation prompts, digest prompts, or model selection behavior.

The first implementation should cover both current AI call sites:

- Feed item filtering in `src/jobs/processFeeds.ts`.
- Digest summarization and prioritization in `src/jobs/sendDigests.ts`.

## Current State

Both AI paths build a single chat completions endpoint from:

- `OPENAI_BASE_URL`, defaulting to `https://api.openai.com`
- `OPENAI_API_KEY`
- `MODEL_NAME` or Settings / automation model fields
- `OPENAI_TIMEOUT_MS`

Each call posts to:

```text
<base-url>/v1/chat/completions
```

If the request fails, times out, returns a non-2xx response, returns invalid JSON, or returns unusable model content, the caller treats the AI step as failed. Feed filtering returns `false`; digest generation falls back to the basic chronological digest.

## Configuration

Add an optional env var:

```text
OPENAI_FALLBACK_BASE_URLS=https://endpoint-a.example.com,https://endpoint-b.example.com
```

Behavior:

- The primary endpoint remains `OPENAI_BASE_URL` or `https://api.openai.com`.
- Fallback endpoints are attempted in listed order after the primary endpoint fails.
- Empty entries are ignored.
- Trailing slashes are normalized.
- Duplicate base URLs are removed while preserving order.
- If no fallback URLs are configured, behavior stays the same as today.

Settings > Model Settings can also define fallback endpoints as admin-managed rows with:

- `baseURL`
- `apiKey`

When any admin-managed fallback endpoint exists, that list overrides `OPENAI_FALLBACK_BASE_URLS`. Env-configured fallback URLs reuse `OPENAI_API_KEY`; admin-managed fallback endpoints use the API key saved on each row. The selected model name is still shared across all endpoints.

## Failure Policy

Attempt the next endpoint only for transport or service failures:

- Network errors.
- Timeout / abort.
- HTTP `408`, `409`, `425`, `429`, and `5xx`.
- Invalid JSON response.
- Missing response content.

Do not fall back for likely configuration or request errors:

- HTTP `400`, `401`, `403`, `404`, and other non-retryable `4xx`.
- Model output that parses but semantically says `no` for feed filtering.
- Digest JSON that parses but fails business validation because of invalid ids or malformed priority arrays, once stricter validation exists.

Rationale: fallback should handle provider availability, capacity, and transient compatibility issues. It should not hide bad credentials, unsupported model names, bad prompts, or invalid request payloads.

## Shared Helper

Create a shared helper, for example:

```text
src/utilities/openAIChatCompletions.ts
```

Responsibilities:

- Build ordered endpoint candidates from `OPENAI_BASE_URL` plus either admin-managed fallback endpoints or `OPENAI_FALLBACK_BASE_URLS`.
- Apply the shared timeout behavior.
- Send the chat completions request with the existing request shape.
- Return raw content plus metadata about the endpoint used.
- Return structured failure details for logging and caller-specific fallback behavior.
- Use the primary `OPENAI_API_KEY` for the primary endpoint, use each admin fallback row's API key when configured, and otherwise reuse `OPENAI_API_KEY` for env fallback URLs.

Suggested result shape:

```ts
type OpenAIChatCompletionResult =
  | {
      ok: true
      content: string
      endpoint: string
      model: string
      attempts: OpenAIEndpointAttempt[]
    }
  | {
      ok: false
      retryable: boolean
      error: string
      attempts: OpenAIEndpointAttempt[]
    }
```

Each attempt should record:

- `endpoint`
- `status` when available
- `elapsedMs`
- `retryable`
- short `error` text

Do not store API keys or request bodies in attempts.

## Feed Filtering Changes

Update `runModelCheck` in `src/jobs/processFeeds.ts` to use the shared helper.

Expected behavior:

- Preserve the current `false` result when no API key is configured.
- Preserve model selection order:
  1. automation model
  2. Settings default model
  3. `MODEL_NAME`
  4. built-in default
- Preserve `DEBUG_FEEDS` logging, but log each endpoint attempt and the endpoint that succeeded.
- Return `false` when all eligible endpoints fail.
- Continue treating only model answers containing `yes` or `true` as matches.

## Digest Changes

Update `runDigestModel` in `src/jobs/sendDigests.ts` to use the shared helper.

Expected behavior:

- Preserve the current configured-model selection.
- Return the existing error shape when all endpoints fail.
- Include enough endpoint-attempt detail in the returned error to diagnose provider failure, without exposing secrets.
- Continue falling back to the basic chronological digest when AI fails.
- Store the final AI output in `DigestRuns.aiOutput` as today; endpoint attempt metadata can be added later if audit detail is needed.

## Observability

Minimum logging:

- In debug feed mode, log every attempted endpoint for feed filtering.
- For digest AI failures, include endpoint hostnames and status/error summaries in the run error.

Avoid logging:

- API keys.
- Full prompt bodies.
- Full notification payloads.
- Full raw provider responses unless an existing debug flag explicitly permits it.

## Tests

Add focused tests for the shared helper and call-site behavior:

- Primary endpoint succeeds; fallback is not called.
- Primary endpoint times out or returns `5xx`; fallback succeeds.
- Primary endpoint returns `401`; fallback is not called.
- Fallback URL parsing trims whitespace, ignores empty entries, and dedupes.
- Feed filtering still returns `true` for a successful `yes` response from a fallback endpoint.
- Digest model returns valid parsed JSON from a fallback endpoint.
- All endpoints fail with retryable errors; caller receives a concise failure.

Use mocked `fetch` and fake timers where practical so tests do not need network access.

## Implementation Phases

### Phase 1: Shared endpoint fallback helper

- Add fallback URL parsing.
- Add retryability classification.
- Add shared request execution with timeout handling.
- Add unit tests for the helper.

### Phase 2: Feed filtering integration

- Replace direct `fetch` in `processFeeds.ts`.
- Preserve current debug behavior and boolean result semantics.
- Add tests around fallback success and non-retryable failures.

### Phase 3: Digest integration

- Replace direct `fetch` in `sendDigests.ts`.
- Preserve basic digest fallback when AI fails.
- Include safe endpoint-attempt summaries in AI error messages.

### Phase 4: Documentation

- Document `OPENAI_FALLBACK_BASE_URLS` in `README.md`.
- Document Settings > Model Settings fallback endpoints with per-endpoint API keys.
- Mention that fallback endpoints must be OpenAI chat-completions compatible.
- Document that env fallback endpoints reuse `OPENAI_API_KEY` while admin fallback endpoints use row-specific keys.

## Future Options

- Per-endpoint model overrides.
- Cooldown / circuit-breaker behavior to skip a recently failing endpoint for a short period.
- Endpoint attempt metadata persisted to `DigestRuns` for audit.
- Admin-managed endpoint configuration in Settings instead of env-only configuration.

## Open Decisions

- Whether fallback attempts should be allowed after HTTP `429` by default, or only after an opt-in flag when the provider may bill per failed attempt.
- Whether digest failures should store endpoint-attempt metadata immediately or only surface it in the run error text.
- Whether `OPENAI_BASE_URLS` should replace `OPENAI_BASE_URL` later, or whether the explicit fallback env var is clearer for compatibility.
- Whether admin-managed fallback endpoint API keys should be write-only/encrypted beyond the normal Payload storage layer.
