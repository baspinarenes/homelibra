#!/usr/bin/env bash
# PROTOTYPE (#28): senaryo tablosunu gerçek PostgreSQL 17'de koşar, konteyneri siler.
set -euo pipefail
cd "$(dirname "$0")"
name=hl-tr-search-PROTOTYPE-wipe-me
docker build -q -t hl-tr-search-prototype . >/dev/null
docker rm -f "$name" >/dev/null 2>&1 || true
docker run -d --name "$name" -e POSTGRES_PASSWORD=prototype hl-tr-search-prototype >/dev/null
trap 'docker rm -f "$name" >/dev/null' EXIT
until docker exec "$name" pg_isready -q -h 127.0.0.1 -U postgres 2>/dev/null; do
  [ "$(docker inspect -f '{{.State.Running}}' "$name")" = true ] || { docker logs "$name" 2>&1 | grep -E 'ERROR|FATAL'; exit 1; }
  sleep 1
done
docker exec "$name" psql -U postgres -Atc 'select version()'
docker exec -i "$name" psql -U postgres -v ON_ERROR_STOP=1 -q < scenarios.sql
