#!/usr/bin/env bash
#
# `pnpm e2e`: the Maestro smoke flow (apps/app/e2e) on the running emulator or
# simulator: sign in, add a Source, capture a Note. Start the stack first with
# `pnpm dev`; its API signs e2e@homelibra.test in with E2E_SIGN_IN_CODE, a
# fixed code that only works locally (apps/api/src/env.ts refuses it elsewhere).
# Local only, not in CI.

set -euo pipefail
cd "$(dirname "$0")/.."

code=${E2E_SIGN_IN_CODE:-246810} # the dev CLI's default (tools/dev/stack.go)

maestro=$(command -v maestro || true)
[[ -z "$maestro" && -x "$HOME/.maestro/bin/maestro" ]] && maestro="$HOME/.maestro/bin/maestro"
if [[ -z "$maestro" ]]; then
  printf '\n✗ pnpm e2e needs Maestro: brew tap mobile-dev-inc/tap && brew install mobile-dev-inc/tap/maestro\n' >&2
  exit 1
fi
if ! curl -sf -o /dev/null localhost:3000/api/auth/ok; then
  printf '\n✗ No API on :3000. Start the stack first: pnpm dev\n' >&2
  exit 1
fi

pnpm --silent invite add e2e@homelibra.test
exec "$maestro" test -e E2E_SIGN_IN_CODE="$code" apps/app/e2e/smoke.yaml "$@"
