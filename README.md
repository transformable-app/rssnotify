# rssnotify

RSS feed monitor that evaluates feed items (optionally with OpenAI), creates notifications when content matches your rules, and delivers them via email and/or [ntfy](https://ntfy.sh).

Built with [Payload CMS](https://payloadcms.com)

## Features

- **RSS Feeds** – Add Standard RSS, Reddit, or WordPress feed URLs; enable/disable per feed.
- **Feed Automations** – Define rules per automation: optional OpenAI-based filtering, “notify every post,” and type-specific options (e.g. follow post RSS, process comments for Reddit/WordPress).
- **Notifications** – View and manage generated alerts; delivery status (email / ntfy) and bulk actions in the admin.
- **Scheduled jobs** – Process feeds and deliver notifications on a cron schedule (feeds hourly by default, delivery every minute by default).
- **Notification delivery** – Email (SMTP) and/or ntfy; configurable in Settings.

## Quick Start

1. Clone the repo and create a `.env` in the project root. Set at least:
   - `PAYLOAD_SECRET` – secret for Payload (required)
   - `NEXT_PUBLIC_SERVER_URL` – public URL of the app (e.g. `http://localhost:3000`)
   - `CRON_SECRET` – secret for cron/job endpoints (required)
   - `PREVIEW_SECRET` – secret for preview (required)
   Optionally: `OPENAI_API_KEY` (and `OPENAI_BASE_URL`, `MODEL_NAME`) for AI filtering. MongoDB credentials default in Compose; override with `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`, `MONGO_INITDB_DATABASE` if needed.
2. Start the stack with Docker Compose using this project’s [docker-compose.yml](docker-compose.yml):
   ```bash
   docker-compose up
   ```
3. Open `http://localhost:3000/admin`, create an admin user, then add **RSS Feeds** and **Feed Automations**.

## Collections

All content is restricted to authenticated users.

### RSS Feeds

Feed sources to poll.

- **Name** – Label for the feed.
- **Type** – `Standard RSS`, `Reddit`, or `WordPress`.
- **URL** – Feed URL (unique).
- **Enabled** – Whether the feed is included in processing.
- **Notes** – Optional notes.

### Feed Automations

Rules that run when processing feeds. Each automation can target all feeds or a selected set.

- **Name** – Label for the automation.
- **Enabled** – Whether the automation runs.
- **Type** – `Standard RSS`, `Reddit`, or `WordPress / Blog`.
- **Feeds** – Optional: limit this automation to specific feeds.
- **RSS Rules** (shared) – OpenAI model and prompt for evaluating content; option to notify on every post without evaluation.
- **Reddit Rules** (when type = Reddit) – Follow post URL to its `.rss` version; process each comment.
- **WordPress / Blog RSS Rules** (when type = WordPress) – Same options as Reddit.

When content matches an automation’s rules, a **Notification** is created. The **process-feeds** job runs on a schedule to fetch feeds and evaluate items.

### Notifications

Generated alerts from feed automations.

- **Title**, **Message**, **Source URL** – Content and link.
- **Automation** – Which feed automation created it.
- **Feed** – Source feed (if known).
- **Matched At** – When the match occurred.
- **Overall Status** – `pending`, `sent`, `failed`, `skipped`.
- **Delivery** – Per-channel status and errors for **email** and **ntfy** (e.g. sent at, error message).
- **Data** – Raw payload for debugging.

The **deliver-notifications** job sends pending notifications using **Settings** (email and ntfy configuration).

### Users

Admin users (auth collection). Used for login and access control. Managed under **Settings** in the admin.

## Globals

### Notification Settings (`settings`)

Configure how notifications are delivered.

- **Email** – Enabled, From Name, From Email, Reply-To, Recipients (list of addresses). Used with SMTP (e.g. Nodemailer); ensure your deployment has SMTP env vars configured if you use email.
- **Ntfy** – Enabled, Server URL (e.g. `https://ntfy.sh`), Auth Token (optional), Channels (list of topics).

### Jobs (`jobs`)

Global that shows the job schedule and queue status. Used by the **process-feeds** and **deliver-notifications** tasks.

## Access control

- **RSS Feeds, Feed Automations, Notifications, Users** – Only authenticated users can create, read, update, and delete.
- **Settings, Jobs** – Only authenticated users can read and update.

## Jobs and schedule

- **process-feeds** – Fetches RSS/Reddit/WordPress feeds, evaluates items with automations (and optionally OpenAI), creates notifications. Runs every minute by default (`* * * * *`) and can be overridden with `PROCESS_FEEDS_CRON` (e.g. `0 0 * * *` for hourly).
- **deliver-notifications** – Sends pending notifications via email and/or ntfy using Notification Settings. Runs every minute by default (`0 * * * * *`) and can be overridden with `DELIVER_NOTIFICATIONS_CRON`.

Job execution is allowed for logged-in users or when the request includes the correct `CRON_SECRET` (e.g. for external cron or Vercel Cron).

When using the external script `./scripts/run-payload-jobs-every-minute.sh`, it waits until past the next minute then runs jobs so scheduled tasks (with `waitUntil` set to the next cron tick) actually execute.

## Development

- `pnpm dev` – Start Next.js dev server (Payload admin at `/admin`).
- `pnpm build` – Production build.
- `pnpm start` – Run production server.
- `pnpm generate:types` – Regenerate Payload types after schema changes.
- `pnpm generate:importmap` – Regenerate import map after adding/changing admin components.

Use a local MongoDB instance or Docker for `DATABASE_URL`. Optional: set `OPENAI_API_KEY` (and related env) to test AI-based filtering.

## Docker

### Run with Docker Compose

The repo includes a production Compose setup that runs the app and MongoDB:

1. Set required env (e.g. in `.env`): `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `CRON_SECRET`, `PREVIEW_SECRET`. Optionally: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `MODEL_NAME`, MongoDB credentials, `RSS_FETCH_JITTER_*`.
2. Run:
   ```bash
   docker-compose up
   ```
3. Open `http://localhost:3000/admin` and create your first user.

The app image is built from the project Dockerfile; Compose uses `ghcr.io/transformable-app/rssnotify:latest` by default (override with `RSSNOTIFY_IMAGE`).

### Docker deployment (GHCR)

Images are published to GitHub Container Registry:

- `ghcr.io/transformable-app/rssnotify`

On push to `main` (and on `v*` tags), GitHub Actions builds and pushes the image.

#### Run the published image

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL='mongodb://<host>/rssnotify' \
  -e PAYLOAD_SECRET='<secret>' \
  -e NEXT_PUBLIC_SERVER_URL='https://your-domain.example' \
  -e CRON_SECRET='<cron-secret>' \
  -e PREVIEW_SECRET='<preview-secret>' \
  ghcr.io/transformable-app/rssnotify:latest
```

#### Cron jobs in Docker

Payload job schedules are driven by `jobs.autoRun`. The image uses:

- `PAYLOAD_JOBS_AUTORUN=true`
- `PAYLOAD_JOBS_AUTORUN_CRON=* * * * *`

Task defaults:

- `PROCESS_FEEDS_CRON=* * * * *` (every minute; use e.g. `0 0 * * *` for hourly)
- `DELIVER_NOTIFICATIONS_CRON=0 * * * * *`

Override `PAYLOAD_JOBS_AUTORUN_CRON`, `PROCESS_FEEDS_CRON`, and `DELIVER_NOTIFICATIONS_CRON` at runtime as needed. For multiple replicas, enable autoRun on a single instance to avoid duplicate processing.

## Production

1. Set `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, and any cron/delivery/env required by your deployment.
2. Build and start: `pnpm build && pnpm start` (or use the Docker image).
3. For cron, either rely on in-process `PAYLOAD_JOBS_AUTORUN` or call the jobs endpoint on a schedule with `CRON_SECRET` in the `Authorization: Bearer <CRON_SECRET>` header.

## Platform Questions

For Payload CMS: [Discord](https://discord.com/invite/payload) or [GitHub discussions](https://github.com/payloadcms/payload/discussions).
