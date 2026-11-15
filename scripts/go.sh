#!/usr/bin/env bash
#
# Runs go in tools/dev, the dev CLI behind `pnpm dev` (and `pnpm test:dev`).
# The toolchain line in tools/dev/go.mod pins the Go version; go fetches it if needed.

set -euo pipefail
cd "$(dirname "$0")/.."

go=$(command -v go || true)
[[ -z "$go" && -x /usr/local/go/bin/go ]] && go=/usr/local/go/bin/go
[[ -z "$go" && -x /opt/homebrew/bin/go ]] && go=/opt/homebrew/bin/go
if [[ -z "$go" ]]; then
  printf '\n✗ pnpm dev needs Go (tools/dev is a Go program). Install it: brew install go\n' >&2
  exit 1
fi

exec "$go" -C tools/dev "$@"
