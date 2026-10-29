#!/bin/sh
# Creates the two Homelibra roles and the databases named in HOMELIBRA_DATABASES.
#   homelibra_owner  owns the tables; migrations run as it.
#   homelibra_app    the API connects as it; it owns nothing, so row-level
#                    security applies to every query it makes (ADR-0006).
set -eu

: "${HOMELIBRA_OWNER_PASSWORD:?HOMELIBRA_OWNER_PASSWORD is required}"
: "${HOMELIBRA_APP_PASSWORD:?HOMELIBRA_APP_PASSWORD is required}"
databases="${HOMELIBRA_DATABASES:-homelibra}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v owner_pw="$HOMELIBRA_OWNER_PASSWORD" -v app_pw="$HOMELIBRA_APP_PASSWORD" <<'SQL'
create role homelibra_owner login password :'owner_pw';
create role homelibra_app login password :'app_pw' nosuperuser nobypassrls;
SQL

for db in $databases; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -v db="$db" <<'SQL'
create database :"db" owner homelibra_owner;
revoke all on database :"db" from public;
grant connect on database :"db" to homelibra_app;
SQL
done
