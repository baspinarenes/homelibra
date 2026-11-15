#!/usr/bin/env bash
#
# `pnpm e2e`: the Maestro smoke flow (apps/app/e2e) on a running emulator or
# simulator: sign in, add a Source, capture a Note. Start the stack first with
# `pnpm dev --e2e`, whose API signs e2e@homelibra.test in with a fixed code
# that only works locally (apps/api/src/env.ts refuses it in production).
# Local only, not in CI.
#
# The flow starts from a cleared app (signed out, empty outbox), so it never
# runs on a phone: the dev build shares its package with the beta app.

set -euo pipefail
cd "$(dirname "$0")/.."

code=${E2E_SIGN_IN_CODE:-246810} # what `pnpm dev --e2e` sets (tools/dev/main.go)

maestro=$(command -v maestro || true)
[[ -z "$maestro" && -x "$HOME/.maestro/bin/maestro" ]] && maestro="$HOME/.maestro/bin/maestro"
if [[ -z "$maestro" ]]; then
  printf '\n✗ pnpm e2e needs Maestro: brew tap mobile-dev-inc/tap && brew install mobile-dev-inc/tap/maestro\n' >&2
  exit 1
fi
if ! curl -sf -o /dev/null localhost:3000/api/auth/ok; then
  printf '\n✗ No API on :3000. Start the stack first: pnpm dev --e2e\n' >&2
  exit 1
fi

# An emulator, else a booted simulator; never a phone.
device=$(adb devices 2>/dev/null | awk '$1 ~ /^emulator-/ && $2 == "device" { print $1; exit }' || true)
if [[ -z "$device" ]] && command -v xcrun >/dev/null; then
  device=$(xcrun simctl list devices booted -j | node -e '
    const d = JSON.parse(require("fs").readFileSync(0, "utf8")).devices;
    const ios = Object.entries(d).filter(([r]) => r.includes("iOS")).flatMap(([, s]) => s);
    if (ios[0]) console.log(ios[0].udid);')
fi
if [[ -z "$device" ]]; then
  printf '\n✗ No running emulator or simulator. The flow clears the app, so it does not run on a phone.\n' >&2
  exit 1
fi

pnpm --silent invite add e2e@homelibra.test
exec "$maestro" --device "$device" test -e E2E_SIGN_IN_CODE="$code" apps/app/e2e/smoke.yaml "$@"
