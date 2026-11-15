#!/usr/bin/env bash
#
# `pnpm db:prod`: psql on the production database, as homelibra_readonly
# (ADR-0015). Through SSH and `docker exec`, so no database port is opened.
#
#   pnpm db:prod                                  an interactive psql
#   pnpm db:prod -c 'select count(*) from note'   one query
#   pnpm db:prod --setup                          create the role, or refresh
#                                                 its grants after a migration
#
# The role reads every Library row (it bypasses row-level security) but
# nothing that signs anyone in: session tokens, sign-in codes, OAuth tokens and
# passwords stay out of its grants. It can write nothing. Server details come
# from .env.production, which scripts/setup-beta-infra.sh wrote.

set -euo pipefail

ROLE=homelibra_readonly
DB=homelibra

# The columns the role never reads: whoever holds them can sign in as someone.
SECRETS="('session', 'token'), ('verification', 'value'),
  ('account_provider', 'access_token'), ('account_provider', 'refresh_token'),
  ('account_provider', 'id_token'), ('account_provider', 'password')"

# Every column of every table in public, minus SECRETS, as table → columns.
readable_columns() {
  cat <<SQL
select c.table_name, string_agg(quote_ident(c.column_name), ', ' order by c.ordinal_position) as cols
from information_schema.columns c
join pg_tables p on p.schemaname = c.table_schema and p.tablename = c.table_name
where c.table_schema = 'public' and (c.table_name, c.column_name) not in ($SECRETS)
group by c.table_name
SQL
}

# Run as the postgres superuser: create the role once, then grant exactly the
# readable columns (revoking first, so a column that became secret is dropped).
setup_sql() {
  cat <<SQL
do \$\$
declare t record;
begin
  if not exists (select from pg_roles where rolname = '$ROLE') then
    create role $ROLE login nosuperuser bypassrls;
  end if;
  execute format('grant connect on database %I to $ROLE', current_database());
  grant usage on schema public to $ROLE;
  revoke select on all tables in schema public from $ROLE;
  for t in $(readable_columns) loop
    execute format('grant select (%s) on %I to $ROLE', t.cols, t.table_name);
  end loop;
end \$\$;
alter role $ROLE set default_transaction_read_only = on;
SQL
}

# Prints "missing" without the role, else how many readable columns it lacks
# (a migration added them since the last --setup).
check_sql() {
  cat <<SQL
select case when not exists (select from pg_roles where rolname = '$ROLE') then 'missing'
  else (select count(*)::text
        from information_schema.columns c
        join pg_tables p on p.schemaname = c.table_schema and p.tablename = c.table_name
        where c.table_schema = 'public' and (c.table_name, c.column_name) not in ($SECRETS)
          and not has_column_privilege('$ROLE', format('public.%I', c.table_name), c.column_name, 'SELECT'))
  end
SQL
}

fail() { printf '\n✗ %s\n' "$1" >&2; exit 1; }

# .env.production sits in the main checkout; a worktree reads it from there.
env_file() {
  local here=.env.production main
  main="$(git rev-parse --path-format=absolute --git-common-dir)/../.env.production"
  if [[ -f "$here" ]]; then echo "$here"; elif [[ -f "$main" ]]; then echo "$main"; fi
}

main() {
  cd "$(dirname "$0")/.."
  local file
  file=$(env_file)
  [[ -n "$file" ]] || fail "No .env.production: the beta wizards write it (scripts/setup-beta-infra.sh)."
  # The wizards write KEY='value' lines, so the shell reads them back.
  value() { (set +u; source "$file"; printf '%s' "${!1:-}"); }
  local key ip db
  key=$(value SSH_KEY_PATH); ip=$(value SERVER_IP); db=$(value DB_UUID)
  [[ -n "$key" && -n "$ip" && -n "$db" ]] || fail "$file lacks SSH_KEY_PATH, SERVER_IP or DB_UUID: run scripts/deploy-beta.sh."

  on_server() { ssh -i "$key" -o StrictHostKeyChecking=accept-new "root@$ip" "$@"; }
  as_postgres() { on_server "docker exec -i $db psql -U postgres -d $DB -v ON_ERROR_STOP=1 -qtA"; }

  if [[ "${1:-}" == "--setup" ]]; then
    printf 'This creates or refreshes the %s role on the production database (%s).\n' "$ROLE" "$ip"
    read -r -p 'Continue? [y/N] ' answer
    [[ "$answer" == [yY]* ]] || fail "Nothing changed."
    setup_sql | as_postgres
    printf '✓ %s reads every column except the sign-in secrets.\n' "$ROLE"
    return
  fi

  local state
  state=$(check_sql | as_postgres) || fail "Could not reach the database on $ip."
  [[ "$state" == missing ]] && fail "No $ROLE role on production yet: pnpm db:prod --setup"
  [[ "$state" == 0 ]] || printf '⚠ %s columns added since the last setup are hidden: pnpm db:prod --setup\n' "$state" >&2

  local ssh_tty=() exec_tty=-i args=""
  if [[ -t 0 && -t 1 ]]; then ssh_tty=(-t); exec_tty=-it; fi
  if (($#)); then args=$(printf ' %q' "$@"); fi
  exec ssh -i "$key" -o StrictHostKeyChecking=accept-new ${ssh_tty[@]+"${ssh_tty[@]}"} "root@$ip" \
    "docker exec $exec_tty $db psql -U $ROLE -d $DB$args"
}

# Sourced, it only defines the SQL: try it on the local database first.
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then main "$@"; fi
