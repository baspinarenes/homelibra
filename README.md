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

Every command runs from the repository root. You need Node 24, pnpm, Docker Desktop and Go (`brew install go`; `pnpm dev` is a small Go program in [tools/dev](tools/dev)). For Android, Android Studio with an emulator or a phone with USB debugging on; for iOS, Xcode with a simulator.

```bash
pnpm install
pnpm dev
```

`pnpm dev` asks what to run (Android, iOS, web, or the API alone) and on which device: emulators and simulators first, then phones on USB; one that is not running is booted. It remembers the last answers. Then it starts Postgres, applies migrations, installs the dev build if the device lacks it, starts the API on :3000 and Metro on :8081, and opens the app. Sign-in codes appear in the `[api]` lines. Ctrl-C stops the API and Metro; Postgres keeps running.

To skip the questions:

```bash
pnpm dev:android   # or dev:ios, dev:web, dev:api
pnpm dev --platform android --device Pixel_8
pnpm dev --rebuild   # reinstall the dev build after a native dependency changes
```

`pnpm dev --help` lists the flags. A port that is taken stops it: in a terminal it offers to stop the process, otherwise it names the PID and exits. Only `--api-port` and `--metro-port` move a server, for a second checkout beside a running stack. Every checkout and worktree shares the one Postgres (compose project `homelibra`).

The dev build is its own app, "Homelibra Dev" (`app.homelibra.dev`, scheme `homelibra-dev`), installed beside the beta app with its own sign-in and outbox. `APP_VARIANT=development` selects it in [apps/app/app.config.ts](apps/app/app.config.ts); `pnpm dev` and EAS's development profile set it. Without it, the config is `app.json` as written, which preview and production build.

| Command | What it does |
| --- | --- |
| `pnpm check` | everything CI checks: theme fresh, types, package boundaries, lint, unit and script tests, the dev CLI |
| `pnpm test:api` | API integration tests (needs `pnpm db:up`) |
| `pnpm db:up` / `pnpm db:migrate` | start Postgres / apply migrations |
| `pnpm db:generate` | write a migration from `apps/api/src/db/schema.ts` |
| `pnpm db:prod` | psql on production as a read-only role, over SSH; `--setup` creates the role or refreshes it after a migration ([ADR-0015](docs/adr/0015-production-is-read-through-a-read-only-role-over-ssh.md)) |
| `pnpm invite add <email>` | invite an address to the closed beta, locally |
| `pnpm gen component <area> <name>` | a new component in `apps/app/src/features/<area>` ([apps/app/README.md](apps/app/README.md)); `pnpm gen ui <name>` for `@homelibra/ui` |
| `pnpm gen:theme` | regenerate the Tailwind theme after changing `packages/ui/src/lib/tokens.ts` |
| `pnpm e2e` | the Maestro smoke flow (sign in, add a Source, capture a Note) on an emulator or simulator, after `pnpm dev --e2e` ([apps/app/e2e](apps/app/e2e)) |
| `pnpm version:bump patch` | raise `expo.version` (a PR that changes the app needs it) |

In development the web app calls the API on `localhost:3000`; set `EXPO_PUBLIC_API_URL` to reach it elsewhere.

## Migrations

`pnpm db:generate` writes a migration from `src/db/schema.ts`. SQL that Drizzle cannot express (row-level security, extensions, search functions) goes in a hand-written migration: `npx drizzle-kit generate --custom --name=<name>` inside `apps/api`. Every Library table gets account-scoped queries in code and a row-level security policy (see `drizzle/0002_library_isolation.sql`).

## Beta hosting

One Hetzner server running Coolify serves homelibra.com: the web app at the root, the API under `/api`, and Postgres with a daily `pg_dump` kept 14 days in another location. On `main`, CI pushes the API, web and Postgres images to the private GHCR and asks Coolify to redeploy. Scholars on Android install the EAS `preview` APK. The Operator sets this up with two wizards, which keep their values in the gitignored `.env.production`:

```bash
scripts/setup-beta-infra.sh   # accounts, domain, server, Coolify, buckets, Resend, Sentry, Expo
scripts/deploy-beta.sh        # database, backups, API and web, deploys from CI, restore drill, first APK
```

Invite a beta scholar from the API container: `docker exec <api container> tsx src/invite.ts add <email>`.
