#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Ensure pnpm is on PATH for non-interactive shells.
if ! command -v pnpm >/dev/null 2>&1; then
  export PNPM_HOME="${PNPM_HOME:-$HOME/Library/pnpm}"
  export PATH="$PNPM_HOME:$PATH"
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found in PATH. Set PNPM_HOME or adjust PATH." >&2
  exit 127
fi

# When using --handle-schedules, Payload enqueues tasks with waitUntil = next cron tick.
# We wait until we're past the next minute so those jobs become runnable, then run again.
wait_until_next_minute() {
  local sec
  sec=$(date +%s 2>/dev/null) || sec=0
  local sec_of_minute=$((sec % 60))
  # Sleep until :02 of the next minute so waitUntil from ":00" is in the past
  local sleep_sec=$((62 - sec_of_minute))
  [ "$sleep_sec" -lt 2 ] && sleep_sec=2
  [ "$sleep_sec" -gt 62 ] && sleep_sec=62
  sleep "$sleep_sec"
}

first_run=true
while true; do
  pnpm payload jobs:run --all-queues --handle-schedules

  # Give scheduled jobs time to become due (waitUntil = next :00), then run them.
  wait_until_next_minute
  pnpm payload jobs:run --all-queues

  # No delay before the first run. Sleep only after it completes.
  if [ "$first_run" = true ]; then
    first_run=false
    continue
  fi

  # Sleep 12–16 minutes plus a random 0–59 seconds.
  # This waits after each run, so actual start times drift naturally.
  base_sleep=$((12 * 60 + RANDOM % (4 * 60 + 1)))
  jitter=$((RANDOM % 61))
  sleep $((base_sleep + jitter))
done
