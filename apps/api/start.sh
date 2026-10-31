#!/bin/sh
# The API container's start (apps/api/Dockerfile): migrations as the table
# owner, then the server as homelibra_app. The owner's URL is dropped before
# the server starts, so the API process never holds it (ADR-0006).
set -eu

if [ -n "${MIGRATION_DATABASE_URL:-}" ]; then
  tsx src/db/migrate.ts
fi
unset MIGRATION_DATABASE_URL

exec tsx --import ./src/instrument.ts src/server.ts
