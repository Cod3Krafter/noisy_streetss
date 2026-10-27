# Noisy Streetss website

Next.js 16 with Payload CMS 3 inside it. The admin is at `/admin`.

## Local set-up

You need Node 24 (`fnm use` reads `.nvmrc`) and Docker. VS Code terminals in this project switch to Node 24 through fnm automatically; in any other terminal, run `fnm use` first. `npm install` refuses a Node version outside `engines`. Docker runs the database and the mail catcher, so it is needed for the dev server and for the integration tests (the unit tests do not need it).

Settings go in `.env`, copied from `.env.example`. The names are `DATABASE_URI`, `TEST_DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `CRON_SECRET`, the `SMTP_*` group and the `S3_*` group (the last two stay empty locally). Section 5.3 of the B1 spec, `docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md`, explains each one.

```bash
fnm use
docker compose up -d        # Postgres on 5432, Mailpit on 21025 (inbox at http://localhost:28025)
cp .env.example .env        # then fill in PAYLOAD_SECRET and CRON_SECRET
npm install
npm run seed                # dummy content; safe to rerun, local databases only
npm run dev                 # http://localhost:3000 and http://localhost:3000/admin
```

Seeded logins (local only): `admin@noisystreetss.test` / `admin-dev-password` and `editor@noisystreetss.test` / `editor-dev-password`.

## Commands

| Command | What it does |
|---|---|
| `npm test` | Unit and integration tests. The integration part empties and rebuilds the separate `noisy_streetss_test` database first, never the development one |
| `npm run test:unit` | Unit tests only. No database or Docker needed |
| `npm run test:int` | Integration tests only (resets the test database first) |
| `npm run test:shuffle` | Integration tests with the files in random order, to catch tests that depend on another file |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run generate:types` | Regenerates `src/payload-types.ts` after a schema change |
| `npm run generate:importmap` | Regenerates the admin import map after adding admin components or editor features |
| `npm run migrate:create -- <name>` | Writes a migration for a schema change |
| `npm run migrate` | Runs pending migrations |

Never run two test runs at the same time: they share the one test database.

## Schema changes

Locally, Payload pushes the code's schema into the database automatically, but only when the database is a local one (host `localhost` or `127.0.0.1`, database `noisy_streetss` or ending `_test`); any other database is left alone and a warning is logged. Every schema change still needs a migration (`npm run migrate:create -- <name>`), committed with the change, and the migrations should be proven on an empty local database before a deploy. Production only ever runs migrations, by hand. On Supabase, run them with `DATABASE_URI` set to the direct connection string (`DIRECT_DATABASE_URI`), not the pooler, but never put that address in `.env`: pass it inline for that one command, for example in PowerShell `$env:DATABASE_URI = Read-Host 'Direct connection string'; npm run migrate; Remove-Item Env:DATABASE_URI` (Read-Host keeps the string, which holds the password, out of PowerShell's saved command history). The dev server changes the schema of a local database automatically and leaves any other database alone, but keeping the live address out of `.env` means a stray `npm run dev` can never point at it.

`drizzle-orm` is pinned to the version `@payloadcms/db-postgres` uses, so npm installs a single copy and generated migrations type-check. Bump it together with Payload.

## Production hardening

The checklist of what to decide, set up and check before and after the first production deploy is section 11 of the B1 spec (`docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md`).

## Specs and plans

Design specs and implementation plans live in `docs/superpowers/`.
