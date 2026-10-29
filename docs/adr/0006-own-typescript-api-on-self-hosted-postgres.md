---
status: accepted
---

# Our own TypeScript API on a self-hosted PostgreSQL, not a backend-as-a-service

Homelibra's research pointed at Supabase (Postgres, row-level security and auth behind one client SDK, called straight from the app). We instead run our own API (Hono and tRPC on Node, Better Auth for sign-in, Drizzle over PostgreSQL) on a single VPS managed with Coolify. The deciding reasons are that some behaviour belongs on a server we write, the first being a cache of ISBN and DOI lookups shared by every library so a book is fetched from Crossref or Open Library once, and that Turkish search (ADR-0005) needs a PostgreSQL we control: our own image, extensions and dictionary files, which a hosted database does not allow.

## Considered options

- **Supabase, client talks to the database directly.** Least code and mature Expo support, but every rule lives in SQL policies and functions, server-side logic means Edge Functions, and the database cannot load custom search dictionaries.
- **Convex or Firebase.** Strong client SDKs, but no Turkish stemming and data locked in a proprietary store.
- **Own API on self-hosted PostgreSQL (chosen).** More to run, but the server is ordinary TypeScript and the database is ordinary PostgreSQL, so nothing is locked to a vendor and moving host is a restore.

## Consequences

- One repository: `apps/app` (Expo), `apps/api` (Hono, tRPC, Better Auth, Drizzle schema and migrations), `packages/core` (pure TypeScript domain logic: locator sort values, calendar conversion, Markdown export, Turkish text folding), `infra/postgres` (the custom PostgreSQL image). pnpm workspaces, no build orchestrator.
- Library isolation has two layers: every query is scoped to the signed-in account in code, and PostgreSQL row-level security checks the same thing again. The API connects as a role that does not own the tables, and each request runs in a transaction that sets the account id, so a forgotten `where` returns nothing rather than another scholar's notes.
- The shared lookup cache holds only what Crossref or Open Library returned, keyed by normalised ISBN-13 or DOI. A scholar's corrections to a source never go into it; they belong to that scholar's library. Misses are cached for seven days.
- Sign-in methods are Better Auth plugins (email code, Google, and Sign in with Apple when iOS ships), so adding one is configuration, not a migration.
- Backups, upgrades and server security are ours. Coolify takes a daily `pg_dump` to object storage in another location, kept for 14 days so that deleted accounts leave the backups within the 30 days promised for deletion.
- What Drizzle cannot express (text search configurations, custom dictionaries) lives in hand-written SQL migrations next to the generated ones.
