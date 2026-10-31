# Homelibra

A research-notes library for historians and other humanities scholars. Domain language is in [GLOSSARY.md](GLOSSARY.md), decisions in [docs/adr/](docs/adr/).

## Layout

pnpm workspaces, no build orchestrator (ADR-0006):

- `apps/app`: Expo universal app (Android, iOS, web SPA)
- `apps/api`: Hono + tRPC + Better Auth + Drizzle; schema and migrations in `apps/api/drizzle`
- `packages/core`: pure TypeScript domain logic shared by app and API
- `packages/example`: copy-me template for a new package (see [packages/README.md](packages/README.md))
- `infra/postgres`: our PostgreSQL image (`postgres:18` with `unaccent` and `pg_trgm`)

## Development

We develop on a physical Android phone over USB, running our own dev build (Expo Go cannot load the app's native modules). Once: enable USB debugging on the phone and accept the prompt when you plug it in. Then:

```bash
pnpm install
pnpm dev
```

`pnpm dev` ([scripts/dev.sh](scripts/dev.sh)) starts Postgres, applies migrations, installs the dev build if the phone lacks it, reverses ports 3000 and 8081 onto the phone, starts the API and Metro, and opens the app. Sign-in codes appear in the `[api]` lines. JavaScript changes reload on save; after adding or upgrading a native dependency, run `pnpm dev --rebuild`. With several devices attached, pick one with `ANDROID_SERIAL=<id> pnpm dev` (ids from `adb devices`).

For the web app, run the API and Metro yourself:

```bash
pnpm --filter @homelibra/api dev
EXPO_PUBLIC_API_URL=http://localhost:3000 pnpm --filter @homelibra/app web
```

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm lint:boundaries   # packages are imported only through their entry points (packages/README.md)
pnpm test        # core unit tests and API integration tests (needs `pnpm db:up`)
```

## Migrations

`pnpm --filter @homelibra/api db:generate` writes a migration from `src/db/schema.ts`. SQL that Drizzle cannot express (row-level security, extensions, search functions) goes in a hand-written migration: `npx drizzle-kit generate --custom --name=<name>` inside `apps/api`. Every Library table gets account-scoped queries in code and a row-level security policy (see `drizzle/0002_library_isolation.sql`).

## Beta hosting

One Hetzner server running Coolify serves homelibra.com: the web app at the root, the API under `/api`, and Postgres with a daily `pg_dump` kept 14 days in another location. On `main`, CI pushes the API, web and Postgres images to the private GHCR and asks Coolify to redeploy. Scholars on Android install the EAS `preview` APK. The Operator sets this up with two wizards, which keep their values in the gitignored `.env.production`:

```bash
scripts/setup-beta-infra.sh   # accounts, domain, server, Coolify, buckets, Resend, Sentry, Expo
scripts/deploy-beta.sh        # database, backups, API and web, deploys from CI, restore drill, first APK
```

Invite a beta scholar from the API container: `docker exec <api container> tsx src/invite.ts add <email>`.
