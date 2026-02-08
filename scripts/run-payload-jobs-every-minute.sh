#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

while true; do
  pnpm payload jobs:run --all-queues --handle-schedules

  # Sleep 12–16 minutes plus a random 0–59 seconds.
  # This waits after each run, so actual start times drift naturally.
  base_sleep=$((12 * 60 + RANDOM % (4 * 60 + 1)))
  jitter=$((RANDOM % 61))
  sleep $((base_sleep + jitter))
done
