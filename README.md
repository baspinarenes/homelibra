# Homelibra

A research-notes library for historians and other humanities scholars. Domain language is in [GLOSSARY.md](GLOSSARY.md), decisions in [docs/adr/](docs/adr/).

## Layout

pnpm workspaces, no build orchestrator (ADR-0006):

- `apps/app`: Expo universal app (Android, iOS, web SPA)
- `apps/api`: Hono + tRPC + Better Auth + Drizzle; schema and migrations in `apps/api/drizzle`
- `packages/core`: pure TypeScript domain logic shared by app and API
- `packages/example`: copy-me template for a new package (see [packages/README.md](packages/README.md))
- `infra/postgres`: our PostgreSQL image (`postgres:17` with `unaccent` and `pg_trgm`)

## Development

```bash
pnpm install
pnpm db:up                                # build and start our Postgres image
cp apps/api/.env.example apps/api/.env
pnpm --filter @homelibra/api db:migrate
pnpm --filter @homelibra/api dev          # API on :3000; sign-in codes print to the console
EXPO_PUBLIC_API_URL=http://localhost:3000 pnpm --filter @homelibra/app web
```

On the Android emulator the app reaches the API at `http://10.0.2.2:3000` by default.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm lint:boundaries   # packages are imported only through their entry points (packages/README.md)
pnpm test        # core unit tests and API integration tests (needs `pnpm db:up`)
```

## Migrations

`pnpm --filter @homelibra/api db:generate` writes a migration from `src/db/schema.ts`. SQL that Drizzle cannot express (row-level security, extensions, search functions) goes in a hand-written migration: `npx drizzle-kit generate --custom --name=<name>` inside `apps/api`. Every Library table gets account-scoped queries in code and a row-level security policy (see `drizzle/0002_library_isolation.sql`).
