# Result Feeds Plan

## Goal

Expose RSS/Atom-style output feeds for rssnotify results:

- a notification results feed, backed by `notifications`
- a digest results feed, backed by successful `digest-runs`
- public and private access modes for each feed

These are feeds of generated results, not feed sources for `process-feeds`.

## Product Shape

Add a new `ResultFeeds` collection that defines shareable feeds.

Core fields:

- `name`: admin title.
- `enabled`: whether the result feed can be served.
- `resultType`: `notifications` or `digests`.
- `visibility`: `private` or `public`; default `private`.
- `token`: generated secret for private feeds.
- `format`: `atom` or `rss`; default `atom`.
- `limit`: number of entries to return; default `50`.
- `automations`: optional relationship filter to `feed-automations`.
- `feeds`: optional relationship filter to `rss-feeds`.
- `digests`: optional relationship filter to `digests`, only shown for digest result feeds.
- `statuses`: optional status filter; defaults to sent/successful results.
- `includeContent`: whether feed item content includes notification messages or digest summaries.
- `lastAccessedAt`: read-only timestamp for operational visibility.

Admin placement:

- Add `ResultFeeds` near `Notifications`, `Digests`, and `Digest Runs`.
- Default columns: `name`, `resultType`, `visibility`, `enabled`, `updatedAt`.
- Add an admin description that public feeds are unprotected and private feeds require the tokenized URL.

## Feed URLs

Serve feeds through collection endpoints on `result-feeds`:

- `/api/result-feeds/:id/feed.xml`
- `/api/result-feeds/:id/feed.atom`
- `/api/result-feeds/:id/feed.rss`

Private feeds require one of:

- `?token=<token>`
- `Authorization: Bearer <token>`

Public feeds require no token but must still only expose records selected by the `ResultFeeds` document. Admin CRUD for configuring result feeds remains authenticated-only.

## Notification Result Feed

For `resultType = notifications`, query `notifications`.

Default query:

- `overallStatus` in `sent`, `pending`, or `failed` depending on selected `statuses`
- optional `automation` filter
- optional `feed` filter
- sort by `matchedAt` descending
- limit by `ResultFeeds.limit`

Entry mapping:

- `id`: stable entry id using the notification id.
- `title`: notification title.
- `link`: notification `sourceURL`.
- `published`: `matchedAt` when available, otherwise `createdAt`.
- `updated`: `updatedAt`.
- `summary/content`: notification `message`, feed name, automation name, and delivery status when `includeContent` is enabled.

The primary entry link must be `sourceURL`, matching the existing email and digest requirement.

## Digest Result Feed

For `resultType = digests`, query `digest-runs`.

Default query:

- `status` equals `sent`
- optional `digest` filter
- sort by `sentAt` descending, falling back to `createdAt`
- limit by `ResultFeeds.limit`

Entry mapping:

- `id`: stable entry id using the digest run id.
- `title`: stored `subject`, or digest name plus run date.
- `link`: admin URL for the digest run, unless a future public digest detail route exists.
- `published`: `sentAt` when available, otherwise `createdAt`.
- `updated`: `updatedAt`.
- `summary/content`: digest `text` summary or `aiOutput.summary`, with notification source links preserved when included.

Digest result feeds should not create new digest output; they only publish stored `digest-runs`.

## Access Model

Configuration access:

- `ResultFeeds` create/read/update/delete: authenticated users only.
- Token field should not be shown in list columns.

Feed-serving access:

- Public feed: allowed when `enabled = true` and `visibility = public`.
- Private feed: allowed when `enabled = true`, `visibility = private`, and token matches.
- Disabled feed: always 404 or 403.

Do not use a logged-in user passed to Local API without `overrideAccess: false`. Endpoint handlers can use intentional system reads with `overrideAccess: true` only after validating public/private feed access.

## XML Rendering

Prefer a small internal XML renderer over adding a dependency unless formatting needs grow.

Requirements:

- Escape XML text and attributes.
- Emit `application/atom+xml; charset=utf-8` for Atom.
- Emit `application/rss+xml; charset=utf-8` for RSS.
- Include deterministic feed ids and item ids.
- Use `NEXT_PUBLIC_SERVER_URL` or `getServerSideURL()` to build absolute self links.
- Avoid exposing raw JSON or internal errors in XML.

## Implementation Phases

### Phase 1: Core private result feeds

- Add `ResultFeeds` collection.
- Add private token generation for new result feeds.
- Add feed endpoints for Atom output.
- Implement notification result feed queries.
- Implement digest result feed queries.
- Add README docs.
- Run `pnpm generate:types` and `pnpm exec tsc --noEmit`.

### Phase 2: Public feeds and RSS format

- Add `visibility = public` support.
- Add RSS 2.0 rendering alongside Atom.
- Add clear admin descriptions about public exposure.
- Add token rotation action or endpoint for private feeds.

### Phase 3: Filtering and polish

- Add automation, feed, digest, and status filters.
- Add `lastAccessedAt` updates from the endpoint, passing `req`.
- Add copyable feed URL admin component if useful; regenerate import map if added.
- Add tests for access checks, XML escaping, notification feed mapping, and digest feed mapping.

## Open Decisions

- Whether private feeds should use stable generated tokens only, or allow user-supplied slugs plus tokens.
- Whether public digest result feed entries should link to an admin digest run, no link, or a new public digest detail page.
- Whether notification result feeds should include pending notifications by default or sent-only notifications by default.
- Whether output feeds need JSON Feed format in addition to Atom/RSS.

## Verification

- `pnpm generate:types`
- `pnpm exec tsc --noEmit`
- Endpoint tests for public, private-token, disabled, and wrong-token requests.
- XML parser test to verify generated Atom/RSS is valid XML.
- Manual check that notification feed entries link to `sourceURL`.
