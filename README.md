# Noisy Streetss website

Next.js 16 with Payload CMS 3 inside it. The admin is at `/admin`.

## Local set-up

You need Node 24 (`fnm use` reads `.nvmrc`) and Docker.

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
| `npm test` | Unit and integration tests, against the separate `noisy_streetss_test` database |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run generate:types` | Regenerates `src/payload-types.ts` after a schema change |
| `npm run generate:importmap` | Regenerates the admin import map after adding admin components or editor features |
| `npm run migrate:create -- <name>` | Writes a migration for a schema change |
| `npm run migrate` | Runs pending migrations |

## Schema changes

Locally, Payload keeps the database in step with the code automatically. Every schema change still needs a migration (`npm run migrate:create -- <name>`), committed with the change. Production only ever runs migrations. On Supabase, run them with `DATABASE_URI` set to the direct connection string (`DIRECT_DATABASE_URI`), not the pooler.

## Specs and plans

Design specs and implementation plans live in `docs/superpowers/`.
