# Digests Plan

## Goal

Add a `digests` feature that can collect RSS notifications into scheduled email summaries. The simplest version sends one email per digest every day at a configurable time. More advanced options use the configured OpenAI-compatible model to summarize, rank, and prioritize the notification list before delivery.

## Product Shape

### Digest collection

Create a `Digests` collection with authenticated access, similar to `FeedAutomations` and `Notifications`.

Core fields:

- `name`: admin title.
- `enabled`: whether this digest is active.
- `schedule`: daily time and timezone for delivery.
- `recipients`: optional override recipients; falls back to Settings email recipients when empty.
- `automations`: optional relationship to `feed-automations` for filtering included notifications.
- `feeds`: optional relationship to `rss-feeds` for filtering included notifications.
- `lookbackHours`: default `24`; determines which notifications are eligible.
- `deliveryWindow`: stored metadata for last run, next run, and last successful send.
- `instructions`: textarea appended to the digest summarization system prompt.
- `useAI`: checkbox to summarize and prioritize with AI.
- `priorityInstructions`: textarea for AI ranking behavior.
- `maxNotifications`: cap per digest.

The collection should not replace `Notifications`; it should group and deliver existing notification records.

### Notification status model

Preserve the current direct notification delivery flow at first. Add digest-specific tracking without breaking existing per-notification statuses.

Recommended model:

- Add a `digestDelivery` group to `notifications` with `status`, `digest`, `sentAt`, and `error`, or create a separate `DigestRuns` audit collection.
- Prefer `DigestRuns` if multiple digest definitions may include the same notification.

`DigestRuns` fields:

- `digest`: relationship to `digests`.
- `status`: `pending`, `sent`, `failed`, or `skipped`.
- `windowStart` and `windowEnd`.
- `notifications`: relationship array to `notifications`.
- `subject`, `text`, and `html`: generated output snapshot.
- `aiOutput`: JSON for model response, ordering, and summary metadata.
- `error`: textarea.

This keeps notification records stable while giving each digest a delivery audit trail.

## Delivery Behavior

### Basic daily digest

For the first version, the digest job should:

1. Find enabled digests due at the current time.
2. Query notifications created or matched since the digest window start.
3. Apply digest filters for automations and feeds.
4. Sort by `matchedAt` descending.
5. Build a plain email with title, message, source URL, feed, automation, and matched time.
6. Send one email through the existing `sendEmail` / Payload email path.
7. Record a `DigestRuns` document.

All item links in digest emails must point to the notification `sourceURL`. Feed, automation, and admin links may be shown as metadata later, but the primary click target for each notification should always be `sourceURL`.

The basic version should not require AI or a new email provider.

### AI summarization

When `useAI` is enabled:

- Use `Settings.modelSettings.defaultModel` and the same `OPENAI_BASE_URL` / `OPENAI_API_KEY` pattern already used by `processFeeds`.
- Build a digest-specific system prompt from:
  - a fixed safety/format instruction,
  - `Settings.modelSettings.systemPrompt`,
  - `Digest.instructions`,
  - `Digest.priorityInstructions`.
- Send compact notification payloads to the model: title, message, source URL, feed name, automation name, matched time, and raw data excerpts only when useful.
- Ask for structured JSON with:
  - `summary`
  - `highPriority`
  - `mediumPriority`
  - `lowPriority`
  - `omittedIds`
  - `subject`

If AI fails, fall back to the basic chronological digest and mark the run with the AI error.

### AI prioritization

Priority should affect email order, not notification creation. The model can rank notifications into sections, but the original source links and titles should always remain visible so the digest stays auditable.

Default priority prompt:

```text
Prioritize notifications by likely urgency and usefulness. Put actionable, time-sensitive, security, release, outage, or high-signal items first. Group duplicates together. Keep source titles and links intact.
```

## Jobs

Add a `send-digests` Payload task in `src/jobs/sendDigests.ts` and include it in `src/jobs/index.ts`.

Environment defaults:

- `SEND_DIGESTS_CRON=0 * * * * *` to check due digests every minute.
- Reuse `SMTP_REQUEST_DELAY_MS` if multiple digests send in one run.

The task should use Payload `req` on all nested Local API operations. For user-scoped operations, set `overrideAccess: false` when passing a user. For system jobs, use the job request intentionally as the administrative context.

## Admin UX

Add `Digests` to Payload collections near `Notifications`.

Recommended default columns:

- `name`
- `enabled`
- `schedule.time`
- `schedule.timezone`
- `lastRunAt`
- `updatedAt`

Useful admin affordances:

- "Send test digest" endpoint or button after the core flow works.
- Preview field or custom admin component that shows the current eligible notification count.
- Digest run history reachable from each digest.

Generate the import map only if custom admin components are added.

## Implementation Phases

### Phase 1: Basic scheduled email

- Add `Digests` collection.
- Add `DigestRuns` collection.
- Add `send-digests` task.
- Build deterministic plain-text and HTML email templates.
- Reuse existing Settings email config and `payload.sendEmail`.
- Add README docs for the new collection and job.
- Run `pnpm generate:types` and `pnpm exec tsc --noEmit`.

### Phase 2: Filtering and audit polish

- Support automation and feed filters.
- Add last run / next run metadata.
- Add duplicate protection so the same digest window cannot send twice.
- Add digest run list columns and useful error messages.

### Phase 3: AI summary and priority

- Extract shared OpenAI-compatible request helper from `processFeeds`.
- Follow the endpoint fallback design in `docs/openai-endpoint-fallback-plan.md` so digest AI and feed filtering share the same primary/fallback endpoint behavior.
- Add digest prompt fields.
- Generate structured model output.
- Fall back to basic digest when AI fails.
- Store AI output on `DigestRuns`.

### Phase 4: Admin controls

- Add "send test digest" action.
- Add "preview eligible notifications" action.
- Add optional per-digest recipient overrides.
- Add screenshots once the UI is stable.

## Open Decisions

- Whether direct email delivery should remain enabled for notifications that are also included in a digest, or whether a notification should be routed to direct delivery, digest delivery, or both.
- Whether digest membership should be determined by `createdAt`, `matchedAt`, or unsent digest state.
- Whether digest schedules should support only daily time at first or arbitrary cron syntax.
- Whether digest recipients should support per-digest overrides immediately or only inherit global Settings in phase 1.
