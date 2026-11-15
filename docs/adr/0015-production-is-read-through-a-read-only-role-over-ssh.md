---
status: accepted
---

# The Operator reads production through a read-only role over SSH, not by pointing a local stack at it

Looking at production data is sometimes needed: a scholar asks for support (ADR-0004), or a bug only shows with real rows. `pnpm db:prod` opens psql on the production database as `homelibra_readonly`. It goes through SSH and `docker exec` on the server, so no database port is opened. The role bypasses row-level security, so it sees every Library. It is granted SELECT on every column except the ones that let someone sign in: session tokens, sign-in codes, OAuth tokens and passwords. It holds no write privilege, and its transactions default to read-only as well. `pnpm db:prod --setup` creates the role and refreshes its grants. Grants are per column, so a migration that adds a table or a column needs a rerun; `pnpm db:prod` warns when one is due.

## Considered options

- **A local API and app on the production database (`pnpm dev --db prod`).** The first idea. A read-only role cannot run it, because signing in writes sessions. A writable role would put real Libraries one local bug away from damage.
- **psql as the `postgres` superuser on the server.** It works today and needs no role, but every query can change or drop data, and it shows the same secrets the API guards.
- **A read-only role over SSH (chosen).** It is safe to open casually, and it keeps secrets out of terminal scrollback. It costs a `--setup` rerun after schema changes.

## Consequences

- `select *` on `session`, `verification` or `account_provider` fails; name the columns.
- The role is created by hand (`--setup`), not by `infra/postgres`, so a fresh server has no read-only access until the Operator runs it.
- The access promise in ADR-0004 still governs when the Operator may look; the tool only makes looking safe.
- On the server the role logs in without a password over the container's local socket, as `postgres` does. Network logins need a password, and it has none, so it cannot log in from outside.
