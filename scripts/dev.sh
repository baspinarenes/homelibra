#!/usr/bin/env bash
#
# `pnpm dev`: the whole local stack against the Android phone on USB.
#
# Postgres (compose.yaml), migrations, the API on :3000 and Metro on :8081,
# with both ports reversed onto the phone so the dev build reaches them at
# localhost. Installs the dev build first when the phone doesn't have it;
# `pnpm dev --rebuild` reinstalls it after a native dependency changes.
# Ctrl-C stops the API and Metro; Postgres keeps running.

set -euo pipefail
cd "$(dirname "$0")/.."

APP_ID=app.homelibra
rebuild=false
[[ "${1:-}" == "--rebuild" ]] && rebuild=true

fail() { printf '\n✗ %s\n' "$1" >&2; exit 1; }
step() { printf '\n→ %s\n' "$1"; }

# Ports first: a leftover API or Metro from another terminal is the usual
# reason the phone talks to the wrong server.
for port in 3000 8081; do
  if pid=$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -1) && [[ -n "$pid" ]]; then
    fail "Port $port is taken by PID $pid ($(ps -o command= -p "$pid" | cut -c1-80)). Stop it first: kill $pid"
  fi
done

step "Phone"
command -v adb >/dev/null || fail "adb not found. Add ~/Library/Android/sdk/platform-tools to PATH."
devices=$(adb devices | awk 'NR > 1 && $2 == "device" { print $1 }')
if [[ -n "${ANDROID_SERIAL:-}" ]]; then
  grep -qx "$ANDROID_SERIAL" <<<"$devices" || fail "ANDROID_SERIAL=$ANDROID_SERIAL is not connected."
else
  count=$(grep -c . <<<"$devices" || true)
  [[ "$count" -eq 0 ]] && fail "No phone on USB. Plug it in, enable USB debugging and accept the prompt on the phone."
  [[ "$count" -gt 1 ]] && fail "Several devices connected ($(tr '\n' ' ' <<<"$devices")). Pick one: ANDROID_SERIAL=<id> pnpm dev"
  export ANDROID_SERIAL="$devices"
fi
adb reverse tcp:3000 tcp:3000 >/dev/null
adb reverse tcp:8081 tcp:8081 >/dev/null
echo "  $ANDROID_SERIAL, localhost:3000 and :8081 reversed"

step "Postgres"
docker info >/dev/null 2>&1 || fail "Docker is not running. Start Docker Desktop and retry."
docker compose up -d --build postgres >/dev/null
until docker compose exec -T postgres pg_isready -U postgres -q; do sleep 1; done
echo "  ready on :5432"

step "Migrations"
if [[ ! -f apps/api/.env ]]; then
  cp apps/api/.env.example apps/api/.env
  echo "  created apps/api/.env from .env.example"
fi
out=$(pnpm --filter @homelibra/api db:migrate 2>&1) || { echo "$out"; fail "Migrations failed."; }
echo "  applied"

if $rebuild || ! adb shell pm list packages "$APP_ID" | grep -qx "package:$APP_ID"; then
  step "Dev build (a few minutes the first time)"
  pnpm --filter @homelibra/app android:install
fi

# Kill the API with the script, whichever way it ends.
trap 'trap - EXIT; kill 0' EXIT INT TERM

step "API on :3000 (sign-in codes appear here as [api] lines)"
pnpm --filter @homelibra/api dev </dev/null > >(sed -u 's/^/[api] /') 2>&1 &
api_pid=$!
until curl -sf -o /dev/null localhost:3000/api/auth/ok; do
  kill -0 "$api_pid" 2>/dev/null || fail "The API exited; see the [api] lines above."
  sleep 1
done

step "Metro on :8081, opening the app on the phone"
cd apps/app
pnpm exec expo start --dev-client --android
