# B1: Payload and Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Noisy Streetss prototype into a Next.js app with Payload CMS inside it, where staff can log in at `/admin` and manage every content type the new site needs, filled with dummy content, on a local database.

**Architecture:** Payload 3 runs inside the existing Next.js app. The prototype moves into a `src/app/(frontend)/` route group, and Payload's admin and REST API live in `src/app/(payload)/`. Content lives in a local Postgres database in Docker. Mail goes to a local Mailpit inbox. Content rules (who can read what, date-based status, overlap checks) live in small pure functions under `src/rules/` that collections and tests both use. Production settings (Supabase Storage, Resend, Vercel Cron) are wired in but switched off until their environment variables exist.

**Tech Stack:** Next.js 16.3.8, React 19.2.9, Payload 3.90.2 (`@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/plugin-seo`, `@payloadcms/email-nodemailer`, `@payloadcms/storage-s3`), Postgres 17.11 and Mailpit in Docker, Vitest 4.0.18, TypeScript 5.9.3, npm, Node 24 LTS.

**Spec:** `docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md` (approved 21 October 2026). When this plan and the spec disagree, the spec wins; stop and ask.

## Global Constraints

- `payload` and every `@payloadcms/*` package: `3.90.2`, exact.
- `next` and `eslint-config-next`: `16.3.8`, exact.
- `react` and `react-dom`: `19.2.9`, exact. `@types/react`: `19.2.18`. `@types/react-dom`: `19.2.7`.
- `typescript`: `5.9.3`. `sharp`: `0.35.4` (the version Payload 3.90.2's templates pin). `vitest`: `4.0.18`. `vite-tsconfig-paths`: `6.0.5`. `graphql`: the newest `16.x` (Payload peer dependency).
- Node.js 24 LTS, pinned in `.nvmrc` (`24`) and `package.json` `engines` (`"node": "24.x"`). The machine has Node 26 by default; use `fnm use` in the project folder.
- Docker images: `postgres:17.11` and `axllent/mailpit:v1.31.6`.
- Every added or upgraded package is pinned exactly: install with `npm install --save-exact` (`-E`). No `^` or `~` on anything this plan adds or upgrades.
- Package manager: npm. Do not add pnpm or yarn files.
- Git: every task is built on its own branch, created from `dev` before the task starts (Task 1 creates `main` and `dev`). Commit only on that branch and never switch branches. Each branch is merged into `dev` with `git merge --no-ff` after its review passes. Nothing is pushed.
- Environment variable names are fixed: `DATABASE_URI`, `DIRECT_DATABASE_URI`, `TEST_DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `CRON_SECRET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_MEDIA`, `S3_BUCKET_MANUSCRIPTS`, `MEDIA_DIR`, `MANUSCRIPTS_DIR`.
- `AGENTS.md`: this Next.js version has breaking changes. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.
- Dummy content only. Do not fetch from, scrape or reference noisystreetss.com.
- Writing rules for every comment, commit message, admin label and seed string: no em dashes or en dashes (use commas, colons, brackets or separate sentences; "to" or a hyphen for ranges), and never "we", "us" or "our" (proper names such as the page names "Who We Are" and "Our Writers" are fine). The global writing rules in the developer's CLAUDE.md apply too.
- Commit messages are written in the developer's own voice. No `Co-Authored-By` trailer, no "Generated with Claude Code" line, no robot emoji.
- UI checks: after any change that can affect what a page looks like, screenshot it with Playwright at desktop (1440 px wide) and phone (390 px wide) widths and look at the screenshots. Close Playwright browsers and stop dev servers at the end of the task.
- Admin field labels and descriptions are written for non-technical staff in plain British English.

## File map

```
.nvmrc                                   Node 24 pin
docker-compose.yml                       postgres + mailpit
docker/postgres-init/01-test-database.sql  creates the test database on first start
.env.example                             every variable, documented
vercel.json                              Vercel Cron for the job queue (production)
vitest.config.mts                        test runner config
tests/setup.ts                           loads .env, points tests at the test database
tests/helpers/payload.ts                 one Payload instance per test file, user factories
tests/unit/*.spec.ts                     pure-function tests (no database)
tests/int/*.int.spec.ts                  Local API tests against the test database
src/payload.config.ts                    Payload config: collections, globals, plugins, email, jobs
src/payload-types.ts                     generated by `npm run generate:types`, committed
src/app/(frontend)/                      the prototype (moved, unchanged)
src/app/(payload)/                       Payload admin and REST routes (copied from template)
src/app/favicon.ico                      stays at the app root (Next only reads it there)
src/access/index.ts                      shared access rules
src/fields/slug.ts                       slug field + slugify
src/fields/richText.ts                   article body editor with the video block
src/rules/*.ts                           date and status rules, query builders, validators
src/hooks/formAlert.ts                   staff alert email for form entries
src/hooks/honeypot.ts                    drops spam entries
src/collections/*.ts                     one file per collection
src/collections/forms/*.ts               the five form-entry collections
src/globals/pageRecord.ts                factory for the 20 page records
src/globals/pageRecords.ts               the 20 page records
src/globals/SiteSettings.ts, ShopSettings.ts
src/seed/*.ts                            dummy content, the seed function and its guard
src/migrations/                          generated migration files, committed
```

`src/rules/` is not in the spec's folder sketch. It holds the "worked out when read" rules (submission call status, upcoming events, visible careers, active announcements) as pure functions, so the collections, the future frontend and the tests share one definition.

---
### Task 1: Repository, Node 24 and the version upgrades

The prototype goes into git as it stands, then Next.js, React and TypeScript move to the pinned versions. Screenshots taken before and after the upgrade prove the prototype still renders the same.

**Files:**
- Create: `.nvmrc`
- Modify: `.gitignore`
- Modify: `package.json` (engines, upgraded versions)
- Modify: `package-lock.json` (by npm)

**Interfaces:**
- Consumes: nothing.
- Produces: a git repository with a first commit; Node 24 active through `.nvmrc`; `npm run build` passing on Next 16.3.8 and React 19.2.9. Later tasks assume these versions.

- [ ] **Step 1: Take baseline screenshots of the prototype**

Run `npm run dev` (Node as installed is fine for this step). With the Playwright browser tools:

1. Resize to 1440 x 900. Open `http://localhost:3000`. Take a full-page screenshot, saved as `.screenshots/before-home-desktop.png`.
2. Click the "Publishing" link in the top navigation. Full-page screenshot: `.screenshots/before-publishing-desktop.png`.
3. Click "Shop". Full-page screenshot: `.screenshots/before-shop-desktop.png`.
4. Resize to 390 x 844 and reload. Repeat 1 to 3 with the phone menu (the menu button opens it) and save as `before-*-phone.png`.

Look at every screenshot. Note anything already broken, so it isn't blamed on the upgrade. Stop the dev server.

- [ ] **Step 2: Add ignore rules**

Append to `.gitignore`:

```gitignore

# env files: keep the documented example
!.env.example

# Payload local file storage (development and tests)
/media/
/manuscripts/
/.test-uploads/

# local screenshots for visual checks
/.screenshots/

# client correspondence and the signed proposal: business records, not source
/refs/
/docs/*.pdf
/docs/*.docx
/docs/*.html
```

The existing `.env*` rule already keeps `.env` out of git. Docker uses named volumes, so there is no volume folder to ignore. The repository will end up in the client's GitHub account, so the proposal and client documents stay out of it. The specs and plans under `docs/superpowers/` are committed.

- [ ] **Step 3: Start the repository with the prototype as it stands**

```bash
git init -b main
git add -A
git status --short | head -50
```

Expected: `src/`, `public/`, config files and `docs/` are listed. `node_modules/`, `.next/`, `.screenshots/`, `.playwright-mcp/`, `_vercel-live-mirror/` and `_dev-check/` are not.

```bash
git commit -m "Add the Noisy Streetss prototype as it stands"
git branch dev
git checkout -b chore/node-24-and-upgrades dev
```

The prototype commit is the only one made on `main`. Everything after it is built on branches from `dev`.

- [ ] **Step 4: Pin Node 24**

Create `.nvmrc`:

```
24
```

Then:

```bash
fnm install 24
fnm use
node -v
```

Expected: `v24.` followed by the newest 24.x patch (24.22.x at the time of writing).

In `package.json`, add after `"private": true,`:

```json
  "engines": {
    "node": "24.x"
  },
```

- [ ] **Step 5: Upgrade Next.js, React and TypeScript**

```bash
npm install --save-exact next@16.3.8 react@19.2.9 react-dom@19.2.9
npm install --save-dev --save-exact eslint-config-next@16.3.8 @types/react@19.2.18 @types/react-dom@19.2.7 typescript@5.9.3 @types/node@24
```

Expected: both finish without `ERESOLVE` errors. Check `package.json`: the seven packages above have exact versions with no `^`. `@types/node` shows the newest `24.x` exactly.

- [ ] **Step 6: Read the Next.js guides for this version**

```bash
ls node_modules/next/dist/docs/
```

Read the guides on upgrading to 16.3, route groups and multiple root layouts, and `next.config` (file names vary by version; search with `grep -ril "route group" node_modules/next/dist/docs/ | head` and `grep -ril "upgrad" node_modules/next/dist/docs/ | head`). Note any deprecation that touches `src/app/layout.tsx`, `next.config.ts` or `next/font`. If one does, fix it in this task and mention it in the commit message.

- [ ] **Step 7: Check that it still builds**

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all three exit with code 0. The build lists the `/` route.

- [ ] **Step 8: Compare against the baseline**

Run `npm run dev`. Repeat Step 1 exactly, saving as `after-*.png`. Look at each `after` screenshot next to its `before` twin. Fonts, colours, spacing and the phone menu must match. Any difference is a regression to fix before committing. Stop the dev server and close the Playwright browser.

- [ ] **Step 9: Commit**

```bash
git add .gitignore .nvmrc package.json package-lock.json
git commit -m "Pin Node 24 and upgrade to Next.js 16.3.8, React 19.2.9 and TypeScript 5.9.3"
```

---

### Task 2: Local database and mail catcher

Postgres and Mailpit run in Docker. Postgres holds two databases: `noisy_streetss` for development and `noisy_streetss_test` for the automated tests, so running the tests never touches development content.

**Files:**
- Create: `docker-compose.yml`
- Create: `docker/postgres-init/01-test-database.sql`
- Create: `.env.example`
- Create: `.env` (not committed)

**Interfaces:**
- Consumes: nothing.
- Produces: Postgres on `127.0.0.1:5432` (user `postgres`, password `postgres`), databases `noisy_streetss` and `noisy_streetss_test`; Mailpit SMTP on `127.0.0.1:21025` and its inbox at `http://localhost:28025`; a filled-in `.env` that every later task reads.

- [ ] **Step 1: Write the Docker services**

Create `docker-compose.yml`:

```yaml
# Local development services. Nothing here is used in production.
services:
  postgres:
    image: postgres:17.11
    restart: unless-stopped
    ports:
      - "127.0.0.1:5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: noisy_streetss
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/postgres-init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U postgres -d noisy_streetss"]
      interval: 5s
      timeout: 3s
      retries: 10

  mailpit:
    image: axllent/mailpit:v1.31.6
    restart: unless-stopped
    ports:
      - "127.0.0.1:21025:1025"
      - "127.0.0.1:28025:8025"

volumes:
  pgdata:
```

Create `docker/postgres-init/01-test-database.sql`:

```sql
-- Runs once, the first time the Postgres volume is created.
-- The automated tests use this database, so they never touch development content.
CREATE DATABASE noisy_streetss_test;
```

- [ ] **Step 2: Document the environment**

Create `.env.example`:

```bash
# Copy to .env and fill in. .env is never committed.

# Database. Locally this is the Docker Postgres from docker-compose.yml.
# In production (Supabase) this is the connection pooler string, which shares a
# few database connections between many requests.
DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:5432/noisy_streetss
# Production only: Supabase's direct connection string. Migrations run with
# DATABASE_URI set to this value. Not used locally.
DIRECT_DATABASE_URI=
# Used only by the automated tests.
TEST_DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:5432/noisy_streetss_test

# Long random string. Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
PAYLOAD_SECRET=
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Email. Locally this is Mailpit (inbox at http://localhost:28025).
# In production: Resend's SMTP settings, or the client's existing sending service.
SMTP_HOST=127.0.0.1
SMTP_PORT=21025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Noisy Streetss <website@noisystreetss.test>

# Protects the job queue endpoint that Vercel Cron calls in production.
CRON_SECRET=

# File storage. Leave empty locally: files are kept on disk.
# In production these are the Supabase Storage S3 settings.
S3_ENDPOINT=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_MEDIA=
S3_BUCKET_MANUSCRIPTS=

# Local file folders. Defaults: ./media and ./manuscripts. The tests use ./.test-uploads.
MEDIA_DIR=
MANUSCRIPTS_DIR=
```

- [ ] **Step 3: Create the real `.env`**

```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the printed value after `PAYLOAD_SECRET=` in `.env`. Run the command again and paste a second value after `CRON_SECRET=`.

- [ ] **Step 4: Start the services and check them**

```bash
docker compose up -d
docker compose ps
```

Expected: `postgres` shows `healthy` (wait a few seconds and rerun if it says `starting`), `mailpit` shows `running`. If port 5432 is already taken, a local Postgres is running: stop it rather than changing the port, because the port is in every connection string.

```bash
docker compose exec postgres psql -U postgres -c "\l" | grep noisy_streetss
```

Expected: two lines, `noisy_streetss` and `noisy_streetss_test`.

Open `http://localhost:28025` in the Playwright browser. Expected: the Mailpit inbox, empty. Close the browser.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml docker/postgres-init/01-test-database.sql .env.example
git status --short
```

Expected: `.env` is not listed.

```bash
git commit -m "Add local Postgres and Mailpit in Docker, and document the environment"
```

---
### Task 3: Payload inside the Next.js app

Payload is installed, the prototype moves into the `(frontend)` route group unchanged, and Payload's admin and REST routes go into `(payload)`. At the end, `/admin` shows Payload's "create first user" screen and `/` still shows the prototype.

**Files:**
- Modify: `package.json` (`"type": "module"`, scripts, dependencies)
- Move: `src/app/layout.tsx` to `src/app/(frontend)/layout.tsx`
- Move: `src/app/page.tsx` to `src/app/(frontend)/page.tsx`
- Move: `src/app/globals.css` to `src/app/(frontend)/globals.css`
- Keep: `src/app/favicon.ico` where it is. Next only reads the favicon from the top of `app/`.
- Create: `src/app/(payload)/layout.tsx`, `src/app/(payload)/custom.scss`, `src/app/(payload)/admin/[[...segments]]/page.tsx`, `src/app/(payload)/admin/[[...segments]]/not-found.tsx`, `src/app/(payload)/api/[...slug]/route.ts`
- Create: `src/app/(payload)/admin/importMap.js` (generated)
- Create: `src/payload.config.ts`
- Create: `src/collections/Users.ts` (minimal here; Task 5 completes it)
- Create: `src/payload-types.ts` (generated)
- Modify: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`

**Interfaces:**
- Consumes: `.env` from Task 2 (`DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`).
- Produces: `src/payload.config.ts` exporting the Payload config as default, importable as `@payload-config`; npm scripts `payload`, `generate:types`, `generate:importmap`; generated types in `src/payload-types.ts` (import as `@/payload-types`). Every later task adds to `collections`, `globals` or `plugins` in this config.

GraphQL is switched off (`graphQL: { disable: true }`), so the template's two GraphQL route files are not copied. The site uses the REST and Local APIs only.

- [ ] **Step 1: Install Payload and its packages**

```bash
npm install --save-exact payload@3.90.2 @payloadcms/next@3.90.2 @payloadcms/ui@3.90.2 @payloadcms/db-postgres@3.90.2 @payloadcms/richtext-lexical@3.90.2 @payloadcms/plugin-seo@3.90.2 @payloadcms/email-nodemailer@3.90.2 @payloadcms/storage-s3@3.90.2 sharp@0.35.4 graphql@16 cross-env@7.0.3
```

Expected: no `ERESOLVE` error. If npm reports a peer conflict, read it before reaching for `--legacy-peer-deps`: a conflict on `next` or `react` means a version in Global Constraints was mistyped. Check `package.json`: every package above is pinned exactly, and `graphql` shows the newest `16.x` exactly.

- [ ] **Step 2: Switch the project to ES modules and add scripts**

In `package.json`, add `"type": "module",` after `"private": true,`. Replace the `scripts` block with:

```json
  "scripts": {
    "dev": "cross-env NODE_OPTIONS=--no-deprecation next dev",
    "build": "cross-env NODE_OPTIONS=--no-deprecation next build",
    "start": "cross-env NODE_OPTIONS=--no-deprecation next start",
    "lint": "eslint",
    "payload": "cross-env NODE_OPTIONS=--no-deprecation payload",
    "generate:types": "cross-env NODE_OPTIONS=--no-deprecation payload generate:types",
    "generate:importmap": "cross-env NODE_OPTIONS=--no-deprecation payload generate:importmap"
  },
```

Payload is ES-module only. The existing config files are already `.mjs` or `.ts`, so nothing else changes.

- [ ] **Step 3: Move the prototype into its route group**

```bash
mkdir -p "src/app/(frontend)"
git mv src/app/layout.tsx "src/app/(frontend)/layout.tsx"
git mv src/app/page.tsx "src/app/(frontend)/page.tsx"
git mv src/app/globals.css "src/app/(frontend)/globals.css"
```

The files are not edited. `layout.tsx` imports `./globals.css`, which moved with it, and every other import uses the `@/` alias.

- [ ] **Step 4: Add Payload's route files**

These five files are copied from Payload's `with-postgres` template at tag `v3.90.2`. They are marked as generated and are never edited.

`src/app/(payload)/layout.tsx`:

```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
```

`src/app/(payload)/custom.scss`: an empty file.

`src/app/(payload)/admin/[[...segments]]/page.tsx`:

```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap })

export default Page
```

`src/app/(payload)/admin/[[...segments]]/not-found.tsx`:

```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const NotFound = ({ params, searchParams }: Args) =>
  NotFoundPage({ config, params, searchParams, importMap })

export default NotFound
```

`src/app/(payload)/api/[...slug]/route.ts`:

```ts
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
```

- [ ] **Step 5: Write the first Payload config and a minimal staff collection**

`src/collections/Users.ts` (Task 5 replaces this with the full version):

```ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [],
}
```

`src/payload.config.ts`:

```ts
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users],
  globals: [],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || undefined,
  graphQL: {
    disable: true,
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [],
})
```

- [ ] **Step 6: Wrap the Next.js config**

Replace `next.config.ts` with:

```ts
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Next 16.3 rewrites AGENTS.md on every `next dev` unless this is off.
  // AGENTS.md is kept as written; it already points agents at the bundled docs.
  agentRules: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // From Payload's template: lets `.js` imports inside Payload's packages resolve to `.ts` sources.
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return webpackConfig;
  },
  turbopack: {
    root: path.resolve(dirname),
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
```

Payload's template also adds `images.localPatterns` for `/api/media/file/**`. It is left out here on purpose: once `localPatterns` exists, Next blocks every local image path not listed, which would break the prototype's photos. The frontend phase adds it, with the prototype paths, when pages start showing Payload images.

- [ ] **Step 7: Add the config alias to TypeScript and ignore generated files in ESLint**

In `tsconfig.json`, change `"target": "ES2017"` to `"target": "ES2022"`, change `"lib"` to `["dom", "dom.iterable", "ES2022"]`, and replace `"paths"` with:

```json
    "paths": {
      "@/*": ["./src/*"],
      "@payload-config": ["./src/payload.config.ts"]
    }
```

In `eslint.config.mjs`, add these lines inside `globalIgnores([...])`, after `"_vercel-live-mirror/**",`:

```js
    // Generated by Payload
    "src/payload-types.ts",
    "src/app/(payload)/admin/importMap.js",
    "src/migrations/**",
```

- [ ] **Step 8: Generate the import map and types**

```bash
npm run generate:importmap
npm run generate:types
```

Expected: `src/app/(payload)/admin/importMap.js` exists and exports `importMap`; `src/payload-types.ts` exists and contains `export interface User`. Both commands connect to the database, so Docker must be running.

- [ ] **Step 9: Check the admin and the prototype**

```bash
npm run dev
```

With the Playwright browser tools:

1. Open `http://localhost:3000/admin`. Expected: Payload's "Create first user" screen. Do not create a user yet.
2. Repeat Task 1 Step 1 (home, Publishing and Shop, at 1440 x 900 and 390 x 844), saving as `.screenshots/payload-*.png`. Compare each with its `after-*` twin from Task 1. Expected: identical, including every photo.

Then in a second terminal:

```bash
npm run lint
npx tsc --noEmit
```

Expected: both exit 0. Stop the dev server, close the browser, then:

```bash
npm run build
```

Expected: exit 0. The route list includes `/`, `/admin/[[...segments]]` and `/api/[...slug]`.

- [ ] **Step 10: Commit**

```bash
git add -A
git status --short
```

Expected: no `.env`, `media/` or `.screenshots/` entries.

```bash
git commit -m "Install Payload 3.90.2 inside the Next.js app and move the prototype into its own route group"
```

---
### Task 4: Test setup against the test database

Vitest runs two kinds of test: unit tests for pure functions (`tests/unit/`) and integration tests that use Payload's Local API (`tests/int/`). Every run starts by emptying `noisy_streetss_test`, and Payload rebuilds the tables on start-up, so tests always begin from a clean database and never touch development content.

**Files:**
- Modify: `package.json` (test script, dev dependencies)
- Create: `vitest.config.mts`
- Create: `tests/env.ts`
- Create: `tests/globalSetup.ts`
- Create: `tests/setup.ts`
- Create: `tests/helpers/payload.ts`
- Test: `tests/int/setup.int.spec.ts`

**Interfaces:**
- Consumes: `@payload-config` (Task 3); `TEST_DATABASE_URI` in `.env` (Task 2).
- Produces: `npm test`; `getTestPayload(): Promise<Payload>` from `tests/helpers/payload.ts`. Every later test file uses it.

Tests run one file at a time (`fileParallelism: false`), because they share one database.

- [ ] **Step 1: Install the test tools**

```bash
npm install --save-dev --save-exact vitest@4.0.18 vite-tsconfig-paths@6.0.5 pg@8.20.0 @types/pg@8
```

`pg` 8.20.0 is the version `@payloadcms/db-postgres@3.90.2` uses. The tests use it directly only to empty the test database.

Add to the `scripts` block of `package.json`:

```json
    "test": "cross-env NODE_OPTIONS=--no-deprecation vitest run",
```

- [ ] **Step 2: Configure Vitest**

`vitest.config.mts`:

```ts
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.ts'],
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.spec.ts'],
    // One database, so one test file at a time.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
})
```

- [ ] **Step 3: Point the tests at the test database**

`tests/env.ts`:

```ts
import fs from 'node:fs'
import path from 'node:path'

/**
 * Loads .env, then points the database and upload folders at their test copies.
 * Throws if the test database name does not end in "_test", so a mistyped
 * setting can never empty the development database.
 */
export function applyTestEnvironment(): void {
  if (fs.existsSync('.env')) process.loadEnvFile('.env')

  const testUri = process.env.TEST_DATABASE_URI
  if (!testUri) {
    throw new Error('TEST_DATABASE_URI is missing. Copy it from .env.example into .env.')
  }
  if (!new URL(testUri).pathname.endsWith('_test')) {
    throw new Error('TEST_DATABASE_URI must name a database ending in "_test".')
  }

  process.env.DATABASE_URI = testUri
  process.env.MEDIA_DIR = path.resolve('.test-uploads/media')
  process.env.MANUSCRIPTS_DIR = path.resolve('.test-uploads/manuscripts')
  // No mail server in tests. Alert emails are checked with a spy on payload.sendEmail.
  process.env.SMTP_HOST = ''
}
```

`tests/globalSetup.ts`:

```ts
import fs from 'node:fs'
import pg from 'pg'

import { applyTestEnvironment } from './env'

/** Runs once before all test files: empties the test database and test uploads. */
export default async function setup(): Promise<void> {
  applyTestEnvironment()

  const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URI })
  await client.connect()
  await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;')
  await client.end()

  fs.rmSync('.test-uploads', { recursive: true, force: true })
}
```

`tests/setup.ts`:

```ts
import { applyTestEnvironment } from './env'

// Runs in each test worker before any test file is imported,
// so the Payload config reads the test settings.
applyTestEnvironment()
```

`tests/helpers/payload.ts`:

```ts
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

/** The Payload instance for tests. On first start it builds the tables in the test database. */
export function getTestPayload(): Promise<Payload> {
  return getPayload({ config })
}
```

- [ ] **Step 4: Write the first test**

`tests/int/setup.int.spec.ts`:

```ts
import pg from 'pg'
import { describe, expect, it } from 'vitest'

import { getTestPayload } from '../helpers/payload'

describe('test setup', () => {
  it('uses the test database', () => {
    expect(new URL(process.env.DATABASE_URI ?? '').pathname).toBe('/noisy_streetss_test')
  })

  it('builds the tables in the test database when Payload starts', async () => {
    await getTestPayload()
    const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URI })
    await client.connect()
    const { rows } = await client.query("SELECT to_regclass('public.users') AS name")
    await client.end()
    expect(rows[0].name).toBe('users')
  })
})
```

- [ ] **Step 5: Run it**

```bash
npm test
```

Expected: `2 passed`. The first run takes longer while Payload builds the tables. If it fails with `ECONNREFUSED`, Docker isn't running: `docker compose up -d`.

Check the development database was not touched:

```bash
docker compose exec postgres psql -U postgres -d noisy_streetss -c "\dt" | head
```

Expected: the tables Task 3's `generate:types` run created (for example `users`) are still there.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.mts tests
git commit -m "Add Vitest with a separate test database that is emptied before each run"
```

---

### Task 5: Staff accounts and the shared access rules

Staff log in through `users`, with a role of Admin or Editor. The shared access rules live in `src/access/index.ts`, and every later collection uses them.

**Files:**
- Create: `src/access/index.ts`
- Modify: `src/collections/Users.ts` (full version)
- Modify: `tests/helpers/payload.ts` (add `createStaff`)
- Test: `tests/unit/access.spec.ts`
- Test: `tests/int/users.int.spec.ts`

**Interfaces:**
- Consumes: `getTestPayload()` (Task 4).
- Produces, from `src/access/index.ts`:
  - `type StaffRole = 'admin' | 'editor'`
  - `isStaffUser(user: unknown): boolean`, `isAdminUser(user: unknown): boolean`
  - collection and global access: `anyone`, `nobody`, `isStaff`, `isAdmin`, `publishedOrStaff`, `adminOrSelf` (all `Access`)
  - field access: `isStaffField`, `isAdminField` (both `FieldAccess`)
  - `staffOnlyInAdmin: ({ user }) => boolean` and `adminOnlyInAdmin: ({ user }) => boolean`, for `admin.hidden`
- Produces, from `tests/helpers/payload.ts`: `createStaff(payload: Payload, role: StaffRole): Promise<User>`.

Payload reloads the logged-in account on every request, so `req.user.role` is always current. A member login arrives in B2; `isStaffUser` only accepts accounts from `users`, so a member can never pass a staff check.

- [ ] **Step 1: Write the failing unit tests for the role checks**

`tests/unit/access.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { isAdminUser, isStaffUser } from '@/access'

describe('role checks', () => {
  it('treats admins and editors from users as staff', () => {
    expect(isStaffUser({ id: 1, role: 'admin', collection: 'users' })).toBe(true)
    expect(isStaffUser({ id: 2, role: 'editor', collection: 'users' })).toBe(true)
  })

  it('accepts a staff user passed to the Local API without a collection', () => {
    expect(isStaffUser({ id: 1, role: 'editor' })).toBe(true)
  })

  it('rejects visitors, unknown roles and other login collections', () => {
    expect(isStaffUser(null)).toBe(false)
    expect(isStaffUser(undefined)).toBe(false)
    expect(isStaffUser({ id: 1, role: 'member', collection: 'users' })).toBe(false)
    expect(isStaffUser({ id: 1, role: 'admin', collection: 'members' })).toBe(false)
  })

  it('only treats admins as admins', () => {
    expect(isAdminUser({ id: 1, role: 'admin', collection: 'users' })).toBe(true)
    expect(isAdminUser({ id: 2, role: 'editor', collection: 'users' })).toBe(false)
    expect(isAdminUser(null)).toBe(false)
  })
})
```

- [ ] **Step 2: Run them to see them fail**

```bash
npx vitest run tests/unit/access.spec.ts
```

Expected: FAIL, because `@/access` doesn't exist yet.

- [ ] **Step 3: Write the access rules**

`src/access/index.ts`:

```ts
import type { Access, FieldAccess } from 'payload'

export type StaffRole = 'admin' | 'editor'

type MaybeStaff = { role?: unknown; collection?: unknown } | null | undefined

/** True for an Admin or Editor account from the `users` collection. */
export function isStaffUser(user: unknown): boolean {
  const candidate = user as MaybeStaff
  if (!candidate) return false
  if (candidate.collection !== undefined && candidate.collection !== 'users') return false
  return candidate.role === 'admin' || candidate.role === 'editor'
}

export function isAdminUser(user: unknown): boolean {
  return isStaffUser(user) && (user as MaybeStaff)?.role === 'admin'
}

export const anyone: Access = () => true
export const nobody: Access = () => false
export const isStaff: Access = ({ req }) => isStaffUser(req.user)
export const isAdmin: Access = ({ req }) => isAdminUser(req.user)

/** Staff read everything, including drafts. Visitors only receive published records. */
export const publishedOrStaff: Access = ({ req }) =>
  isStaffUser(req.user) ? true : { _status: { equals: 'published' } }

/** Admins reach every staff account, editors only their own. */
export const adminOrSelf: Access = ({ req }) => {
  if (isAdminUser(req.user)) return true
  if (isStaffUser(req.user) && req.user) return { id: { equals: req.user.id } }
  return false
}

export const isStaffField: FieldAccess = ({ req }) => isStaffUser(req.user)
export const isAdminField: FieldAccess = ({ req }) => isAdminUser(req.user)

/** For `admin.hidden`: hide from the admin menu unless the viewer is staff or an admin. */
export const staffOnlyInAdmin = ({ user }: { user: unknown }): boolean => !isStaffUser(user)
export const adminOnlyInAdmin = ({ user }: { user: unknown }): boolean => !isAdminUser(user)
```

- [ ] **Step 4: Run the unit tests to see them pass**

```bash
npx vitest run tests/unit/access.spec.ts
```

Expected: `4 passed`.

- [ ] **Step 5: Write the failing integration tests for staff accounts**

Add to `tests/helpers/payload.ts`:

```ts
import type { StaffRole } from '@/access'
import type { User } from '@/payload-types'

let staffCount = 0

/** Creates a staff account with a unique address. */
export async function createStaff(payload: Payload, role: StaffRole): Promise<User> {
  staffCount += 1
  return payload.create({
    collection: 'users',
    data: {
      email: `${role}-${Date.now()}-${staffCount}@noisystreetss.test`,
      password: 'test-password-123',
      name: `Test ${role} ${staffCount}`,
      role,
    },
  })
}
```

(Put the two `import` lines at the top of the file with the existing imports.)

`tests/int/users.int.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { createStaff, getTestPayload } from '../helpers/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('staff accounts', () => {
  it('makes the very first account an admin, whatever role was asked for', async () => {
    await payload.db.deleteMany({ collection: 'users', where: {} })
    const first = await payload.create({
      collection: 'users',
      data: { email: 'first@noisystreetss.test', password: 'test-password-123', name: 'First', role: 'editor' },
    })
    expect(first.role).toBe('admin')
  })

  it('lets an admin create an editor', async () => {
    const admin = await createStaff(payload, 'admin')
    const editor = await payload.create({
      collection: 'users',
      data: { email: 'new-editor@noisystreetss.test', password: 'test-password-123', name: 'New', role: 'editor' },
      overrideAccess: false,
      user: admin,
    })
    expect(editor.role).toBe('editor')
  })

  it('stops an editor creating accounts', async () => {
    const editor = await createStaff(payload, 'editor')
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'sneaky@noisystreetss.test', password: 'test-password-123', name: 'Sneaky', role: 'admin' },
        overrideAccess: false,
        user: editor,
      }),
    ).rejects.toThrow()
  })

  it('shows an editor only their own account', async () => {
    const editor = await createStaff(payload, 'editor')
    await createStaff(payload, 'editor')
    const result = await payload.find({ collection: 'users', overrideAccess: false, user: editor })
    expect(result.docs.map((doc) => doc.id)).toEqual([editor.id])
  })

  it('stops an editor promoting themselves', async () => {
    const editor = await createStaff(payload, 'editor')
    const updated = await payload.update({
      collection: 'users',
      id: editor.id,
      data: { role: 'admin', name: 'Renamed' },
      overrideAccess: false,
      user: editor,
    })
    expect(updated.name).toBe('Renamed')
    expect(updated.role).toBe('editor')
  })

  it('hides staff accounts from visitors', async () => {
    await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()
  })
})
```

- [ ] **Step 6: Run them to see them fail**

```bash
npx vitest run tests/int/users.int.spec.ts
```

Expected: FAIL. `users` has no `name` or `role` field yet, so, for example, the first test receives `undefined` instead of `'admin'`. (Vitest doesn't type-check, so the missing fields show up as wrong values, not compile errors.)

- [ ] **Step 7: Write the full staff collection**

Replace `src/collections/Users.ts`:

```ts
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { adminOnlyInAdmin, adminOrSelf, isAdmin, isAdminField, isStaffUser } from '@/access'

/** The very first account is always an admin, so a fresh site can't be locked out. */
const firstAccountIsAdmin: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  const { totalDocs } = await req.payload.count({ collection: 'users', req })
  return totalDocs === 0 ? { ...data, role: 'admin' } : data
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Staff account', plural: 'Staff accounts' },
  auth: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Settings',
    hidden: adminOnlyInAdmin,
  },
  access: {
    admin: ({ req }) => isStaffUser(req.user),
    create: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [firstAccountIsAdmin],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: { update: isAdminField },
      admin: {
        position: 'sidebar',
        description: 'Admins can also manage staff accounts and shop settings.',
      },
    },
  ],
}
```

Editors still reach their own profile through the account link in the admin, even though the Staff accounts list is hidden from them.

- [ ] **Step 8: Regenerate types and run the tests**

```bash
npm run generate:types
npm test
```

Expected: all tests pass, 12 in total (2 setup, 4 unit, 6 staff). `src/payload-types.ts` now shows `role: 'admin' | 'editor'` on `User`.

- [ ] **Step 9: Commit**

```bash
git add src/access src/collections/Users.ts src/payload-types.ts tests
git commit -m "Add staff accounts with Admin and Editor roles and the shared access rules"
```

---
### Task 6: Web addresses (slugs), categories and tags

Every type with its own page gets a `slug` field: made from the title when left empty, editable, and unique within its collection. Payload's built-in `slugField()` is marked experimental in 3.90.2, so this project uses its own small one. Categories and tags are the first collections to use it.

**Files:**
- Create: `src/fields/slug.ts`
- Modify: `src/access/index.ts` (add `staffWrites`)
- Create: `src/collections/Categories.ts`
- Create: `src/collections/Tags.ts`
- Modify: `src/payload.config.ts` (register both)
- Test: `tests/unit/slugify.spec.ts`
- Test: `tests/int/slugs.int.spec.ts`

**Interfaces:**
- Consumes: `anyone`, `isStaff` from `@/access` (Task 5).
- Produces:
  - `slugify(input: string): string` and `slugField(sourceField?: string): Field` (default source `'title'`) from `src/fields/slug.ts`
  - `staffWrites` from `@/access`: `{ create: isStaff, update: isStaff, delete: isStaff }`, spread into a collection's `access` next to a read rule
  - collections `categories` (`name`, `slug`, `description`) and `tags` (`name`, `slug`)

How the slug behaves:
- Left empty: made from the source field. If that slug is taken in the collection, `-2`, `-3` and so on is added.
- Typed by an editor: tidied with `slugify` (lower case, hyphens). A typed slug that is already taken is rejected by the database's unique rule, so an editor never silently gets a different address from the one they typed.
- Accented and Yoruba letters keep their base letter: "Adéọlá" becomes `adeola`.

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/slugify.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { slugify } from '@/fields/slug'

describe('slugify', () => {
  it('lower-cases and hyphenates', () => {
    expect(slugify('The Cartographer of Sandbars')).toBe('the-cartographer-of-sandbars')
  })

  it('keeps the base letter of accented and Yoruba letters', () => {
    expect(slugify('Adéọlá Ọ̀ṣun')).toBe('adeola-osun')
  })

  it('spells out ampersands and drops apostrophes', () => {
    expect(slugify('Writers & Readers')).toBe('writers-and-readers')
    expect(slugify("Don't Stop")).toBe('dont-stop')
    expect(slugify('Don’t Stop')).toBe('dont-stop')
  })

  it('trims stray hyphens and spaces', () => {
    expect(slugify('  --Hello,   World!--  ')).toBe('hello-world')
  })

  it('caps the length at 80 without a trailing hyphen', () => {
    const slug = slugify('word '.repeat(40))
    expect(slug.length).toBeLessThanOrEqual(80)
    expect(slug.endsWith('-')).toBe(false)
  })

  it('returns an empty string when nothing usable is left', () => {
    expect(slugify('!!!')).toBe('')
  })
})
```

- [ ] **Step 2: Run them to see them fail**

```bash
npx vitest run tests/unit/slugify.spec.ts
```

Expected: FAIL, because `@/fields/slug` doesn't exist.

- [ ] **Step 3: Write the slug field**

`src/fields/slug.ts`:

```ts
import type { CollectionSlug, Field, FieldHook, PayloadRequest } from 'payload'

const MAX_LENGTH = 80
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Turns any text into a web address part: "Adéọlá & Co." becomes "adeola-and-co". */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, '')
}

async function firstFreeSlug(
  req: PayloadRequest,
  collection: CollectionSlug,
  base: string,
  ownId: number | string | undefined,
): Promise<string> {
  for (let n = 1; n <= 50; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`
    const { totalDocs } = await req.payload.count({
      collection,
      where: {
        and: [{ slug: { equals: candidate } }, ...(ownId ? [{ id: { not_equals: ownId } }] : [])],
      },
      req,
    })
    if (totalDocs === 0) return candidate
  }
  return `${base}-${Date.now()}`
}

const generateSlug =
  (sourceField: string): FieldHook =>
  async ({ value, data, originalDoc, collection, req }) => {
    if (typeof value === 'string' && value.trim() !== '') return slugify(value)

    const source = data?.[sourceField] ?? originalDoc?.[sourceField]
    if (typeof source !== 'string') return value
    const base = slugify(source)
    if (!base || !collection) return base || value

    return firstFreeSlug(req, collection.slug as CollectionSlug, base, originalDoc?.id)
  }

/** The `slug` field: made from `sourceField` when left empty, editable, unique in its collection. */
export function slugField(sourceField = 'title'): Field {
  return {
    name: 'slug',
    label: 'Web address',
    type: 'text',
    // Not `required`: the slug is made in a hook when left empty, so creates may omit it.
    // `validate` below still refuses an empty or malformed slug on save.
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: `Made from the ${sourceField} when left empty. Lower-case letters, numbers and hyphens only.`,
    },
    hooks: {
      beforeValidate: [generateSlug(sourceField)],
    },
    validate: (value: unknown) =>
      typeof value === 'string' && SLUG_PATTERN.test(value)
        ? true
        : 'Use lower-case letters, numbers and single hyphens only.',
  }
}
```

- [ ] **Step 4: Run the unit tests to see them pass**

```bash
npx vitest run tests/unit/slugify.spec.ts
```

Expected: `6 passed`.

- [ ] **Step 5: Write the failing integration tests**

`tests/int/slugs.int.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { createStaff, getTestPayload } from '../helpers/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('slugs', () => {
  it('makes the slug from the name when left empty', async () => {
    const category = await payload.create({ collection: 'categories', data: { name: 'Short Fiction' } })
    expect(category.slug).toBe('short-fiction')
  })

  it('adds a number when the made slug is taken', async () => {
    const second = await payload.create({ collection: 'categories', data: { name: 'Short Fiction' } })
    expect(second.slug).toBe('short-fiction-2')
  })

  it('tidies a typed slug', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { name: 'Essays', slug: 'Long Essays!' },
    })
    expect(category.slug).toBe('long-essays')
  })

  it('rejects a typed slug that is already taken', async () => {
    await expect(
      payload.create({ collection: 'categories', data: { name: 'Another', slug: 'short-fiction' } }),
    ).rejects.toThrow()
  })

  it('keeps slugs unique per collection, not across collections', async () => {
    const tag = await payload.create({ collection: 'tags', data: { name: 'Short Fiction' } })
    expect(tag.slug).toBe('short-fiction')
  })
})

describe('categories and tags access', () => {
  it('lets visitors read but not create', async () => {
    const result = await payload.find({ collection: 'categories', overrideAccess: false })
    expect(result.totalDocs).toBeGreaterThan(0)
    await expect(
      payload.create({ collection: 'tags', data: { name: 'Spam' }, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('lets an editor create and delete', async () => {
    const editor = await createStaff(payload, 'editor')
    const tag = await payload.create({
      collection: 'tags',
      data: { name: 'Lagos' },
      overrideAccess: false,
      user: editor,
    })
    await payload.delete({ collection: 'tags', id: tag.id, overrideAccess: false, user: editor })
    const left = await payload.find({ collection: 'tags', where: { id: { equals: tag.id } } })
    expect(left.totalDocs).toBe(0)
  })
})
```

- [ ] **Step 6: Run them to see them fail**

```bash
npx vitest run tests/int/slugs.int.spec.ts
```

Expected: FAIL with an error that the collection `categories` can't be found.

- [ ] **Step 7: Add `staffWrites` and the two collections**

Append to `src/access/index.ts`:

```ts
/** Staff create, change and delete. Spread next to a read rule: `{ read: anyone, ...staffWrites }`. */
export const staffWrites = { create: isStaff, update: isStaff, delete: isStaff }
```

`src/collections/Categories.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Category', plural: 'Categories' },
  admin: {
    group: 'Editorial',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
  },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'description', type: 'textarea' },
  ],
}
```

`src/collections/Tags.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: 'Tag', plural: 'Tags' },
  admin: {
    group: 'Editorial',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
  },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
  ],
}
```

In `src/payload.config.ts`, import both and change `collections` to:

```ts
  collections: [Users, Categories, Tags],
```

with the imports:

```ts
import { Categories } from './collections/Categories'
import { Tags } from './collections/Tags'
```

- [ ] **Step 8: Regenerate types and run everything**

```bash
npm run generate:types
npm test
```

Expected: all pass (12 earlier, plus 6 slugify, plus 7 slug and access tests).

- [ ] **Step 9: Commit**

```bash
git add src tests
git commit -m "Add the shared web address field, and the categories and tags collections"
```

---
### Task 7: Images and manuscript files

Two upload collections. Images (`media`) are public and come in three sizes. Manuscripts are private: staff can read them, and only an admin can add or remove one through the admin. In production both move to Supabase Storage through Payload's S3 adapter (S3 being the storage protocol Supabase Storage accepts). The adapter stays switched off until the bucket settings exist, so files sit on local disk for now.

**Files:**
- Create: `src/collections/Media.ts`
- Create: `src/collections/Manuscripts.ts`
- Create: `src/hooks/fileSizeLimit.ts`
- Create: `src/storage.ts`
- Create: `src/seed/samplePdf.ts`
- Modify: `src/payload.config.ts` (register collections and storage plugins)
- Test: `tests/int/uploads.int.spec.ts`

**Interfaces:**
- Consumes: `anyone`, `isStaff`, `isAdmin`, `staffWrites` from `@/access`; `createStaff`, `getTestPayload` from `tests/helpers/payload.ts`.
- Produces:
  - collection `media`: upload with `alt` (required), `caption`, `credit`; sizes `thumbnail` (400 px), `card` (800 px), `large` (1600 px); focal point on
  - collection `manuscripts`: upload, PDF or `.docx` only, 10 MB maximum
  - `rejectFilesOver(maxBytes: number): CollectionBeforeOperationHook` from `src/hooks/fileSizeLimit.ts`
  - `storagePlugins(): Plugin[]` from `src/storage.ts`
  - `samplePdf(name?: string): { data: Buffer; mimetype: string; name: string; size: number }` from `src/seed/samplePdf.ts` (used by these tests, the form tests and the seed)

Payload 3.90.2 has no per-collection size limit (only a site-wide one, 20 MB by default), so the 10 MB manuscript limit is a hook. Manuscripts are not created by visitors directly: in the frontend phase, the submission form's server code will create the file and the submission together.

- [ ] **Step 1: Write the sample PDF helper**

`src/seed/samplePdf.ts`:

```ts
// A one-page PDF saying "Sample manuscript: dummy content". Used by the tests and the seed.
const SAMPLE_PDF = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 62 >> stream
BT /F1 18 Tf 72 760 Td (Sample manuscript: dummy content) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
trailer << /Root 1 0 R >>
%%EOF
`

export function samplePdf(name = 'sample-manuscript.pdf') {
  const data = Buffer.from(SAMPLE_PDF, 'latin1')
  return { data, mimetype: 'application/pdf', name, size: data.length }
}
```

- [ ] **Step 2: Write the failing tests**

`tests/int/uploads.int.spec.ts`:

```ts
import path from 'node:path'
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { samplePdf } from '@/seed/samplePdf'
import type { User } from '@/payload-types'

import { createStaff, getTestPayload } from '../helpers/payload'

const photo = path.resolve('public/images/unsplash/unsplash-1543002588-bfa74002ed7e.jpg')

let payload: Payload
let admin: User
let editor: User

beforeAll(async () => {
  payload = await getTestPayload()
  admin = await createStaff(payload, 'admin')
  editor = await createStaff(payload, 'editor')
})

describe('images', () => {
  it('lets an editor upload an image and makes the smaller sizes', async () => {
    const image = await payload.create({
      collection: 'media',
      data: { alt: 'A stack of books' },
      filePath: photo,
      overrideAccess: false,
      user: editor,
    })
    expect(image.sizes?.thumbnail?.filename).toBeTruthy()
    expect(image.sizes?.card?.filename).toBeTruthy()
  })

  it('requires alt text', async () => {
    await expect(
      payload.create({ collection: 'media', data: {} as { alt: string }, filePath: photo }),
    ).rejects.toThrow()
  })

  it('lets visitors see images but not upload them', async () => {
    const result = await payload.find({ collection: 'media', overrideAccess: false })
    expect(result.totalDocs).toBeGreaterThan(0)
    await expect(
      payload.create({ collection: 'media', data: { alt: 'Spam' }, filePath: photo, overrideAccess: false }),
    ).rejects.toThrow()
  })
})

describe('manuscripts', () => {
  it('lets an admin add a PDF', async () => {
    const doc = await payload.create({
      collection: 'manuscripts',
      data: {},
      file: samplePdf(),
      overrideAccess: false,
      user: admin,
    })
    expect(doc.mimeType).toBe('application/pdf')
  })

  it('refuses files over 10 MB', async () => {
    const data = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(11 * 1024 * 1024, 0x20)])
    await expect(
      payload.create({
        collection: 'manuscripts',
        data: {},
        file: { data, mimetype: 'application/pdf', name: 'too-big.pdf', size: data.length },
        user: admin,
      }),
    ).rejects.toThrow(/10 MB/)
  })

  it('refuses anything that is not a PDF or Word file', async () => {
    await expect(
      payload.create({ collection: 'manuscripts', data: {}, filePath: photo, user: admin }),
    ).rejects.toThrow()
  })

  it('lets editors read manuscripts but not add or delete them', async () => {
    const result = await payload.find({ collection: 'manuscripts', overrideAccess: false, user: editor })
    expect(result.totalDocs).toBeGreaterThan(0)
    await expect(
      payload.create({ collection: 'manuscripts', data: {}, file: samplePdf(), overrideAccess: false, user: editor }),
    ).rejects.toThrow()
    await expect(
      payload.delete({ collection: 'manuscripts', id: result.docs[0].id, overrideAccess: false, user: editor }),
    ).rejects.toThrow()
  })

  it('hides manuscripts from visitors', async () => {
    await expect(payload.find({ collection: 'manuscripts', overrideAccess: false })).rejects.toThrow()
  })
})
```

- [ ] **Step 3: Run them to see them fail**

```bash
npx vitest run tests/int/uploads.int.spec.ts
```

Expected: FAIL, because the collections `media` and `manuscripts` don't exist.

- [ ] **Step 4: Write the size limit hook**

`src/hooks/fileSizeLimit.ts`:

```ts
import { APIError, type CollectionBeforeOperationHook } from 'payload'

/** Rejects an upload larger than `maxBytes`. Payload only has a site-wide limit, not one per collection. */
export const rejectFilesOver =
  (maxBytes: number): CollectionBeforeOperationHook =>
  ({ operation, req }) => {
    const tooBig = (operation === 'create' || operation === 'update') && req.file && req.file.size > maxBytes
    if (tooBig) {
      const megabytes = Math.round(maxBytes / (1024 * 1024))
      throw new APIError(`The file must be ${megabytes} MB or smaller.`, 413, null, true)
    }
  }
```

- [ ] **Step 5: Write the two collections**

`src/collections/Media.ts`:

```ts
import path from 'node:path'
import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images' },
  admin: {
    group: 'Media',
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  access: { read: anyone, ...staffWrites },
  upload: {
    staticDir: process.env.MEDIA_DIR || path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'card', width: 800 },
      { name: 'large', width: 1600 },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt text',
      type: 'text',
      required: true,
      admin: { description: 'Describes the image for people who cannot see it.' },
    },
    { name: 'caption', type: 'text' },
    { name: 'credit', type: 'text', admin: { description: 'Photographer or source.' } },
  ],
}
```

`src/collections/Manuscripts.ts`:

```ts
import path from 'node:path'
import type { CollectionConfig } from 'payload'

import { isAdmin, isStaff } from '@/access'
import { rejectFilesOver } from '@/hooks/fileSizeLimit'

const TEN_MEGABYTES = 10 * 1024 * 1024

export const Manuscripts: CollectionConfig = {
  slug: 'manuscripts',
  labels: { singular: 'Manuscript file', plural: 'Manuscript files' },
  admin: {
    group: 'Inbox',
    useAsTitle: 'filename',
    description: 'Files sent with manuscript submissions. Only staff can open them.',
  },
  access: { read: isStaff, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    beforeOperation: [rejectFilesOver(TEN_MEGABYTES)],
  },
  upload: {
    // Outside public/: files are only served through Payload's access check.
    staticDir: process.env.MANUSCRIPTS_DIR || path.resolve(process.cwd(), 'manuscripts'),
    mimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  fields: [],
}
```

- [ ] **Step 6: Write the storage switch**

`src/storage.ts`:

```ts
import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

function s3ClientConfig() {
  return {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  }
}

/**
 * Supabase Storage in production, through its S3 interface. Each bucket switches on
 * only when its name is set, so locally files stay on disk. Files keep being served
 * through Payload, which checks read access first.
 */
export function storagePlugins(): Plugin[] {
  return [
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET_MEDIA),
      bucket: process.env.S3_BUCKET_MEDIA || '',
      collections: { media: true },
      config: s3ClientConfig(),
    }),
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET_MANUSCRIPTS),
      bucket: process.env.S3_BUCKET_MANUSCRIPTS || '',
      collections: { manuscripts: true },
      config: s3ClientConfig(),
    }),
  ]
}
```

- [ ] **Step 7: Register them**

In `src/payload.config.ts`, add the imports:

```ts
import { Manuscripts } from './collections/Manuscripts'
import { Media } from './collections/Media'
import { storagePlugins } from './storage'
```

and change:

```ts
  collections: [Users, Categories, Tags, Media, Manuscripts],
```

```ts
  plugins: [...storagePlugins()],
```

- [ ] **Step 8: Regenerate and run everything**

```bash
npm run generate:importmap
npm run generate:types
npm test
```

Expected: all pass, including the 8 new upload tests. `.test-uploads/media/` holds the test image and its three sizes; `media/` (development) is untouched.

- [ ] **Step 9: Look at it in the admin**

Run `npm run dev`. Open `http://localhost:3000/admin`, create the first account (it becomes an admin), and open Images. Upload one photo from `public/images/unsplash/`. Expected: the focal point picker shows, and after saving, the list shows a thumbnail. Take a screenshot at 1440 x 900 and at 390 x 844 and look at both. Stop the dev server and close the browser.

- [ ] **Step 10: Commit**

```bash
git add src tests
git commit -m "Add the images and manuscript files collections, with the 10 MB manuscript limit"
```

---
### Task 8: Writers and books

Writers and books have drafts and version history. A writer's books show on the writer automatically, through a join field (a read-only list Payload fills from the books that name the writer). A book can only be published for sale once it has at least one format with a price and weight.

**Files:**
- Create: `src/rules/validation.ts`
- Create: `src/rules/validators.ts`
- Create: `src/rules/books.ts`
- Create: `src/collections/Writers.ts`
- Create: `src/collections/Books.ts`
- Modify: `src/payload.config.ts`
- Modify: `tests/helpers/payload.ts` (add `createImage`, `createWriter`)
- Test: `tests/unit/validators.spec.ts`
- Test: `tests/int/books.int.spec.ts`

**Interfaces:**
- Consumes: `publishedOrStaff`, `staffWrites` (Task 5 and 6); `slugField` (Task 6); `media` (Task 7).
- Produces:
  - `src/rules/validation.ts`: `finalValue<T>(data, originalDoc, key): T | undefined`, `isPublishing(data, originalDoc): boolean`, `rejectField(req, collection, path, message): never`
  - `src/rules/validators.ts`: `nairaValidator(required: boolean)`, `urlValidator(required: boolean)`, both returning a field `validate` function
  - `src/rules/books.ts`: `formatsProblem(sellInShop: unknown, formats: unknown): string | null`
  - collection `writers`: `name`, `slug`, `photo`, `shortBio`, `bio`, `links[]` (`label`, `url`), `showOnWritersPage`, join `books`
  - collection `books`: `title`, `slug`, `cover`, `writers`, `category` (`fiction`, `poetry`, `anthology`, `non-fiction`), `summary`, `synopsis`, `publishDate`, `pageCount`, `isbn`, `formats[]` (`formatName`, `priceNGN`, `inStock`, `weightGrams`), `sellInShop`, `newRelease`, `editorsChoice`
  - test helpers `createImage(payload): Promise<Media>` and `createWriter(payload, name?): Promise<Writer>` (published)

Rules that guard published content skip drafts, so an editor can save half-finished work. Payload itself skips field validation for drafts.

- [ ] **Step 1: Write the failing unit tests for the validators and the book rule**

`tests/unit/validators.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { formatsProblem } from '@/rules/books'
import { finalValue, isPublishing } from '@/rules/validation'
import { nairaValidator, urlValidator } from '@/rules/validators'

describe('nairaValidator', () => {
  const required = nairaValidator(true)
  const optional = nairaValidator(false)

  it('accepts whole naira and refuses kobo or negatives', () => {
    expect(required(12500)).toBe(true)
    expect(required(0)).toBe(true)
    expect(required(12500.5)).toMatch(/whole number/)
    expect(required(-1)).toMatch(/whole number/)
  })

  it('treats an empty value as missing only when required', () => {
    expect(required(undefined)).toMatch(/required/i)
    expect(required(null)).toMatch(/required/i)
    expect(optional(undefined)).toBe(true)
    expect(optional(null)).toBe(true)
  })
})

describe('urlValidator', () => {
  it('accepts web addresses and refuses anything else', () => {
    expect(urlValidator(true)('https://open.spotify.com/episode/1')).toBe(true)
    expect(urlValidator(true)('open.spotify.com')).toMatch(/https/)
    expect(urlValidator(false)('')).toBe(true)
    expect(urlValidator(true)('')).toMatch(/required/i)
  })
})

describe('finalValue and isPublishing', () => {
  it('prefers the incoming value and falls back to the stored one', () => {
    expect(finalValue({ a: 1 }, { a: 2 }, 'a')).toBe(1)
    expect(finalValue({}, { a: 2 }, 'a')).toBe(2)
    expect(finalValue({ a: undefined }, { a: 2 }, 'a')).toBe(undefined)
  })

  it('treats only draft saves as not publishing', () => {
    expect(isPublishing({ _status: 'draft' }, undefined)).toBe(false)
    expect(isPublishing({ _status: 'published' }, { _status: 'draft' })).toBe(true)
    expect(isPublishing({}, { _status: 'published' })).toBe(true)
    expect(isPublishing({}, undefined)).toBe(true)
  })
})

describe('formatsProblem', () => {
  it('needs a format only when the book is for sale', () => {
    expect(formatsProblem(false, [])).toBeNull()
    expect(formatsProblem(true, [{ formatName: 'Paperback' }])).toBeNull()
    expect(formatsProblem(true, [])).toMatch(/at least one format/)
    expect(formatsProblem(true, undefined)).toMatch(/at least one format/)
  })
})
```

- [ ] **Step 2: Run them to see them fail**

```bash
npx vitest run tests/unit/validators.spec.ts
```

Expected: FAIL, because the `@/rules/*` modules don't exist.

- [ ] **Step 3: Write the rules**

`src/rules/validation.ts`:

```ts
import { type PayloadRequest, ValidationError } from 'payload'

type Doc = Record<string, unknown> | null | undefined

/** The value a save ends up with: the incoming one if it was sent, otherwise the stored one. */
export function finalValue<T = unknown>(data: Doc, originalDoc: Doc, key: string): T | undefined {
  if (data && key in data) return data[key] as T | undefined
  return originalDoc?.[key] as T | undefined
}

/** False while an editor is only saving a draft. Rules that guard published content skip drafts. */
export function isPublishing(data: Doc, originalDoc: Doc): boolean {
  return finalValue(data, originalDoc, '_status') !== 'draft'
}

/** Stops the save and shows `message` on the field at `path` in the admin. */
export function rejectField(req: PayloadRequest, collection: string, path: string, message: string): never {
  throw new ValidationError({ collection, errors: [{ path, message }], req }, req.t)
}
```

`src/rules/validators.ts`:

```ts
const isEmpty = (value: unknown) => value === undefined || value === null || value === ''

/** Prices are stored in whole naira. */
export const nairaValidator =
  (required: boolean) =>
  (value: unknown): true | string => {
    if (isEmpty(value)) return required ? 'This field is required.' : true
    return typeof value === 'number' && Number.isInteger(value) && value >= 0
      ? true
      : 'Enter a whole number of naira, with no kobo.'
  }

export const urlValidator =
  (required: boolean) =>
  (value: unknown): true | string => {
    if (isEmpty(value)) return required ? 'This field is required.' : true
    return typeof value === 'string' && /^https?:\/\/\S+$/.test(value)
      ? true
      : 'Enter a full web address starting with https://'
  }
```

`src/rules/books.ts`:

```ts
/** A book for sale needs at least one format. Returns the message to show, or null when fine. */
export function formatsProblem(sellInShop: unknown, formats: unknown): string | null {
  if (sellInShop !== true) return null
  return Array.isArray(formats) && formats.length > 0
    ? null
    : 'Add at least one format, with its price and weight, before selling this book in the shop.'
}
```

- [ ] **Step 4: Run the unit tests to see them pass**

```bash
npx vitest run tests/unit/validators.spec.ts
```

Expected: `6 passed`.

- [ ] **Step 5: Add the test helpers and write the failing integration tests**

Add to `tests/helpers/payload.ts` (imports at the top, functions at the bottom):

```ts
import path from 'node:path'

import type { Media, Writer } from '@/payload-types'

const testPhoto = path.resolve('public/images/unsplash/unsplash-1543002588-bfa74002ed7e.jpg')

export function createImage(payload: Payload): Promise<Media> {
  return payload.create({ collection: 'media', data: { alt: 'Test image' }, filePath: testPhoto })
}

let writerCount = 0

/** A published writer. */
export function createWriter(payload: Payload, name?: string): Promise<Writer> {
  writerCount += 1
  return payload.create({
    collection: 'writers',
    data: {
      name: name ?? `Test Writer ${writerCount}`,
      shortBio: 'Writes for the tests.',
      _status: 'published',
    },
  })
}
```

`tests/int/books.int.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Media, Writer } from '@/payload-types'

import { createImage, createWriter, getTestPayload } from '../helpers/payload'

let payload: Payload
let cover: Media
let writer: Writer

const book = (overrides: Record<string, unknown> = {}) => ({
  title: `Test Book ${Math.random().toString(36).slice(2, 8)}`,
  cover: cover.id,
  writers: [writer.id],
  category: 'fiction' as const,
  summary: 'A test book.',
  ...overrides,
})

const paperback = { formatName: 'Paperback', priceNGN: 12500, inStock: true, weightGrams: 450 }

beforeAll(async () => {
  payload = await getTestPayload()
  cover = await createImage(payload)
  writer = await createWriter(payload, 'Modupe Daramola')
})

describe('books', () => {
  it('refuses to publish a book for sale with no formats', async () => {
    await expect(
      payload.create({ collection: 'books', data: book({ sellInShop: true, formats: [], _status: 'published' }) }),
    ).rejects.toThrow(/at least one format/)
  })

  it('publishes a book for sale once it has a format', async () => {
    const doc = await payload.create({
      collection: 'books',
      data: book({ sellInShop: true, formats: [paperback], _status: 'published' }),
    })
    expect(doc._status).toBe('published')
  })

  it('lets a draft for sale have no formats yet', async () => {
    const doc = await payload.create({
      collection: 'books',
      data: book({ sellInShop: true, formats: [] }),
      draft: true,
    })
    expect(doc._status).toBe('draft')
  })

  it('refuses kobo in a price', async () => {
    await expect(
      payload.create({
        collection: 'books',
        data: book({ formats: [{ ...paperback, priceNGN: 12500.5 }], _status: 'published' }),
      }),
    ).rejects.toThrow()
  })

  it('shows visitors published books only', async () => {
    const published = await payload.create({ collection: 'books', data: book({ _status: 'published' }) })
    const draft = await payload.create({ collection: 'books', data: book(), draft: true })
    const seen = await payload.find({
      collection: 'books',
      where: { id: { in: [published.id, draft.id] } },
      overrideAccess: false,
    })
    expect(seen.docs.map((doc) => doc.id)).toEqual([published.id])
  })

  it("lists a writer's books on the writer", async () => {
    const doc = await payload.create({ collection: 'books', data: book({ _status: 'published' }) })
    const found = await payload.findByID({ collection: 'writers', id: writer.id })
    const ids = (found.books?.docs ?? []).map((entry) => (typeof entry === 'object' ? entry.id : entry))
    expect(ids).toContain(doc.id)
  })
})

describe('writers', () => {
  it('hides draft writers from visitors', async () => {
    const draft = await payload.create({
      collection: 'writers',
      data: { name: 'Draft Writer', shortBio: 'Not ready.' },
      draft: true,
    })
    const seen = await payload.find({
      collection: 'writers',
      where: { id: { equals: draft.id } },
      overrideAccess: false,
    })
    expect(seen.totalDocs).toBe(0)
  })

  it('makes the slug from the name', async () => {
    const doc = await createWriter(payload, 'Adéọlá Ọ̀ṣun')
    expect(doc.slug).toBe('adeola-osun')
  })
})
```

- [ ] **Step 6: Run them to see them fail**

```bash
npx vitest run tests/int/books.int.spec.ts
```

Expected: FAIL, because `writers` and `books` don't exist.

- [ ] **Step 7: Write the writers collection**

`src/collections/Writers.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { urlValidator } from '@/rules/validators'

export const Writers: CollectionConfig = {
  slug: 'writers',
  labels: { singular: 'Writer', plural: 'Writers' },
  admin: {
    group: 'Publishing',
    useAsTitle: 'name',
    defaultColumns: ['name', 'showOnWritersPage', '_status', 'updatedAt'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'shortBio',
      label: 'Short bio',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: { description: 'One or two sentences, shown on cards and lists.' },
    },
    { name: 'bio', label: 'Full bio', type: 'richText' },
    {
      name: 'links',
      type: 'array',
      labels: { singular: 'Link', plural: 'Links' },
      fields: [
        { name: 'label', type: 'text', required: true, admin: { placeholder: 'Instagram' } },
        { name: 'url', label: 'Web address', type: 'text', required: true, validate: urlValidator(true) },
      ],
    },
    {
      name: 'showOnWritersPage',
      label: 'Show on Our Writers',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'books',
      type: 'join',
      collection: 'books',
      on: 'writers',
      admin: { description: 'Filled in automatically from each book.' },
    },
  ],
}
```

- [ ] **Step 8: Write the books collection**

`src/collections/Books.ts`:

```ts
import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { formatsProblem } from '@/rules/books'
import { finalValue, isPublishing, rejectField } from '@/rules/validation'
import { nairaValidator } from '@/rules/validators'

const requireFormatsWhenSold: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!isPublishing(data, originalDoc)) return data
  const problem = formatsProblem(
    finalValue(data, originalDoc, 'sellInShop'),
    finalValue(data, originalDoc, 'formats'),
  )
  if (problem) rejectField(req, 'books', 'formats', problem)
  return data
}

export const Books: CollectionConfig = {
  slug: 'books',
  labels: { singular: 'Book', plural: 'Books' },
  admin: {
    group: 'Publishing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'sellInShop', '_status', 'updatedAt'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: {
    beforeValidate: [requireFormatsWhenSold],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'cover', type: 'upload', relationTo: 'media', required: true },
    { name: 'writers', type: 'relationship', relationTo: 'writers', hasMany: true, required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Fiction', value: 'fiction' },
        { label: 'Poetry', value: 'poetry' },
        { label: 'Anthology', value: 'anthology' },
        { label: 'Non-fiction', value: 'non-fiction' },
      ],
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
      maxLength: 160,
      admin: { description: 'One line, shown on book cards.' },
    },
    { name: 'synopsis', type: 'richText' },
    {
      type: 'row',
      fields: [
        { name: 'publishDate', label: 'Publication date', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'pageCount', label: 'Pages', type: 'number', min: 1 },
        { name: 'isbn', label: 'ISBN', type: 'text' },
      ],
    },
    {
      name: 'formats',
      type: 'array',
      labels: { singular: 'Format', plural: 'Formats' },
      admin: { description: 'Each edition sold, such as paperback or hardback. Needed before the book can be sold.' },
      fields: [
        { name: 'formatName', label: 'Format', type: 'text', required: true, admin: { placeholder: 'Paperback' } },
        { name: 'priceNGN', label: 'Price (₦)', type: 'number', required: true, validate: nairaValidator(true) },
        { name: 'inStock', label: 'In stock', type: 'checkbox', defaultValue: true },
        {
          name: 'weightGrams',
          label: 'Weight (grams)',
          type: 'number',
          required: true,
          min: 1,
          admin: { description: 'Used to work out delivery.' },
        },
      ],
    },
    { name: 'sellInShop', label: 'Sell in the shop', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'newRelease', label: 'New release', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'editorsChoice', label: "Editor's choice", type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
}
```

- [ ] **Step 9: Register them and run everything**

In `src/payload.config.ts`, add:

```ts
import { Books } from './collections/Books'
import { Writers } from './collections/Writers'
```

```ts
  collections: [Users, Categories, Tags, Media, Manuscripts, Writers, Books],
```

```bash
npm run generate:types
npm test
```

Expected: all pass, including 6 new unit and 8 new integration tests.

- [ ] **Step 10: Look at it in the admin**

Run `npm run dev`, log in, and create a writer and a book. Tick "Sell in the shop" with no formats and press Publish. Expected: the save fails and the message appears on the Formats field, not only as a pop-up. Then save the same book as a draft: it saves. Take screenshots of the book form at 1440 x 900 and 390 x 844 and look at both, including the error message. Stop the dev server and close the browser.

- [ ] **Step 11: Commit**

```bash
git add src tests
git commit -m "Add writers and books, with formats required before a book is sold"
```

---
### Task 9: Articles and scheduled publishing

Articles have drafts and can be scheduled to publish later. The body editor supports images, quotes and video embeds. Scheduled publishing runs on Payload's job queue: in development the app checks for due jobs every minute, and in production Vercel Cron calls the job endpoint every minute with a secret.

**Files:**
- Create: `src/fields/richText.ts`
- Create: `src/seed/richText.ts`
- Create: `src/access/jobs.ts`
- Create: `src/collections/Articles.ts`
- Modify: `src/collections/Writers.ts` (add the `articles` join)
- Modify: `src/payload.config.ts` (register, add `jobs`, add `admin.meta`)
- Create: `vercel.json`
- Test: `tests/unit/jobs.spec.ts`
- Test: `tests/int/articles.int.spec.ts`

**Interfaces:**
- Consumes: `publishedOrStaff`, `staffWrites`; `slugField`; `urlValidator`; `categories`, `tags`, `writers`, `media`; `createImage`, `createWriter`.
- Produces:
  - `articleEditor` and the `VideoEmbed` block (slug `videoEmbed`, fields `url`, `caption`) from `src/fields/richText.ts`
  - `hasCronSecret({ req }): boolean` from `src/access/jobs.ts`
  - `richText(...paragraphs: string[])` from `src/seed/richText.ts`: rich text in Payload's stored format, used by tests and the seed
  - collection `articles`: `title`, `slug`, `cover`, `summary`, `body`, `writers`, `categories`, `tags`, `featured`, `publishDate`; drafts with scheduled publishing
  - join `articles` on `writers`
  - the job queue, which B2 adds its unpaid-order task to

How a scheduled publish works: the editor picks "Schedule publish" next to the Publish button and chooses a time. Payload queues a `schedulePublish` job with that time. When the job runs, it publishes the article with the scheduling editor's own permissions.

The job endpoint `/api/payload-jobs/run` accepts only calls carrying `Authorization: Bearer <CRON_SECRET>`. Vercel adds that header to its cron calls automatically once `CRON_SECRET` is set in the project's settings.

- [ ] **Step 1: Write the failing unit test for the cron secret**

`tests/unit/jobs.spec.ts`:

```ts
import type { PayloadRequest } from 'payload'
import { afterEach, describe, expect, it } from 'vitest'

import { hasCronSecret } from '@/access/jobs'

const requestWith = (authorization?: string) =>
  ({ headers: new Headers(authorization ? { authorization } : {}) }) as unknown as PayloadRequest

const original = process.env.CRON_SECRET

afterEach(() => {
  process.env.CRON_SECRET = original
})

describe('hasCronSecret', () => {
  it('accepts the right secret', () => {
    process.env.CRON_SECRET = 'right-secret'
    expect(hasCronSecret({ req: requestWith('Bearer right-secret') })).toBe(true)
  })

  it('refuses a wrong or missing secret', () => {
    process.env.CRON_SECRET = 'right-secret'
    expect(hasCronSecret({ req: requestWith('Bearer wrong') })).toBe(false)
    expect(hasCronSecret({ req: requestWith() })).toBe(false)
  })

  it('refuses everything when no secret is configured', () => {
    process.env.CRON_SECRET = ''
    expect(hasCronSecret({ req: requestWith('Bearer ') })).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to see it fail, then write the check**

```bash
npx vitest run tests/unit/jobs.spec.ts
```

Expected: FAIL, because `@/access/jobs` doesn't exist.

`src/access/jobs.ts`:

```ts
import type { PayloadRequest } from 'payload'

/** The job endpoint only runs for Vercel Cron, which sends `Authorization: Bearer <CRON_SECRET>`. */
export function hasCronSecret({ req }: { req: PayloadRequest }): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}
```

```bash
npx vitest run tests/unit/jobs.spec.ts
```

Expected: `3 passed`.

- [ ] **Step 3: Add the rich text helper**

`src/seed/richText.ts` builds the editor's stored format (Lexical JSON) from plain paragraphs. Tests and the seed use it.

```ts
/** Rich text in Payload's stored (Lexical) format, from plain paragraphs. */
export function richText(...paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        textStyle: '',
        children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
      })),
    },
  }
}
```

- [ ] **Step 4: Write the failing integration tests**

`tests/int/articles.int.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Category, Media, Writer } from '@/payload-types'
import { richText } from '@/seed/richText'

import { createImage, createWriter, getTestPayload } from '../helpers/payload'

const WEEK = 7 * 24 * 60 * 60 * 1000

let payload: Payload
let cover: Media
let writer: Writer
let category: Category

const article = (overrides: Record<string, unknown> = {}) => ({
  title: `Article ${Math.random().toString(36).slice(2, 8)}`,
  cover: cover.id,
  summary: 'A test article.',
  body: richText('The first paragraph.'),
  writers: [writer.id],
  categories: [category.id],
  publishDate: new Date().toISOString(),
  ...overrides,
})

const visitorCanSee = async (id: number) => {
  const result = await payload.find({ collection: 'articles', where: { id: { equals: id } }, overrideAccess: false })
  return result.totalDocs === 1
}

beforeAll(async () => {
  payload = await getTestPayload()
  cover = await createImage(payload)
  writer = await createWriter(payload)
  category = await payload.create({ collection: 'categories', data: { name: 'Essays' } })
})

describe('articles', () => {
  it('hides drafts from visitors and shows published articles', async () => {
    const draft = await payload.create({ collection: 'articles', data: article(), draft: true })
    const published = await payload.create({ collection: 'articles', data: article({ _status: 'published' }) })
    expect(await visitorCanSee(draft.id)).toBe(false)
    expect(await visitorCanSee(published.id)).toBe(true)
  })

  it('publishes a scheduled article when its job runs, not before', async () => {
    const draft = await payload.create({
      collection: 'articles',
      data: article({ publishDate: new Date(Date.now() + WEEK).toISOString() }),
      draft: true,
    })
    const job = await payload.jobs.queue({
      task: 'schedulePublish',
      input: { type: 'publish', doc: { relationTo: 'articles', value: String(draft.id) } },
      waitUntil: new Date(Date.now() + WEEK),
    })

    // Not due yet: a normal run leaves it alone.
    await payload.jobs.run()
    expect(await visitorCanSee(draft.id)).toBe(false)

    // Running this one job directly ignores its due time, standing in for a week passing.
    await payload.jobs.runByID({ id: job.id })
    expect(await visitorCanSee(draft.id)).toBe(true)
  })

  it("lists a writer's articles on the writer", async () => {
    const doc = await payload.create({ collection: 'articles', data: article({ _status: 'published' }) })
    const found = await payload.findByID({ collection: 'writers', id: writer.id })
    const ids = (found.articles?.docs ?? []).map((entry) => (typeof entry === 'object' ? entry.id : entry))
    expect(ids).toContain(doc.id)
  })

  it('needs a writer and a category to publish', async () => {
    await expect(
      payload.create({ collection: 'articles', data: article({ writers: [], _status: 'published' }) }),
    ).rejects.toThrow()
    await expect(
      payload.create({ collection: 'articles', data: article({ categories: [], _status: 'published' }) }),
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 5: Run them to see them fail**

```bash
npx vitest run tests/int/articles.int.spec.ts
```

Expected: FAIL, because `articles` doesn't exist.

- [ ] **Step 6: Write the article editor**

`src/fields/richText.ts`:

```ts
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import type { Block } from 'payload'

import { urlValidator } from '@/rules/validators'

export const VideoEmbed: Block = {
  slug: 'videoEmbed',
  labels: { singular: 'Video', plural: 'Videos' },
  fields: [
    {
      name: 'url',
      label: 'Video link',
      type: 'text',
      required: true,
      validate: urlValidator(true),
      admin: { description: 'A YouTube or Vimeo link.' },
    },
    { name: 'caption', type: 'text' },
  ],
}

/** The default editor (headings, lists, links, quotes, images) plus video embeds. */
export const articleEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [...defaultFeatures, BlocksFeature({ blocks: [VideoEmbed] })],
})
```

- [ ] **Step 7: Write the articles collection and the writers join**

`src/collections/Articles.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { articleEditor } from '@/fields/richText'
import { slugField } from '@/fields/slug'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Article', plural: 'Articles' },
  admin: {
    group: 'Editorial',
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishDate', 'featured', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: {
    drafts: { schedulePublish: true },
    maxPerDoc: 50,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      admin: { description: 'One or two sentences, shown on article cards.' },
    },
    { name: 'body', type: 'richText', required: true, editor: articleEditor },
    { name: 'writers', type: 'relationship', relationTo: 'writers', hasMany: true, required: true },
    { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true, required: true },
    { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Featured articles lead the Blog page.' },
    },
    {
      name: 'publishDate',
      label: 'Publication date',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Shown on the article. To publish later, use Schedule publish next to the Publish button.',
      },
    },
  ],
}
```

In `src/collections/Writers.ts`, add after the `books` join:

```ts
    {
      name: 'articles',
      type: 'join',
      collection: 'articles',
      on: 'writers',
      admin: { description: 'Filled in automatically from each article.' },
    },
```

- [ ] **Step 8: Turn on the job queue and register articles**

In `src/payload.config.ts`, add the imports:

```ts
import { hasCronSecret } from './access/jobs'
import { Articles } from './collections/Articles'
```

Append `Articles` to `collections` after `Tags`. Add `meta` inside the existing `admin` block:

```ts
    meta: {
      titleSuffix: ' | Noisy Streetss admin',
    },
```

Add a `jobs` block after `globals`:

```ts
  jobs: {
    access: {
      run: hasCronSecret,
    },
    // In development the app runs due jobs itself every minute. In production
    // Vercel Cron calls /api/payload-jobs/run instead (see vercel.json).
    autoRun: process.env.NODE_ENV === 'production' ? [] : [{ cron: '* * * * *', queue: 'default', limit: 10 }],
  },
```

Create `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [{ "path": "/api/payload-jobs/run", "schedule": "* * * * *" }]
}
```

- [ ] **Step 9: Regenerate and run everything**

The video block has a part that runs in the browser, so the import map must be regenerated.

```bash
npm run generate:importmap
npm run generate:types
npm test
```

Expected: all pass, including 3 new unit and 4 new integration tests. `src/app/(payload)/admin/importMap.js` now mentions `BlocksFeatureClient`.

- [ ] **Step 10: Check scheduling and the editor in the admin**

Run `npm run dev` and log in.

1. Create an article and add a quote, an image and a Video block in the body.
2. Use the arrow next to Publish and choose "Schedule publish", for two minutes from now. Confirm.
3. Wait three minutes and reload. Expected: the article shows as published. (The dev server runs due jobs every minute.)

Screenshot the article form with the video block, and the schedule dialog, at 1440 x 900 and 390 x 844, and look at all four. Then, in a second terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/payload-jobs/run
```

Expected: `401`, because the call has no secret. Run it again with the secret from `.env`:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer <CRON_SECRET from .env>" http://localhost:3000/api/payload-jobs/run
```

Expected: `200`. Stop the dev server and close the browser.

- [ ] **Step 11: Commit**

```bash
git add src tests vercel.json
git commit -m "Add articles with scheduled publishing, run by the job queue"
```

---
### Task 10: Podcast shows and episodes

Shows are a plain list. Episodes have drafts, and a published episode needs at least one listening link (Spotify or YouTube).

**Files:**
- Create: `src/rules/podcast.ts`
- Create: `src/collections/PodcastShows.ts`
- Create: `src/collections/PodcastEpisodes.ts`
- Modify: `src/payload.config.ts`
- Test: `tests/unit/podcast.spec.ts`
- Test: `tests/int/podcast.int.spec.ts`

**Interfaces:**
- Consumes: `anyone`, `publishedOrStaff`, `staffWrites`; `slugField`; `finalValue`, `isPublishing`, `rejectField`; `urlValidator`; `createImage`, `createWriter`.
- Produces:
  - `listenLinkProblem(spotifyUrl: unknown, youtubeUrl: unknown): string | null` from `src/rules/podcast.ts`
  - collection `podcast-shows`: `name`, `slug`, `description`, `cover`, `spotifyUrl`, `youtubeUrl`, `appleUrl`
  - collection `podcast-episodes`: `title`, `slug`, `show`, `episodeNumber`, `date`, `summary`, `showNotes`, `spotifyUrl`, `youtubeUrl`, `cover`, `guests`, `lengthMinutes`

- [ ] **Step 1: Write the failing unit test**

`tests/unit/podcast.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { listenLinkProblem } from '@/rules/podcast'

describe('listenLinkProblem', () => {
  it('accepts Spotify only, YouTube only, or both', () => {
    expect(listenLinkProblem('https://open.spotify.com/episode/1', undefined)).toBeNull()
    expect(listenLinkProblem('', 'https://youtu.be/abc')).toBeNull()
    expect(listenLinkProblem('https://open.spotify.com/episode/1', 'https://youtu.be/abc')).toBeNull()
  })

  it('needs at least one', () => {
    expect(listenLinkProblem(undefined, null)).toMatch(/Spotify or YouTube/)
    expect(listenLinkProblem('  ', '')).toMatch(/Spotify or YouTube/)
  })
})
```

- [ ] **Step 2: Run it to see it fail**

```bash
npx vitest run tests/unit/podcast.spec.ts
```

Expected: FAIL, because `@/rules/podcast` doesn't exist.

- [ ] **Step 3: Write the rule**

`src/rules/podcast.ts`:

```ts
const filled = (value: unknown) => typeof value === 'string' && value.trim() !== ''

/** A published episode needs somewhere to listen. Returns the message to show, or null when fine. */
export function listenLinkProblem(spotifyUrl: unknown, youtubeUrl: unknown): string | null {
  return filled(spotifyUrl) || filled(youtubeUrl) ? null : 'Add a Spotify or YouTube link before publishing.'
}
```

```bash
npx vitest run tests/unit/podcast.spec.ts
```

Expected: `2 passed`.

- [ ] **Step 4: Write the failing integration tests**

`tests/int/podcast.int.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { PodcastShow } from '@/payload-types'

import { getTestPayload } from '../helpers/payload'

let payload: Payload
let show: PodcastShow

const episode = (overrides: Record<string, unknown> = {}) => ({
  title: `Episode ${Math.random().toString(36).slice(2, 8)}`,
  show: show.id,
  date: new Date().toISOString(),
  summary: 'A test episode.',
  ...overrides,
})

beforeAll(async () => {
  payload = await getTestPayload()
  show = await payload.create({ collection: 'podcast-shows', data: { name: 'Noisy Conversations' } })
})

describe('podcast episodes', () => {
  it('refuses to publish an episode with no listening link', async () => {
    await expect(
      payload.create({ collection: 'podcast-episodes', data: episode({ _status: 'published' }) }),
    ).rejects.toThrow(/Spotify or YouTube/)
  })

  it('publishes Spotify-only and YouTube-only episodes', async () => {
    const spotify = await payload.create({
      collection: 'podcast-episodes',
      data: episode({ spotifyUrl: 'https://open.spotify.com/episode/1', _status: 'published' }),
    })
    const youtube = await payload.create({
      collection: 'podcast-episodes',
      data: episode({ youtubeUrl: 'https://www.youtube.com/watch?v=abc', _status: 'published' }),
    })
    expect([spotify._status, youtube._status]).toEqual(['published', 'published'])
  })

  it('lets a draft have no link yet', async () => {
    const draft = await payload.create({ collection: 'podcast-episodes', data: episode(), draft: true })
    expect(draft._status).toBe('draft')
  })

  it('refuses a link that is not a web address', async () => {
    await expect(
      payload.create({
        collection: 'podcast-episodes',
        data: episode({ spotifyUrl: 'open.spotify.com/episode/1', _status: 'published' }),
      }),
    ).rejects.toThrow()
  })

  it('shows visitors published episodes and every show', async () => {
    const episodes = await payload.find({ collection: 'podcast-episodes', overrideAccess: false })
    expect(episodes.docs.every((doc) => doc._status === 'published')).toBe(true)
    const shows = await payload.find({ collection: 'podcast-shows', overrideAccess: false })
    expect(shows.totalDocs).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 5: Run them to see them fail**

```bash
npx vitest run tests/int/podcast.int.spec.ts
```

Expected: FAIL, because `podcast-shows` doesn't exist.

- [ ] **Step 6: Write the two collections**

`src/collections/PodcastShows.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { urlValidator } from '@/rules/validators'

export const PodcastShows: CollectionConfig = {
  slug: 'podcast-shows',
  labels: { singular: 'Podcast show', plural: 'Podcast shows' },
  admin: { group: 'Editorial', useAsTitle: 'name' },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'description', type: 'textarea' },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'spotifyUrl', label: 'Spotify link', type: 'text', validate: urlValidator(false) },
    { name: 'youtubeUrl', label: 'YouTube link', type: 'text', validate: urlValidator(false) },
    { name: 'appleUrl', label: 'Apple Podcasts link', type: 'text', validate: urlValidator(false) },
  ],
}
```

`src/collections/PodcastEpisodes.ts`:

```ts
import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { listenLinkProblem } from '@/rules/podcast'
import { finalValue, isPublishing, rejectField } from '@/rules/validation'
import { urlValidator } from '@/rules/validators'

const requireListenLink: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!isPublishing(data, originalDoc)) return data
  const problem = listenLinkProblem(
    finalValue(data, originalDoc, 'spotifyUrl'),
    finalValue(data, originalDoc, 'youtubeUrl'),
  )
  if (problem) rejectField(req, 'podcast-episodes', 'spotifyUrl', problem)
  return data
}

export const PodcastEpisodes: CollectionConfig = {
  slug: 'podcast-episodes',
  labels: { singular: 'Podcast episode', plural: 'Podcast episodes' },
  admin: {
    group: 'Editorial',
    useAsTitle: 'title',
    defaultColumns: ['title', 'show', 'date', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: { beforeValidate: [requireListenLink] },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'show', type: 'relationship', relationTo: 'podcast-shows', required: true },
    {
      type: 'row',
      fields: [
        { name: 'episodeNumber', label: 'Episode number', type: 'number', min: 1 },
        { name: 'date', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'lengthMinutes', label: 'Length (minutes)', type: 'number', min: 1 },
      ],
    },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'showNotes', label: 'Show notes', type: 'richText' },
    {
      name: 'spotifyUrl',
      label: 'Spotify link',
      type: 'text',
      validate: urlValidator(false),
      admin: { description: 'A Spotify or YouTube link is needed before publishing.' },
    },
    { name: 'youtubeUrl', label: 'YouTube link', type: 'text', validate: urlValidator(false) },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'guests', type: 'relationship', relationTo: 'writers', hasMany: true },
  ],
}
```

- [ ] **Step 7: Register them and run everything**

In `src/payload.config.ts`, import `PodcastShows` and `PodcastEpisodes` from `./collections/PodcastShows` and `./collections/PodcastEpisodes`, and append them to `collections` after `Books`.

```bash
npm run generate:types
npm test
```

Expected: all pass, including 2 new unit and 5 new integration tests.

- [ ] **Step 8: Commit**

```bash
git add src tests
git commit -m "Add podcast shows and episodes, with a listening link required to publish"
```

---
### Task 11: Submission calls and awards

A submission call's status (upcoming, open or closed) is worked out from its dates every time it is read, and never stored, so it can't go stale. Awards have a status editors set themselves, because judging and announcing winners aren't date-driven.

Times are compared as exact moments. The admin shows date and time pickers for `opensAt` and `closesAt`, in the editor's own time zone.

**Files:**
- Create: `src/rules/time.ts`
- Create: `src/rules/submissionCalls.ts`
- Create: `src/collections/SubmissionCalls.ts`
- Create: `src/collections/Awards.ts`
- Modify: `src/payload.config.ts`
- Test: `tests/unit/submissionCalls.spec.ts`
- Test: `tests/int/submissionCalls.int.spec.ts`

**Interfaces:**
- Consumes: `publishedOrStaff`, `staffWrites`; `slugField`; `urlValidator`; `richText` (Task 9).
- Produces, from `src/rules/time.ts`: `toTime(value: unknown): number | null` (milliseconds, or null for a missing or invalid date) and `endsAfter(start: unknown, end: unknown): boolean` (true when either is missing). Task 12 adds to this file.
- Produces, from `src/rules/submissionCalls.ts`:
  - `type CallStatus = 'upcoming' | 'open' | 'closed'`
  - `callStatus(opensAt: unknown, closesAt: unknown, now?: Date): CallStatus | null` (null when a date is missing)
  - `closesAfterOpens(opensAt: unknown, closesAt: unknown): boolean`
  - `openCallsWhere(now?: Date): Where`
- Produces collections:
  - `submission-calls`: `title`, `slug`, `themeSummary`, `guidelines`, `opensAt`, `closesAt`, `cover`, and the read-only virtual field `status`
  - `awards`: `name`, `slug`, `summary`, `rules`, `prize`, `keyDates[]` (`label`, `date`), `status` (`open`, `judging`, `winners-announced`, `closed`), `pastWinners[]` (`year`, `name`, `work`, `url`), `howToEnter`, `entryUrl`, `cover`

A virtual field can't be used in a database query, so code that needs only open calls uses `openCallsWhere()`. Task 16's manuscript submission check uses `callStatus`.

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/submissionCalls.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { callStatus, closesAfterOpens, openCallsWhere } from '@/rules/submissionCalls'

const opens = '2026-11-01T09:00:00.000Z'
const closes = '2026-11-30T23:00:00.000Z'

describe('callStatus', () => {
  it('is upcoming before it opens', () => {
    expect(callStatus(opens, closes, new Date('2026-10-31T09:00:00.000Z'))).toBe('upcoming')
  })

  it('is open from the opening moment until just before closing', () => {
    expect(callStatus(opens, closes, new Date(opens))).toBe('open')
    expect(callStatus(opens, closes, new Date('2026-11-30T22:59:59.999Z'))).toBe('open')
  })

  it('is closed from the closing moment', () => {
    expect(callStatus(opens, closes, new Date(closes))).toBe('closed')
  })

  it('has no status while a date is missing', () => {
    expect(callStatus(undefined, closes)).toBeNull()
    expect(callStatus(opens, null)).toBeNull()
  })
})

describe('closesAfterOpens', () => {
  it('needs the closing moment to be later', () => {
    expect(closesAfterOpens(opens, closes)).toBe(true)
    expect(closesAfterOpens(closes, opens)).toBe(false)
    expect(closesAfterOpens(opens, opens)).toBe(false)
  })

  it('passes while the opening date is still empty', () => {
    expect(closesAfterOpens(undefined, closes)).toBe(true)
  })
})

describe('openCallsWhere', () => {
  it('builds the open-now query', () => {
    const now = new Date('2026-11-10T12:00:00.000Z')
    expect(openCallsWhere(now)).toEqual({
      and: [
        { opensAt: { less_than_equal: now.toISOString() } },
        { closesAt: { greater_than: now.toISOString() } },
      ],
    })
  })
})
```

- [ ] **Step 2: Run them to see them fail**

```bash
npx vitest run tests/unit/submissionCalls.spec.ts
```

Expected: FAIL, because `@/rules/submissionCalls` doesn't exist.

- [ ] **Step 3: Write the rules**

`src/rules/time.ts`:

```ts
/** Milliseconds since 1970 for a date string or Date, or null when missing or invalid. */
export function toTime(value: unknown): number | null {
  if (typeof value !== 'string' && !(value instanceof Date)) return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

/** True when `end` is later than `start`, or when either is still empty. */
export function endsAfter(start: unknown, end: unknown): boolean {
  const from = toTime(start)
  const to = toTime(end)
  if (from === null || to === null) return true
  return to > from
}
```

`src/rules/submissionCalls.ts`:

```ts
import type { Where } from 'payload'

import { endsAfter, toTime } from './time'

export type CallStatus = 'upcoming' | 'open' | 'closed'

/** Upcoming before `opensAt`, open until `closesAt`, closed from then on. */
export function callStatus(opensAt: unknown, closesAt: unknown, now: Date = new Date()): CallStatus | null {
  const opens = toTime(opensAt)
  const closes = toTime(closesAt)
  if (opens === null || closes === null) return null
  const current = now.getTime()
  if (current < opens) return 'upcoming'
  if (current < closes) return 'open'
  return 'closed'
}

export const closesAfterOpens = endsAfter

/** Query for calls open right now. The `status` field is virtual, so it can't be queried. */
export function openCallsWhere(now: Date = new Date()): Where {
  return {
    and: [
      { opensAt: { less_than_equal: now.toISOString() } },
      { closesAt: { greater_than: now.toISOString() } },
    ],
  }
}
```

```bash
npx vitest run tests/unit/submissionCalls.spec.ts
```

Expected: `7 passed`.

- [ ] **Step 4: Write the failing integration tests**

`tests/int/submissionCalls.int.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { openCallsWhere } from '@/rules/submissionCalls'
import { richText } from '@/seed/richText'

import { getTestPayload } from '../helpers/payload'

const DAY = 24 * 60 * 60 * 1000
const fromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()

let payload: Payload

const call = (title: string, opensInDays: number, closesInDays: number) => ({
  title,
  themeSummary: 'A test theme.',
  guidelines: richText('Send up to 5,000 words.'),
  opensAt: fromNow(opensInDays),
  closesAt: fromNow(closesInDays),
  _status: 'published' as const,
})

beforeAll(async () => {
  payload = await getTestPayload()
  // Test files run in any order, and the seed test adds calls, so start empty.
  await payload.db.deleteMany({ collection: 'submission-calls', where: {} })
})

describe('submission calls', () => {
  it('works out the status when read', async () => {
    const open = await payload.create({ collection: 'submission-calls', data: call('Open call', -5, 20) })
    const upcoming = await payload.create({ collection: 'submission-calls', data: call('Upcoming call', 10, 40) })
    const closed = await payload.create({ collection: 'submission-calls', data: call('Closed call', -40, -10) })
    expect([open.status, upcoming.status, closed.status]).toEqual(['open', 'upcoming', 'closed'])
  })

  it('finds only the open calls with openCallsWhere', async () => {
    const result = await payload.find({ collection: 'submission-calls', where: openCallsWhere() })
    expect(result.docs.map((doc) => doc.title)).toEqual(['Open call'])
  })

  it('refuses a closing date before the opening date', async () => {
    await expect(
      payload.create({ collection: 'submission-calls', data: call('Backwards call', 10, 5) }),
    ).rejects.toThrow(/after the opening/)
  })
})

describe('awards', () => {
  it('stores past winners and hides drafts from visitors', async () => {
    const award = await payload.create({
      collection: 'awards',
      data: {
        name: 'Test Prize',
        summary: 'A prize for tests.',
        status: 'winners-announced',
        pastWinners: [{ year: 2025, name: 'Funmilayo Benson', work: 'Echoes' }],
      },
      draft: true,
    })
    expect(award.pastWinners?.[0]?.name).toBe('Funmilayo Benson')
    const seen = await payload.find({
      collection: 'awards',
      where: { id: { equals: award.id } },
      overrideAccess: false,
    })
    expect(seen.totalDocs).toBe(0)
  })
})
```


- [ ] **Step 5: Run the integration tests to see them fail**

```bash
npx vitest run tests/int/submissionCalls.int.spec.ts
```

Expected: FAIL, because `submission-calls` doesn't exist.

- [ ] **Step 6: Write the two collections**

`src/collections/SubmissionCalls.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { callStatus, closesAfterOpens } from '@/rules/submissionCalls'

export const SubmissionCalls: CollectionConfig = {
  slug: 'submission-calls',
  labels: { singular: 'Submission call', plural: 'Submission calls' },
  admin: {
    group: 'Publishing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'opensAt', 'closesAt', 'status', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    {
      name: 'status',
      type: 'select',
      virtual: true,
      options: [
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Open', value: 'open' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Worked out from the opening and closing dates.',
      },
      hooks: {
        afterRead: [({ siblingData }) => callStatus(siblingData?.opensAt, siblingData?.closesAt)],
      },
    },
    {
      name: 'themeSummary',
      label: 'Theme in brief',
      type: 'textarea',
      required: true,
      admin: { description: 'Shown on the Submissions page.' },
    },
    { name: 'guidelines', type: 'richText', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'opensAt',
          label: 'Opens',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'closesAt',
          label: 'Closes',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
          validate: (value, { siblingData }) => {
            if (!value) return 'This field is required.'
            const opensAt = (siblingData as { opensAt?: unknown }).opensAt
            return closesAfterOpens(opensAt, value) ? true : 'The closing date must be after the opening date.'
          },
        },
      ],
    },
    { name: 'cover', type: 'upload', relationTo: 'media' },
  ],
}
```

`src/collections/Awards.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { urlValidator } from '@/rules/validators'

export const Awards: CollectionConfig = {
  slug: 'awards',
  labels: { singular: 'Award', plural: 'Awards' },
  admin: {
    group: 'Publishing',
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Judging', value: 'judging' },
        { label: 'Winners announced', value: 'winners-announced' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'rules', type: 'richText' },
    { name: 'prize', type: 'text', admin: { placeholder: '₦500,000 and publication' } },
    {
      name: 'keyDates',
      label: 'Key dates',
      type: 'array',
      labels: { singular: 'Date', plural: 'Dates' },
      fields: [
        { name: 'label', type: 'text', required: true, admin: { placeholder: 'Entries close' } },
        { name: 'date', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
      ],
    },
    {
      name: 'pastWinners',
      label: 'Past winners',
      type: 'array',
      labels: { singular: 'Winner', plural: 'Winners' },
      fields: [
        { name: 'year', type: 'number', required: true, min: 1900 },
        { name: 'name', type: 'text', required: true },
        { name: 'work', label: 'Winning work', type: 'text' },
        { name: 'url', label: 'Web address', type: 'text', validate: urlValidator(false) },
      ],
    },
    { name: 'howToEnter', label: 'How to enter', type: 'richText' },
    { name: 'entryUrl', label: 'Entry link', type: 'text', validate: urlValidator(false) },
    { name: 'cover', type: 'upload', relationTo: 'media' },
  ],
}
```

- [ ] **Step 7: Register them and run everything**

In `src/payload.config.ts`, import `SubmissionCalls` and `Awards` and append them to `collections`.

```bash
npm run generate:types
npm test
```

Expected: all pass, including 7 new unit and 4 new integration tests.

- [ ] **Step 8: Look at it in the admin**

Run `npm run dev`. Create a submission call that opened yesterday and closes next week. Expected: the sidebar shows Status "Open", and the field can't be edited. Set the closing date before the opening date and publish: the message appears on the Closes field. Screenshot at 1440 x 900 and 390 x 844 and look at both. Stop the dev server and close the browser.

- [ ] **Step 9: Commit**

```bash
git add src tests
git commit -m "Add submission calls, with status worked out from the dates, and awards"
```

---
### Task 12: Events, careers and Book Club sessions

All three have drafts. Whether an event is upcoming, or a role is still showing, is worked out when read, with a shared query builder so the frontend and tests agree:

- **Events:** upcoming while the end time, or the start time if there's no end, is in the future.
- **Careers:** shown while `open` is on and the closing date hasn't passed. A role closing today still shows all day. "Today" means Lagos time (West Africa Time, UTC+1 all year, with no daylight saving).
- **Book Club sessions:** need a book or a title, so a session is never nameless.

**Files:**
- Modify: `src/rules/time.ts` (add `startOfLagosDay`)
- Create: `src/rules/events.ts`
- Create: `src/rules/careers.ts`
- Create: `src/rules/bookClub.ts`
- Create: `src/collections/Events.ts`
- Create: `src/collections/Careers.ts`
- Create: `src/collections/BookClubSessions.ts`
- Modify: `src/payload.config.ts`
- Test: `tests/unit/whatsOn.spec.ts`
- Test: `tests/int/whatsOn.int.spec.ts`

**Interfaces:**
- Consumes: `toTime`, `endsAfter` (Task 11); `publishedOrStaff`, `staffWrites`; `finalValue`, `isPublishing`, `rejectField`; `urlValidator`; `richText`.
- Produces:
  - `startOfLagosDay(now?: Date): Date` in `src/rules/time.ts`
  - `isUpcomingEvent(startsAt, endsAt, now?): boolean`, `upcomingEventsWhere(now?): Where` from `src/rules/events.ts`
  - `isCareerVisible(open, closingDate, now?): boolean`, `visibleCareersWhere(now?): Where` from `src/rules/careers.ts`
  - `bookOrTitleProblem(book: unknown, title: unknown): string | null` from `src/rules/bookClub.ts`
  - collection `events`: `title`, `startsAt`, `endsAt`, `venue`, `address`, `onlineUrl`, `description`, `image`, `actionUrl`, `actionLabel`
  - collection `careers`: `role`, `type` (`full-time`, `part-time`, `contract`, `internship`, `nysc`), `location`, `description`, `howToApply`, `closingDate`, `open`
  - collection `book-club-sessions`: `book`, `title`, `startsAt`, `venue`, `onlineUrl`, `description`, `registrationOpen`

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/whatsOn.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { bookOrTitleProblem } from '@/rules/bookClub'
import { isCareerVisible } from '@/rules/careers'
import { isUpcomingEvent } from '@/rules/events'
import { startOfLagosDay } from '@/rules/time'

describe('startOfLagosDay', () => {
  it('is midnight in Lagos, which is 23:00 UTC the day before', () => {
    expect(startOfLagosDay(new Date('2026-10-21T10:00:00.000Z')).toISOString()).toBe('2026-10-20T23:00:00.000Z')
  })

  it('moves to the next day at 23:00 UTC', () => {
    expect(startOfLagosDay(new Date('2026-10-21T23:30:00.000Z')).toISOString()).toBe('2026-10-21T23:00:00.000Z')
  })
})

describe('isUpcomingEvent', () => {
  const now = new Date('2026-10-21T12:00:00.000Z')

  it('uses the end time when there is one', () => {
    expect(isUpcomingEvent('2026-10-21T09:00:00.000Z', '2026-10-21T18:00:00.000Z', now)).toBe(true)
    expect(isUpcomingEvent('2026-10-21T09:00:00.000Z', '2026-10-21T11:00:00.000Z', now)).toBe(false)
  })

  it('falls back to the start time', () => {
    expect(isUpcomingEvent('2026-10-22T09:00:00.000Z', null, now)).toBe(true)
    expect(isUpcomingEvent('2026-10-20T09:00:00.000Z', undefined, now)).toBe(false)
  })
})

describe('isCareerVisible', () => {
  const now = new Date('2026-10-21T15:00:00.000Z')

  it('shows an open role until the end of its closing day in Lagos', () => {
    expect(isCareerVisible(true, '2026-10-21T12:00:00.000Z', now)).toBe(true)
    expect(isCareerVisible(true, '2026-10-20T23:00:00.000Z', now)).toBe(true)
    expect(isCareerVisible(true, '2026-10-20T12:00:00.000Z', now)).toBe(false)
  })

  it('shows an open role with no closing date', () => {
    expect(isCareerVisible(true, null, now)).toBe(true)
  })

  it('hides a role switched off', () => {
    expect(isCareerVisible(false, '2026-12-01T12:00:00.000Z', now)).toBe(false)
  })
})

describe('bookOrTitleProblem', () => {
  it('needs a book or a title', () => {
    expect(bookOrTitleProblem(3, '')).toBeNull()
    expect(bookOrTitleProblem(null, 'Poetry night')).toBeNull()
    expect(bookOrTitleProblem(undefined, '  ')).toMatch(/book or a title/)
  })
})
```

- [ ] **Step 2: Run them to see them fail**

```bash
npx vitest run tests/unit/whatsOn.spec.ts
```

Expected: FAIL, because the modules don't exist yet.

- [ ] **Step 3: Write the rules**

Append to `src/rules/time.ts`:

```ts
/** Lagos is on West Africa Time, UTC+1 all year, with no daylight saving. */
const LAGOS_OFFSET_MS = 60 * 60 * 1000

/** The moment the current day started in Lagos. */
export function startOfLagosDay(now: Date = new Date()): Date {
  const lagos = new Date(now.getTime() + LAGOS_OFFSET_MS)
  const midnight = Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate())
  return new Date(midnight - LAGOS_OFFSET_MS)
}
```

`src/rules/events.ts`:

```ts
import type { Where } from 'payload'

import { toTime } from './time'

/** Upcoming while the end time, or the start time if there's no end, is in the future. */
export function isUpcomingEvent(startsAt: unknown, endsAt: unknown, now: Date = new Date()): boolean {
  const end = toTime(endsAt) ?? toTime(startsAt)
  return end !== null && end > now.getTime()
}

export function upcomingEventsWhere(now: Date = new Date()): Where {
  const moment = now.toISOString()
  return {
    or: [
      { endsAt: { greater_than: moment } },
      { and: [{ endsAt: { exists: false } }, { startsAt: { greater_than: moment } }] },
    ],
  }
}
```

`src/rules/careers.ts`:

```ts
import type { Where } from 'payload'

import { startOfLagosDay, toTime } from './time'

/** Shown while switched on and the closing day (Lagos time) hasn't ended. */
export function isCareerVisible(open: unknown, closingDate: unknown, now: Date = new Date()): boolean {
  if (open !== true) return false
  const closes = toTime(closingDate)
  return closes === null || closes >= startOfLagosDay(now).getTime()
}

export function visibleCareersWhere(now: Date = new Date()): Where {
  return {
    and: [
      { open: { equals: true } },
      {
        or: [
          { closingDate: { exists: false } },
          { closingDate: { greater_than_equal: startOfLagosDay(now).toISOString() } },
        ],
      },
    ],
  }
}
```

`src/rules/bookClub.ts`:

```ts
const filled = (value: unknown) =>
  typeof value === 'number' || (typeof value === 'string' && value.trim() !== '') || (typeof value === 'object' && value !== null)

/** A session needs a book or a title. Returns the message to show, or null when fine. */
export function bookOrTitleProblem(book: unknown, title: unknown): string | null {
  return filled(book) || filled(title) ? null : 'Choose a book or give the session a title.'
}
```

```bash
npx vitest run tests/unit/whatsOn.spec.ts
```

Expected: `8 passed`.

- [ ] **Step 4: Write the failing integration tests**

`tests/int/whatsOn.int.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { visibleCareersWhere } from '@/rules/careers'
import { upcomingEventsWhere } from '@/rules/events'
import { richText } from '@/seed/richText'

import { getTestPayload } from '../helpers/payload'

const DAY = 24 * 60 * 60 * 1000
const fromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
  // Test files run in any order, and the seed test fills these collections, so start them empty.
  await payload.db.deleteMany({ collection: 'events', where: {} })
  await payload.db.deleteMany({ collection: 'careers', where: {} })
})

describe('events', () => {
  it('finds upcoming and ongoing events, not past ones', async () => {
    const event = (title: string, startsAt: string, endsAt?: string) =>
      payload.create({ collection: 'events', data: { title, startsAt, endsAt, _status: 'published' } })
    await event('Next week', fromNow(7))
    await event('Ongoing festival', fromNow(-1), fromNow(2))
    await event('Last month', fromNow(-30))
    await event('Ended yesterday', fromNow(-3), fromNow(-1))

    const result = await payload.find({ collection: 'events', where: upcomingEventsWhere(), sort: 'startsAt' })
    expect(result.docs.map((doc) => doc.title)).toEqual(['Ongoing festival', 'Next week'])
  })

  it('refuses an end time before the start time', async () => {
    await expect(
      payload.create({
        collection: 'events',
        data: { title: 'Backwards', startsAt: fromNow(5), endsAt: fromNow(4), _status: 'published' },
      }),
    ).rejects.toThrow(/after the start/)
  })
})

describe('careers', () => {
  it('shows open roles that have not closed', async () => {
    const career = (role: string, open: boolean, closingDate?: string) =>
      payload.create({
        collection: 'careers',
        data: {
          role,
          type: 'full-time',
          description: richText('About the role.'),
          howToApply: 'Email jobs@noisystreetss.test',
          open,
          closingDate,
          _status: 'published',
        },
      })
    await career('Editor', true, fromNow(10))
    await career('Designer', true)
    await career('Past closing', true, fromNow(-3))
    await career('Switched off', false, fromNow(10))

    const result = await payload.find({ collection: 'careers', where: visibleCareersWhere(), sort: 'role' })
    expect(result.docs.map((doc) => doc.role)).toEqual(['Designer', 'Editor'])
  })
})

describe('book club sessions', () => {
  it('needs a book or a title to publish', async () => {
    await expect(
      payload.create({ collection: 'book-club-sessions', data: { startsAt: fromNow(7), _status: 'published' } }),
    ).rejects.toThrow(/book or a title/)
    const session = await payload.create({
      collection: 'book-club-sessions',
      data: { title: 'Poetry night', startsAt: fromNow(7), _status: 'published' },
    })
    expect(session.title).toBe('Poetry night')
  })
})
```

- [ ] **Step 5: Run them to see them fail**

```bash
npx vitest run tests/int/whatsOn.int.spec.ts
```

Expected: FAIL, because `events` doesn't exist.

- [ ] **Step 6: Write the three collections**

`src/collections/Events.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { endsAfter } from '@/rules/time'
import { urlValidator } from '@/rules/validators'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    group: "What's on",
    useAsTitle: 'title',
    defaultColumns: ['title', 'startsAt', 'venue', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', label: 'Starts', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
        {
          name: 'endsAt',
          label: 'Ends',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' }, description: 'Optional. Leave empty for a single moment.' },
          validate: (value, { siblingData }) =>
            endsAfter((siblingData as { startsAt?: unknown }).startsAt, value)
              ? true
              : 'The end must be after the start.',
        },
      ],
    },
    { name: 'venue', type: 'text' },
    { name: 'address', type: 'textarea' },
    { name: 'onlineUrl', label: 'Online link', type: 'text', validate: urlValidator(false) },
    { name: 'description', type: 'richText' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      type: 'row',
      fields: [
        { name: 'actionUrl', label: 'Button link', type: 'text', validate: urlValidator(false) },
        { name: 'actionLabel', label: 'Button text', type: 'text', admin: { placeholder: 'Get tickets' } },
      ],
    },
  ],
}
```

`src/collections/Careers.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'

export const Careers: CollectionConfig = {
  slug: 'careers',
  labels: { singular: 'Role', plural: 'Careers' },
  admin: {
    group: "What's on",
    useAsTitle: 'role',
    defaultColumns: ['role', 'type', 'closingDate', 'open', '_status'],
    description: 'Shown on the Careers page while switched on and before the closing date.',
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'role', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Full-time', value: 'full-time' },
        { label: 'Part-time', value: 'part-time' },
        { label: 'Contract', value: 'contract' },
        { label: 'Internship', value: 'internship' },
        { label: 'NYSC', value: 'nysc' },
      ],
    },
    { name: 'location', type: 'text', admin: { placeholder: 'Lagos, or remote' } },
    { name: 'description', type: 'richText', required: true },
    { name: 'howToApply', label: 'How to apply', type: 'textarea', required: true },
    {
      name: 'closingDate',
      label: 'Closing date',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' }, description: 'The role still shows on this day.' },
    },
    { name: 'open', label: 'Accepting applications', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
```

`src/collections/BookClubSessions.ts`:

```ts
import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { bookOrTitleProblem } from '@/rules/bookClub'
import { finalValue, isPublishing, rejectField } from '@/rules/validation'
import { urlValidator } from '@/rules/validators'

const requireBookOrTitle: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!isPublishing(data, originalDoc)) return data
  const problem = bookOrTitleProblem(finalValue(data, originalDoc, 'book'), finalValue(data, originalDoc, 'title'))
  if (problem) rejectField(req, 'book-club-sessions', 'title', problem)
  return data
}

export const BookClubSessions: CollectionConfig = {
  slug: 'book-club-sessions',
  labels: { singular: 'Book Club session', plural: 'Book Club sessions' },
  admin: {
    group: "What's on",
    useAsTitle: 'title',
    defaultColumns: ['title', 'book', 'startsAt', 'registrationOpen', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: { beforeValidate: [requireBookOrTitle] },
  fields: [
    { name: 'book', type: 'relationship', relationTo: 'books', admin: { description: 'The book being read, if there is one.' } },
    { name: 'title', type: 'text', admin: { description: 'Needed when no book is chosen.' } },
    { name: 'startsAt', label: 'Starts', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'venue', type: 'text' },
    { name: 'onlineUrl', label: 'Online link', type: 'text', validate: urlValidator(false) },
    { name: 'description', type: 'textarea' },
    {
      name: 'registrationOpen',
      label: 'Registration open',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Registrations themselves arrive with the membership work.' },
    },
  ],
}
```

- [ ] **Step 7: Register them and run everything**

In `src/payload.config.ts`, import `Events`, `Careers` and `BookClubSessions` and append them to `collections`.

```bash
npm run generate:types
npm test
```

Expected: all pass, including 8 new unit and 4 new integration tests.

- [ ] **Step 8: Commit**

```bash
git add src tests
git commit -m "Add events, careers and Book Club sessions, with upcoming and visible rules"
```

---
### Task 13: Merch, studio services and membership plans

Merch and studio services have drafts. A studio service needs at least one rate before it is published. Membership plans have no drafts: they go live when saved, and the `active` switch controls whether one is offered. The Paystack plan code comes in B3.

**Files:**
- Create: `src/rules/studio.ts`
- Create: `src/collections/Merch.ts`
- Create: `src/collections/StudioServices.ts`
- Create: `src/collections/MembershipPlans.ts`
- Modify: `src/payload.config.ts`
- Test: `tests/unit/studio.spec.ts`
- Test: `tests/int/shopAndServices.int.spec.ts`

**Interfaces:**
- Consumes: `anyone`, `publishedOrStaff`, `staffWrites`; `slugField`; `finalValue`, `isPublishing`, `rejectField`; `nairaValidator`; `createImage`, `createStaff`.
- Produces:
  - `ratesProblem(hourly: unknown, halfDay: unknown, fullDay: unknown): string | null` from `src/rules/studio.ts`
  - collection `merch`: `title`, `slug`, `images` (one or more), `description`, `priceNGN`, `inStock`, `weightGrams`, `type` (`stationery`, `apparel`, `other`)
  - collection `studio-services`: `name`, `slug`, `description`, `hourlyRateNGN`, `halfDayRateNGN`, `fullDayRateNGN`, `inclusions[]` (`item`), `images`, `bookable`, `sortOrder`
  - collection `membership-plans`: `name`, `priceNGN`, `billing` (`monthly`, `yearly`), `perks[]` (`perk`), `active`, `sortOrder`

- [ ] **Step 1: Write the failing unit test**

`tests/unit/studio.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { ratesProblem } from '@/rules/studio'

describe('ratesProblem', () => {
  it('accepts any one rate', () => {
    expect(ratesProblem(15000, null, undefined)).toBeNull()
    expect(ratesProblem(null, 50000, null)).toBeNull()
    expect(ratesProblem(undefined, undefined, 90000)).toBeNull()
  })

  it('needs at least one', () => {
    expect(ratesProblem(null, undefined, null)).toMatch(/at least one rate/)
  })
})
```

- [ ] **Step 2: Run it to see it fail, then write the rule**

```bash
npx vitest run tests/unit/studio.spec.ts
```

Expected: FAIL, because `@/rules/studio` doesn't exist.

`src/rules/studio.ts`:

```ts
const isRate = (value: unknown) => typeof value === 'number' && value >= 0

/** A studio service needs a price. Returns the message to show, or null when fine. */
export function ratesProblem(hourly: unknown, halfDay: unknown, fullDay: unknown): string | null {
  return isRate(hourly) || isRate(halfDay) || isRate(fullDay)
    ? null
    : 'Add at least one rate (hourly, half day or full day) before publishing.'
}
```

```bash
npx vitest run tests/unit/studio.spec.ts
```

Expected: `2 passed`.

- [ ] **Step 3: Write the failing integration tests**

`tests/int/shopAndServices.int.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Media } from '@/payload-types'

import { createImage, createStaff, getTestPayload } from '../helpers/payload'

let payload: Payload
let image: Media

beforeAll(async () => {
  payload = await getTestPayload()
  image = await createImage(payload)
})

describe('merch', () => {
  const tote = (overrides: Record<string, unknown> = {}) => ({
    title: 'Canvas Tote Bag',
    images: [image.id],
    priceNGN: 12000,
    weightGrams: 300,
    type: 'apparel' as const,
    _status: 'published' as const,
    ...overrides,
  })

  it('publishes an item with a picture, price and weight', async () => {
    const item = await payload.create({ collection: 'merch', data: tote() })
    expect(item.slug).toBe('canvas-tote-bag')
    expect(item.inStock).toBe(true)
  })

  it('refuses an item with no picture, or a price with kobo', async () => {
    await expect(payload.create({ collection: 'merch', data: tote({ images: [] }) })).rejects.toThrow()
    await expect(payload.create({ collection: 'merch', data: tote({ priceNGN: 99.5 }) })).rejects.toThrow()
  })
})

describe('studio services', () => {
  it('needs a rate to publish', async () => {
    await expect(
      payload.create({
        collection: 'studio-services',
        data: { name: 'Vocal booth', description: 'Treated booth.', _status: 'published' },
      }),
    ).rejects.toThrow(/at least one rate/)
    const service = await payload.create({
      collection: 'studio-services',
      data: { name: 'Vocal booth', description: 'Treated booth.', hourlyRateNGN: 15000, _status: 'published' },
    })
    expect(service.hourlyRateNGN).toBe(15000)
  })
})

describe('membership plans', () => {
  it('are visible to visitors and editable by editors', async () => {
    const editor = await createStaff(payload, 'editor')
    const plan = await payload.create({
      collection: 'membership-plans',
      data: { name: 'Reader', priceNGN: 5000, billing: 'monthly', perks: [{ perk: '20% off books' }] },
      overrideAccess: false,
      user: editor,
    })
    const seen = await payload.find({
      collection: 'membership-plans',
      where: { id: { equals: plan.id } },
      overrideAccess: false,
    })
    expect(seen.docs[0]?.perks?.[0]?.perk).toBe('20% off books')
  })
})
```

- [ ] **Step 4: Run them to see them fail**

```bash
npx vitest run tests/int/shopAndServices.int.spec.ts
```

Expected: FAIL, because `merch` doesn't exist.

- [ ] **Step 5: Write the three collections**

`src/collections/Merch.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { nairaValidator } from '@/rules/validators'

export const Merch: CollectionConfig = {
  slug: 'merch',
  labels: { singular: 'Merch item', plural: 'Merch' },
  admin: {
    group: 'Shop and services',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'priceNGN', 'inStock', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true, required: true, minRows: 1 },
    { name: 'description', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'priceNGN', label: 'Price (₦)', type: 'number', required: true, validate: nairaValidator(true) },
        { name: 'weightGrams', label: 'Weight (grams)', type: 'number', required: true, min: 1 },
      ],
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Stationery', value: 'stationery' },
        { label: 'Apparel', value: 'apparel' },
        { label: 'Other', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'inStock', label: 'In stock', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
```

`src/collections/StudioServices.ts`:

```ts
import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { ratesProblem } from '@/rules/studio'
import { finalValue, isPublishing, rejectField } from '@/rules/validation'
import { nairaValidator } from '@/rules/validators'

const requireARate: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!isPublishing(data, originalDoc)) return data
  const problem = ratesProblem(
    finalValue(data, originalDoc, 'hourlyRateNGN'),
    finalValue(data, originalDoc, 'halfDayRateNGN'),
    finalValue(data, originalDoc, 'fullDayRateNGN'),
  )
  if (problem) rejectField(req, 'studio-services', 'hourlyRateNGN', problem)
  return data
}

export const StudioServices: CollectionConfig = {
  slug: 'studio-services',
  labels: { singular: 'Studio service', plural: 'Studio services' },
  admin: {
    group: 'Shop and services',
    useAsTitle: 'name',
    defaultColumns: ['name', 'bookable', 'sortOrder', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: { beforeValidate: [requireARate] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'description', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        { name: 'hourlyRateNGN', label: 'Hourly rate (₦)', type: 'number', validate: nairaValidator(false) },
        { name: 'halfDayRateNGN', label: 'Half day rate (₦)', type: 'number', validate: nairaValidator(false) },
        { name: 'fullDayRateNGN', label: 'Full day rate (₦)', type: 'number', validate: nairaValidator(false) },
      ],
    },
    {
      name: 'inclusions',
      label: "What's included",
      type: 'array',
      labels: { singular: 'Item', plural: 'Items' },
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'bookable',
      label: 'Can be booked online',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Booking itself arrives with the studio booking work.' },
    },
    { name: 'sortOrder', label: 'Order on the page', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
```

`src/collections/MembershipPlans.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { nairaValidator } from '@/rules/validators'

export const MembershipPlans: CollectionConfig = {
  slug: 'membership-plans',
  labels: { singular: 'Membership plan', plural: 'Membership plans' },
  admin: {
    group: 'Shop and services',
    useAsTitle: 'name',
    defaultColumns: ['name', 'priceNGN', 'billing', 'active'],
    description: 'Changes go live as soon as they are saved.',
  },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'priceNGN', label: 'Price (₦)', type: 'number', required: true, validate: nairaValidator(true) },
        {
          name: 'billing',
          type: 'select',
          required: true,
          options: [
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' },
          ],
        },
      ],
    },
    {
      name: 'perks',
      type: 'array',
      labels: { singular: 'Perk', plural: 'Perks' },
      fields: [{ name: 'perk', type: 'text', required: true }],
    },
    { name: 'active', label: 'Offered on the site', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'sortOrder', label: 'Order on the page', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
```

- [ ] **Step 6: Register them and run everything**

In `src/payload.config.ts`, import `Merch`, `StudioServices` and `MembershipPlans` and append them to `collections`.

```bash
npm run generate:types
npm test
```

Expected: all pass, including 2 new unit and 4 new integration tests.

- [ ] **Step 7: Commit**

```bash
git add src tests
git commit -m "Add merch, studio services and membership plans"
```

---
### Task 14: Basic pages, announcements, book popups, press mentions and partners

Basic pages (the legal pages and Values) have drafts. The other four are lists that go live when saved.

- **Announcements:** active while the current time is inside their dates. The home page shows up to 3 active ones, newest first.
- **Book popup campaigns:** only one enabled campaign may run at a time. Saving fails if another enabled campaign's dates overlap, and the message names the clashing campaign.

**Files:**
- Create: `src/rules/announcements.ts`
- Create: `src/rules/popups.ts`
- Create: `src/collections/Pages.ts`
- Create: `src/collections/Announcements.ts`
- Create: `src/collections/PopupCampaigns.ts`
- Create: `src/collections/PressMentions.ts`
- Create: `src/collections/Partners.ts`
- Modify: `src/payload.config.ts`
- Test: `tests/unit/popups.spec.ts`
- Test: `tests/int/lists.int.spec.ts`

**Interfaces:**
- Consumes: `anyone`, `publishedOrStaff`, `staffWrites`; `slugField`; `endsAfter`, `toTime`; `finalValue`, `rejectField`; `urlValidator`; `richText`; `createImage`, `createWriter`.
- Produces:
  - `activeAnnouncementsWhere(now?): Where`, `findActiveAnnouncements(payload, now?)` (up to 3, newest first) from `src/rules/announcements.ts`
  - `datesOverlap(aStart, aEnd, bStart, bEnd): boolean`, `overlappingCampaignsWhere(startsAt, endsAt, ownId?): Where` from `src/rules/popups.ts`
  - collections `pages` (`title`, `slug`, `body`), `announcements` (`text`, `url`, `buttonLabel`, `startsAt`, `endsAt`), `popup-campaigns` (`book`, `headline`, `pitch`, `buttonLabel`, `startsAt`, `endsAt`, `enabled`), `press-mentions` (`outlet`, `headline`, `url`, `date`, `logo`, `quote`), `partners` (`name`, `logo`, `quote`, `quoteBy`, `quoteByTitle`, `url`, `sortOrder`)

Two campaigns that only touch (one ends at the exact moment the next starts) do not overlap.

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/popups.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { datesOverlap } from '@/rules/popups'

const d = (day: number) => `2026-11-${String(day).padStart(2, '0')}T00:00:00.000Z`

describe('datesOverlap', () => {
  it('spots overlapping ranges', () => {
    expect(datesOverlap(d(1), d(10), d(5), d(15))).toBe(true)
    expect(datesOverlap(d(5), d(15), d(1), d(10))).toBe(true)
    expect(datesOverlap(d(1), d(30), d(5), d(6))).toBe(true)
  })

  it('lets ranges touch end to start', () => {
    expect(datesOverlap(d(1), d(10), d(10), d(20))).toBe(false)
  })

  it('ignores separate ranges', () => {
    expect(datesOverlap(d(1), d(5), d(6), d(9))).toBe(false)
  })
})
```

- [ ] **Step 2: Run them to see them fail, then write the rules**

```bash
npx vitest run tests/unit/popups.spec.ts
```

Expected: FAIL, because `@/rules/popups` doesn't exist.

`src/rules/popups.ts`:

```ts
import type { Where } from 'payload'

import { toTime } from './time'

/** True when two ranges share any moment. Ranges that only touch end to start don't overlap. */
export function datesOverlap(aStart: unknown, aEnd: unknown, bStart: unknown, bEnd: unknown): boolean {
  const [as, ae, bs, be] = [toTime(aStart), toTime(aEnd), toTime(bStart), toTime(bEnd)]
  if (as === null || ae === null || bs === null || be === null) return false
  return as < be && bs < ae
}

/** Enabled campaigns whose dates overlap the given range, other than the campaign itself. */
export function overlappingCampaignsWhere(startsAt: string, endsAt: string, ownId?: number | string): Where {
  return {
    and: [
      { enabled: { equals: true } },
      { startsAt: { less_than: endsAt } },
      { endsAt: { greater_than: startsAt } },
      ...(ownId ? [{ id: { not_equals: ownId } }] : []),
    ],
  }
}
```

`src/rules/announcements.ts`:

```ts
import type { Payload, Where } from 'payload'

/** Active while the current time is inside the announcement's dates. No end date means it runs on. */
export function activeAnnouncementsWhere(now: Date = new Date()): Where {
  const moment = now.toISOString()
  return {
    and: [
      { startsAt: { less_than_equal: moment } },
      { or: [{ endsAt: { exists: false } }, { endsAt: { greater_than: moment } }] },
    ],
  }
}

/** What the home page shows: up to 3 active announcements, newest first. */
export async function findActiveAnnouncements(payload: Payload, now: Date = new Date()) {
  const result = await payload.find({
    collection: 'announcements',
    where: activeAnnouncementsWhere(now),
    sort: '-startsAt',
    limit: 3,
    overrideAccess: false,
  })
  return result.docs
}
```

```bash
npx vitest run tests/unit/popups.spec.ts
```

Expected: `3 passed`.

- [ ] **Step 3: Write the failing integration tests**

`tests/int/lists.int.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Book } from '@/payload-types'
import { findActiveAnnouncements } from '@/rules/announcements'
import { richText } from '@/seed/richText'

import { createImage, createWriter, getTestPayload } from '../helpers/payload'

const DAY = 24 * 60 * 60 * 1000
const fromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()

let payload: Payload
let book: Book

beforeAll(async () => {
  payload = await getTestPayload()
  // Test files run in any order, and the seed test adds both of these, so start them empty.
  await payload.db.deleteMany({ collection: 'announcements', where: {} })
  await payload.db.deleteMany({ collection: 'popup-campaigns', where: {} })
  const cover = await createImage(payload)
  const writer = await createWriter(payload)
  book = await payload.create({
    collection: 'books',
    data: {
      title: 'Popup Book',
      cover: cover.id,
      writers: [writer.id],
      category: 'poetry',
      summary: 'For the popup tests.',
      _status: 'published',
    },
  })
})

describe('announcements', () => {
  it('shows up to three active ones, newest first', async () => {
    const add = (text: string, startsAt: string, endsAt?: string) =>
      payload.create({ collection: 'announcements', data: { text, startsAt, endsAt } })
    await add('Oldest active', fromNow(-10))
    await add('Second', fromNow(-5), fromNow(5))
    await add('Third', fromNow(-3))
    await add('Newest active', fromNow(-1))
    await add('Expired', fromNow(-20), fromNow(-2))
    await add('Not started', fromNow(2))

    const shown = await findActiveAnnouncements(payload)
    expect(shown.map((doc) => doc.text)).toEqual(['Newest active', 'Third', 'Second'])
  })
})

describe('book popup campaigns', () => {
  const campaign = (headline: string, starts: number, ends: number, enabled = true) => ({
    book: book.id,
    headline,
    startsAt: fromNow(starts),
    endsAt: fromNow(ends),
    enabled,
  })

  it('refuses an enabled campaign whose dates overlap another', async () => {
    await payload.create({ collection: 'popup-campaigns', data: campaign('November launch', 1, 10) })
    await expect(
      payload.create({ collection: 'popup-campaigns', data: campaign('Clashing launch', 5, 15) }),
    ).rejects.toThrow(/November launch/)
  })

  it('allows a disabled overlapping campaign, and one that starts as the other ends', async () => {
    const disabled = await payload.create({ collection: 'popup-campaigns', data: campaign('Draft idea', 5, 15, false) })
    expect(disabled.enabled).toBe(false)
    const later = await payload.create({ collection: 'popup-campaigns', data: campaign('December', 10, 20) })
    expect(later.headline).toBe('December')
  })

  it('lets a campaign be edited without clashing with itself', async () => {
    const own = await payload.create({ collection: 'popup-campaigns', data: campaign('Own dates', 30, 40) })
    const updated = await payload.update({ collection: 'popup-campaigns', id: own.id, data: { headline: 'Renamed' } })
    expect(updated.headline).toBe('Renamed')
  })

  it('refuses an end before the start', async () => {
    await expect(
      payload.create({ collection: 'popup-campaigns', data: campaign('Backwards', 60, 50) }),
    ).rejects.toThrow(/after the start/)
  })
})

describe('pages, press mentions and partners', () => {
  it('hides draft pages from visitors and shows press mentions and partners', async () => {
    const draft = await payload.create({
      collection: 'pages',
      data: { title: 'Privacy policy', body: richText('Placeholder: replace with the client’s policy.') },
      draft: true,
    })
    const pages = await payload.find({ collection: 'pages', where: { id: { equals: draft.id } }, overrideAccess: false })
    expect(pages.totalDocs).toBe(0)

    await payload.create({
      collection: 'press-mentions',
      data: { outlet: 'The Lagos Review', headline: 'A press worth watching', url: 'https://example.com/review' },
    })
    await payload.create({ collection: 'partners', data: { name: 'Lagos Book Fair' } })
    const press = await payload.find({ collection: 'press-mentions', overrideAccess: false })
    const partners = await payload.find({ collection: 'partners', overrideAccess: false })
    expect(press.totalDocs).toBeGreaterThan(0)
    expect(partners.totalDocs).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 4: Run them to see them fail**

```bash
npx vitest run tests/int/lists.int.spec.ts
```

Expected: FAIL, because `announcements` doesn't exist.

- [ ] **Step 5: Write the five collections**

`src/collections/Pages.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Basic page', plural: 'Basic pages' },
  admin: {
    group: 'About',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status'],
    description: 'Plain text pages: the legal pages and Values.',
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'body', type: 'richText', required: true },
  ],
}
```

`src/collections/Announcements.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { endsAfter } from '@/rules/time'
import { urlValidator } from '@/rules/validators'

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  labels: { singular: 'Announcement', plural: 'Announcements' },
  admin: {
    group: "What's on",
    useAsTitle: 'text',
    defaultColumns: ['text', 'startsAt', 'endsAt'],
    description: 'The home page shows up to 3 current announcements, newest first. Changes go live when saved.',
  },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'text', type: 'text', required: true, maxLength: 140 },
    {
      type: 'row',
      fields: [
        { name: 'url', label: 'Link', type: 'text', validate: urlValidator(false) },
        { name: 'buttonLabel', label: 'Button text', type: 'text', admin: { placeholder: 'Read more' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', label: 'Show from', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
        {
          name: 'endsAt',
          label: 'Show until',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' }, description: 'Leave empty to keep showing it.' },
          validate: (value, { siblingData }) =>
            endsAfter((siblingData as { startsAt?: unknown }).startsAt, value) ? true : 'The end must be after the start.',
        },
      ],
    },
  ],
}
```

`src/collections/PopupCampaigns.ts`:

```ts
import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { overlappingCampaignsWhere } from '@/rules/popups'
import { endsAfter } from '@/rules/time'
import { finalValue, rejectField } from '@/rules/validation'

const onlyOneAtATime: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const enabled = finalValue<boolean>(data, originalDoc, 'enabled')
  const startsAt = finalValue<string>(data, originalDoc, 'startsAt')
  const endsAt = finalValue<string>(data, originalDoc, 'endsAt')
  if (!enabled || !startsAt || !endsAt) return data

  const clash = await req.payload.find({
    collection: 'popup-campaigns',
    where: overlappingCampaignsWhere(startsAt, endsAt, originalDoc?.id),
    limit: 1,
    depth: 0,
    req,
  })
  const other = clash.docs[0]
  if (other) {
    rejectField(
      req,
      'popup-campaigns',
      'startsAt',
      `These dates overlap with "${other.headline}". Only one book popup can run at a time: change the dates or switch one off.`,
    )
  }
  return data
}

export const PopupCampaigns: CollectionConfig = {
  slug: 'popup-campaigns',
  labels: { singular: 'Book popup', plural: 'Book popups' },
  admin: {
    group: "What's on",
    useAsTitle: 'headline',
    defaultColumns: ['headline', 'book', 'startsAt', 'endsAt', 'enabled'],
    description: 'Only one popup can be switched on for any given dates. Changes go live when saved.',
  },
  access: { read: anyone, ...staffWrites },
  hooks: { beforeValidate: [onlyOneAtATime] },
  fields: [
    { name: 'book', type: 'relationship', relationTo: 'books', required: true },
    { name: 'headline', type: 'text', required: true },
    { name: 'pitch', type: 'textarea' },
    { name: 'buttonLabel', label: 'Button text', type: 'text', admin: { placeholder: 'Buy the book' } },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', label: 'Show from', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
        {
          name: 'endsAt',
          label: 'Show until',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
          validate: (value, { siblingData }) => {
            if (!value) return 'This field is required.'
            return endsAfter((siblingData as { startsAt?: unknown }).startsAt, value) ? true : 'The end must be after the start.'
          },
        },
      ],
    },
    { name: 'enabled', label: 'Switched on', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
```

`src/collections/PressMentions.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { urlValidator } from '@/rules/validators'

export const PressMentions: CollectionConfig = {
  slug: 'press-mentions',
  labels: { singular: 'Press mention', plural: 'Press mentions' },
  admin: { group: 'About', useAsTitle: 'headline', defaultColumns: ['outlet', 'headline', 'date'] },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'outlet', type: 'text', required: true, admin: { placeholder: 'The Guardian Nigeria' } },
    { name: 'headline', type: 'text', required: true },
    { name: 'url', label: 'Link to the piece', type: 'text', required: true, validate: urlValidator(true) },
    { name: 'date', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'quote', type: 'textarea', admin: { description: 'A short line from the piece, if there is a good one.' } },
  ],
}
```

`src/collections/Partners.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { urlValidator } from '@/rules/validators'

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Person or organisation', plural: "People we've worked with" },
  admin: { group: 'About', useAsTitle: 'name', defaultColumns: ['name', 'sortOrder'] },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'quote', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'quoteBy', label: 'Quote by', type: 'text' },
        { name: 'quoteByTitle', label: 'Their role', type: 'text' },
      ],
    },
    { name: 'url', label: 'Web address', type: 'text', validate: urlValidator(false) },
    { name: 'sortOrder', label: 'Order on the page', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
```

"People we've worked with" is the client's own name for this list, so its "we" stays. The singular label avoids it.

- [ ] **Step 6: Register them and run everything**

In `src/payload.config.ts`, import `Pages`, `Announcements`, `PopupCampaigns`, `PressMentions` and `Partners` and append them to `collections`.

```bash
npm run generate:types
npm test
```

Expected: all pass, including 3 new unit and 6 new integration tests.

- [ ] **Step 7: Look at the clash message in the admin**

Run `npm run dev`. Create two book popups for overlapping dates, both switched on. Expected: the second save fails, the message names the first popup and sits on the "Show from" field. Screenshot at 1440 x 900 and 390 x 844 and look at both. Stop the dev server and close the browser.

- [ ] **Step 8: Commit**

```bash
git add src tests
git commit -m "Add basic pages, announcements, book popups with the overlap check, press mentions and partners"
```

---
### Task 15: Page records, settings and SEO fields

Each designed page gets one record (a Payload "global": a single document, not a list) holding its heading, intro and hero image. More fields are added to each record when its layout is designed in the frontend phase. Under the fixed-layout approach, that growth is expected and isn't a change of plan.

Two settings records sit alongside them: Site settings, which editors can change, and Shop settings, which only admins can see. Payload's SEO plugin then adds a meta title, description and sharing image to every type that has its own page.

**Files:**
- Create: `src/globals/pageRecord.ts`
- Create: `src/globals/pageRecords.ts`
- Create: `src/globals/SiteSettings.ts`
- Create: `src/globals/ShopSettings.ts`
- Create: `src/seo.ts`
- Modify: `src/payload.config.ts` (globals, SEO plugin)
- Test: `tests/int/globals.int.spec.ts`

**Interfaces:**
- Consumes: `anyone`, `isStaff`, `isAdmin`, `isStaffField`, `adminOnlyInAdmin`; `urlValidator`, `nairaValidator`; `createStaff`.
- Produces:
  - `pageRecord(slug, label, extraFields?): GlobalConfig`, `pageRecords: GlobalConfig[]` and `pageRecordSlugs: string[]`
  - 20 page records with slugs `page-home`, `page-publishing`, `page-writers`, `page-submissions` (also has `guidelines`), `page-awards`, `page-advisory`, `page-distribution`, `page-studio`, `page-blog`, `page-podcast`, `page-shop`, `page-book-club`, `page-membership`, `page-events`, `page-careers`, `page-who-we-are`, `page-press`, `page-contact`, `page-partner`, `page-support`. Each has `heading`, `intro`, `heroImage` and the SEO group `meta`.
  - global `site-settings`: `contactEmail`, `phone`, `address`, `socialLinks[]` (`platform`, `url`), `footerText`, `newsletterText`, `defaultShareImage`, `formAlertEmail` (staff-only read)
  - global `shop-settings`: `pickupAddress` (`name`, `phone`, `line1`, `city`, `state`, `country`), `flatDeliveryPrices[]` (`areaName`, `priceNGN`), `memberDiscountPercent` (default 20), `unpaidOrderExpiryMinutes` (default 30), `orderAlertEmail`. B2 reads these.
  - the SEO group `meta` (`title`, `description`, `image`) on `books`, `writers`, `articles`, `podcast-episodes`, `awards`, `merch`, `pages` and every page record

Page record slugs start with `page-`, so they never collide with a collection slug such as `events`.

Field access only applies when access is enforced. Code that reads `site-settings` with the Local API's default `overrideAccess: true` still sees `formAlertEmail`, so frontend code must read it with `overrideAccess: false`.

- [ ] **Step 1: Write the failing tests**

`tests/int/globals.int.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

import { createStaff, getTestPayload } from '../helpers/payload'

let payload: Payload
let admin: User
let editor: User

beforeAll(async () => {
  payload = await getTestPayload()
  admin = await createStaff(payload, 'admin')
  editor = await createStaff(payload, 'editor')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { contactEmail: 'hello@noisystreetss.test', formAlertEmail: 'inbox@noisystreetss.test' },
  })
})

describe('site settings', () => {
  it('shows visitors everything except the form alert address', async () => {
    const settings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: false })
    expect(settings.contactEmail).toBe('hello@noisystreetss.test')
    expect(settings.formAlertEmail).toBeUndefined()
  })

  it('lets editors see the alert address and change the settings', async () => {
    const updated = await payload.updateGlobal({
      slug: 'site-settings',
      data: { phone: '+234 800 000 0000' },
      overrideAccess: false,
      user: editor,
    })
    expect(updated.phone).toBe('+234 800 000 0000')
    expect(updated.formAlertEmail).toBe('inbox@noisystreetss.test')
  })
})

describe('shop settings', () => {
  it('is admin-only and starts with the agreed defaults', async () => {
    await expect(payload.findGlobal({ slug: 'shop-settings', overrideAccess: false, user: editor })).rejects.toThrow()
    await expect(payload.findGlobal({ slug: 'shop-settings', overrideAccess: false })).rejects.toThrow()
    const settings = await payload.findGlobal({ slug: 'shop-settings', overrideAccess: false, user: admin })
    expect(settings.memberDiscountPercent).toBe(20)
    expect(settings.unpaidOrderExpiryMinutes).toBe(30)
  })
})

describe('page records', () => {
  it('has one record per designed page', () => {
    const slugs = payload.config.globals.map((global) => global.slug).filter((slug) => slug.startsWith('page-'))
    expect(slugs).toHaveLength(20)
  })

  it('lets visitors read and editors change a page record, with SEO fields', async () => {
    await payload.updateGlobal({
      slug: 'page-home',
      data: { heading: 'Literature from the streets of Lagos', meta: { title: 'Noisy Streetss' } },
      overrideAccess: false,
      user: editor,
    })
    const home = await payload.findGlobal({ slug: 'page-home', overrideAccess: false })
    expect(home.heading).toBe('Literature from the streets of Lagos')
    expect(home.meta?.title).toBe('Noisy Streetss')
    await expect(
      payload.updateGlobal({ slug: 'page-home', data: { heading: 'Hacked' }, overrideAccess: false }),
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run them to see them fail**

```bash
npx vitest run tests/int/globals.int.spec.ts
```

Expected: FAIL, because the globals don't exist.

- [ ] **Step 3: Write the page records**

`src/globals/pageRecord.ts`:

```ts
import type { Field, GlobalConfig } from 'payload'

import { anyone, isStaff } from '@/access'

/** One record per designed page: what editors can change on it. The layout itself is fixed in code. */
export function pageRecord(slug: string, label: string, extraFields: Field[] = []): GlobalConfig {
  return {
    slug,
    label,
    admin: {
      group: 'Pages',
      description: `Text and images on the ${label} page. The layout itself is fixed.`,
    },
    access: { read: anyone, update: isStaff },
    fields: [
      { name: 'heading', type: 'text', required: true },
      { name: 'intro', type: 'richText' },
      { name: 'heroImage', label: 'Hero image', type: 'upload', relationTo: 'media' },
      ...extraFields,
    ],
  }
}
```

`src/globals/pageRecords.ts`:

```ts
import type { Field, GlobalConfig } from 'payload'

import { pageRecord } from './pageRecord'

const submissionGuidelines: Field = {
  name: 'guidelines',
  label: 'General submission guidelines',
  type: 'richText',
  admin: { description: 'Applies to every call. Each call adds its own guidelines.' },
}

const PAGES: Array<[slug: string, label: string, extraFields?: Field[]]> = [
  ['page-home', 'Home'],
  ['page-publishing', 'Publishing'],
  ['page-writers', 'Writers'],
  ['page-submissions', 'Submissions', [submissionGuidelines]],
  ['page-awards', 'Awards'],
  ['page-advisory', 'Advisory'],
  ['page-distribution', 'Distribution'],
  ['page-studio', 'Studio'],
  ['page-blog', 'Blog'],
  ['page-podcast', 'Podcast'],
  ['page-shop', 'Shop'],
  ['page-book-club', 'Book Club'],
  ['page-membership', 'Membership'],
  ['page-events', 'Events'],
  ['page-careers', 'Careers'],
  ['page-who-we-are', 'Who We Are'],
  ['page-press', 'Press'],
  ['page-contact', 'Contact'],
  ['page-partner', 'Partner'],
  ['page-support', 'Support'],
]

export const pageRecords: GlobalConfig[] = PAGES.map(([slug, label, extraFields]) =>
  pageRecord(slug, label, extraFields),
)

export const pageRecordSlugs = pageRecords.map((global) => global.slug)
```

- [ ] **Step 4: Write the two settings records**

`src/globals/SiteSettings.ts`:

```ts
import type { GlobalConfig } from 'payload'

import { anyone, isStaff, isStaffField } from '@/access'
import { urlValidator } from '@/rules/validators'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: isStaff },
  fields: [
    { name: 'contactEmail', label: 'Contact email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'address', type: 'textarea' },
    {
      name: 'socialLinks',
      label: 'Social links',
      type: 'array',
      labels: { singular: 'Link', plural: 'Links' },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: ['Instagram', 'X', 'Facebook', 'TikTok', 'YouTube', 'LinkedIn', 'Spotify', 'Other'].map((label) => ({
            label,
            value: label.toLowerCase(),
          })),
        },
        { name: 'url', label: 'Web address', type: 'text', required: true, validate: urlValidator(true) },
      ],
    },
    { name: 'footerText', label: 'Footer text', type: 'textarea' },
    { name: 'newsletterText', label: 'Newsletter sign-up text', type: 'textarea' },
    {
      name: 'defaultShareImage',
      label: 'Default sharing image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Used when a page is shared (on WhatsApp, for example) and has no image of its own.' },
    },
    {
      name: 'formAlertEmail',
      label: 'Send form alerts to',
      type: 'email',
      required: true,
      access: { read: isStaffField },
      admin: { description: 'Every new form entry sends an alert here. Never shown on the site.' },
    },
  ],
}
```

`src/globals/ShopSettings.ts`:

```ts
import type { GlobalConfig } from 'payload'

import { adminOnlyInAdmin, isAdmin } from '@/access'
import { nairaValidator } from '@/rules/validators'

export const ShopSettings: GlobalConfig = {
  slug: 'shop-settings',
  label: 'Shop settings',
  admin: {
    group: 'Settings',
    hidden: adminOnlyInAdmin,
    description: 'Used by the shop and checkout. Only admins can see this.',
  },
  access: { read: isAdmin, update: isAdmin },
  fields: [
    {
      name: 'pickupAddress',
      label: 'Pickup address',
      type: 'group',
      admin: { description: 'Where couriers collect orders.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', label: 'Contact name', type: 'text' },
            { name: 'phone', type: 'text' },
          ],
        },
        { name: 'line1', label: 'Street address', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text' },
            { name: 'state', type: 'text' },
            { name: 'country', type: 'text', defaultValue: 'Nigeria' },
          ],
        },
      ],
    },
    {
      name: 'flatDeliveryPrices',
      label: 'Flat delivery prices',
      type: 'array',
      labels: { singular: 'Area', plural: 'Areas' },
      admin: { description: 'Used when live courier prices are unavailable.' },
      fields: [
        { name: 'areaName', label: 'Area', type: 'text', required: true, admin: { placeholder: 'Lagos Mainland' } },
        { name: 'priceNGN', label: 'Price (₦)', type: 'number', required: true, validate: nairaValidator(true) },
      ],
    },
    {
      name: 'memberDiscountPercent',
      label: 'Member discount on books (%)',
      type: 'number',
      defaultValue: 20,
      min: 0,
      max: 100,
    },
    {
      name: 'unpaidOrderExpiryMinutes',
      label: 'Unpaid orders expire after (minutes)',
      type: 'number',
      defaultValue: 30,
      min: 5,
    },
    { name: 'orderAlertEmail', label: 'Send order alerts to', type: 'email' },
  ],
}
```

- [ ] **Step 5: Write the SEO plugin setup**

`src/seo.ts`:

```ts
import { seoPlugin } from '@payloadcms/plugin-seo'
import type { CollectionSlug, GlobalSlug } from 'payload'

import { pageRecordSlugs } from './globals/pageRecords'

type SeoSource = { title?: string; name?: string; heading?: string; summary?: string; shortBio?: string }

/** Meta title, description and sharing image on every type that has its own page. */
export const seo = seoPlugin({
  collections: ['books', 'writers', 'articles', 'podcast-episodes', 'awards', 'merch', 'pages'] as CollectionSlug[],
  globals: pageRecordSlugs as GlobalSlug[],
  uploadsCollection: 'media',
  tabbedUI: false,
  generateTitle: ({ doc }) => {
    const source = (doc ?? {}) as SeoSource
    const name = source.title ?? source.name ?? source.heading
    return name ? `${name} | Noisy Streetss` : 'Noisy Streetss'
  },
  generateDescription: ({ doc }) => {
    const source = (doc ?? {}) as SeoSource
    return source.summary ?? source.shortBio ?? ''
  },
})
```

- [ ] **Step 6: Register them**

In `src/payload.config.ts`, add the imports:

```ts
import { pageRecords } from './globals/pageRecords'
import { ShopSettings } from './globals/ShopSettings'
import { SiteSettings } from './globals/SiteSettings'
import { seo } from './seo'
```

and change:

```ts
  globals: [...pageRecords, SiteSettings, ShopSettings],
```

```ts
  plugins: [...storagePlugins(), seo],
```

- [ ] **Step 7: Regenerate and run everything**

The SEO plugin has admin components, so the import map must be regenerated.

```bash
npm run generate:importmap
npm run generate:types
npm test
```

Expected: all pass, including 5 new tests.

- [ ] **Step 8: Look at it in the admin as an admin and as an editor**

Run `npm run dev`. As the admin, check the menu: a Pages group with 20 entries, and a Settings group with Site settings, Shop settings and Staff accounts. Open the Home record: heading, intro, hero image and an SEO section with a preview. Create an editor in Staff accounts, log out, log in as the editor. Expected: Settings shows only Site settings, and visiting `/admin/globals/shop-settings` directly is refused. Screenshot the admin menu for both accounts and the Home record, at 1440 x 900 and 390 x 844, and look at each. Stop the dev server and close the browser.

- [ ] **Step 9: Commit**

```bash
git add src tests
git commit -m "Add the 20 page records, site and shop settings, and SEO fields"
```

---
### Task 16: The five website forms, spam check and staff alerts

Each website form stores its entries in its own admin list, in the Inbox group. Visitors may create entries but never read, change or delete them. Every new entry sends a staff alert email that names the form and links to the entry. Each form also has a hidden honeypot field: people leave it empty and spam bots fill it in, so an entry that fills it in is refused.

Payload's form-builder plugin isn't used, because it can't take file uploads, and fixed layouts don't need editor-built forms.

**Files:**
- Create: `src/email.ts`
- Create: `src/hooks/formAlert.ts`
- Create: `src/hooks/honeypot.ts`
- Create: `src/collections/forms/formCollection.ts`
- Create: `src/collections/forms/ContactMessages.ts`, `PartnershipEnquiries.ts`, `BookstoreApplications.ts`, `AdvisoryEnquiries.ts`, `ManuscriptSubmissions.ts`
- Modify: `src/payload.config.ts` (email adapter, collections)
- Test: `tests/unit/email.spec.ts`
- Test: `tests/int/forms.int.spec.ts`

**Interfaces:**
- Consumes: `anyone`, `isStaff`, `isAdmin`, `isStaffUser`; `callStatus` (Task 11); `rejectField`; `site-settings` `formAlertEmail` (Task 15); `manuscripts` and `samplePdf` (Task 7); `richText`.
- Produces:
  - `parseFrom(value: string): { name: string; address: string }` and `emailAdapter()` from `src/email.ts`
  - `sendFormAlert(formName: string): CollectionAfterChangeHook` and `adminEntryUrl(collectionSlug, id): string` from `src/hooks/formAlert.ts`. Passing `context: { skipFormAlert: true }` to a Local API create skips the email (the seed does this)
  - `HONEYPOT_FIELD` (`'website'`), `honeypotField` and `dropSpam` from `src/hooks/honeypot.ts`
  - `formCollection(args): CollectionConfig` from `src/collections/forms/formCollection.ts`
  - collections `contact-messages`, `partnership-enquiries`, `bookstore-applications`, `advisory-enquiries`, `manuscript-submissions`, each with `status` (`new`, `in-progress`, `done`; default `new`) and `staffNotes`

Other rules:
- An entry from a visitor always starts as New with no staff notes, whatever was sent.
- A manuscript submission is refused unless its call is published and open at the moment of submitting. Visitors can't add manuscript files directly, so in the frontend phase the submission form's server code will create the file and the submission together.
- If the alert email fails, the entry is still saved and the failure is logged. A lost email must never lose a submission.
- Stronger spam protection and rate limits are decided with the frontend forms.

The field lists come from the spec (section 6.7) and are not yet confirmed by the client.

- [ ] **Step 1: Write the failing unit test**

`tests/unit/email.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { parseFrom } from '@/email'
import { adminEntryUrl } from '@/hooks/formAlert'

describe('parseFrom', () => {
  it('splits a name and address', () => {
    expect(parseFrom('Noisy Streetss <website@noisystreetss.test>')).toEqual({
      name: 'Noisy Streetss',
      address: 'website@noisystreetss.test',
    })
  })

  it('accepts a bare address', () => {
    expect(parseFrom(' website@noisystreetss.test ')).toEqual({
      name: 'Noisy Streetss',
      address: 'website@noisystreetss.test',
    })
  })
})

describe('adminEntryUrl', () => {
  it('links to the entry in the admin', () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://noisystreetss.test/'
    expect(adminEntryUrl('contact-messages', 7)).toBe('https://noisystreetss.test/admin/collections/contact-messages/7')
  })
})
```

- [ ] **Step 2: Run it to see it fail**

```bash
npx vitest run tests/unit/email.spec.ts
```

Expected: FAIL, because `@/email` doesn't exist.

- [ ] **Step 3: Write the email setup and the two hooks**

`src/email.ts`:

```ts
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

const DEFAULT_NAME = 'Noisy Streetss'

/** "Noisy Streetss <website@example.com>" becomes { name, address }. */
export function parseFrom(value: string): { name: string; address: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  if (match) return { name: match[1] || DEFAULT_NAME, address: match[2].trim() }
  return { name: DEFAULT_NAME, address: value.trim() }
}

/**
 * Sends through any SMTP server: Mailpit locally, Resend or the client's existing
 * service in production. Without SMTP_HOST, Payload only logs emails (as in the tests).
 */
export function emailAdapter() {
  const host = process.env.SMTP_HOST
  if (!host) return undefined
  const port = Number(process.env.SMTP_PORT || 587)
  const from = parseFrom(process.env.SMTP_FROM || `${DEFAULT_NAME} <website@noisystreetss.test>`)
  return nodemailerAdapter({
    defaultFromAddress: from.address,
    defaultFromName: from.name,
    skipVerify: true,
    transportOptions: {
      host,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    },
  })
}
```

`src/hooks/formAlert.ts`:

```ts
import type { CollectionAfterChangeHook } from 'payload'

export function adminEntryUrl(collectionSlug: string, id: number | string): string {
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${base}/admin/collections/${collectionSlug}/${id}`
}

/**
 * Emails the site's form alert address when a new entry arrives, naming the form
 * and linking to the entry. A failed email is logged and never stops the entry saving.
 * The seed passes `context: { skipFormAlert: true }` so dummy entries send nothing.
 */
export const sendFormAlert =
  (formName: string): CollectionAfterChangeHook =>
  async ({ collection, context, doc, operation, req }) => {
    if (operation !== 'create' || context.skipFormAlert) return doc
    const name = formName.toLowerCase()
    try {
      const settings = await req.payload.findGlobal({ slug: 'site-settings', req })
      const to = settings.formAlertEmail
      if (!to) {
        req.payload.logger.warn(`No form alert address is set, so the new ${name} was not emailed.`)
        return doc
      }
      const link = adminEntryUrl(collection.slug, doc.id)
      await req.payload.sendEmail({
        to,
        subject: `New ${name} on the website`,
        text: `A new ${name} has arrived.\n\nOpen it in the admin: ${link}\n`,
        html: `<p>A new ${name} has arrived.</p><p><a href="${link}">Open it in the admin</a></p>`,
      })
    } catch (error) {
      req.payload.logger.error({ err: error, msg: `Could not send the alert for a new ${name}.` })
    }
    return doc
  }
```

`src/hooks/honeypot.ts`:

```ts
import { APIError, type CollectionBeforeValidateHook, type Field } from 'payload'

/** Hidden from people, so only bots fill it in. Never stored. */
export const HONEYPOT_FIELD = 'website'

export const honeypotField: Field = {
  name: HONEYPOT_FIELD,
  type: 'text',
  virtual: true,
  admin: { hidden: true },
}

export const dropSpam: CollectionBeforeValidateHook = ({ data, operation }) => {
  const value = data?.[HONEYPOT_FIELD]
  if (operation === 'create' && typeof value === 'string' && value.trim() !== '') {
    throw new APIError('This form could not be sent.', 400, null, true)
  }
  return data
}
```

```bash
npx vitest run tests/unit/email.spec.ts
```

Expected: `3 passed`.

- [ ] **Step 4: Write the failing integration tests**

`tests/int/forms.int.spec.ts`:

```ts
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import type { Manuscript, User } from '@/payload-types'
import { richText } from '@/seed/richText'
import { samplePdf } from '@/seed/samplePdf'

import { createStaff, getTestPayload } from '../helpers/payload'

const DAY = 24 * 60 * 60 * 1000
const fromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()

let payload: Payload
let admin: User
let editor: User
let file: Manuscript

const contact = (overrides: Record<string, unknown> = {}) => ({
  name: 'Ada Visitor',
  email: 'ada@example.com',
  message: 'Hello from the contact form.',
  ...overrides,
})

beforeAll(async () => {
  payload = await getTestPayload()
  admin = await createStaff(payload, 'admin')
  editor = await createStaff(payload, 'editor')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { contactEmail: 'hello@noisystreetss.test', formAlertEmail: 'inbox@noisystreetss.test' },
  })
  file = await payload.create({ collection: 'manuscripts', data: {}, file: samplePdf() })
})

describe('visitors sending forms', () => {
  it('accepts an entry on each of the four simple forms', async () => {
    const entries = [
      { collection: 'contact-messages' as const, data: contact() },
      {
        collection: 'partnership-enquiries' as const,
        data: { name: 'Bola', organisation: 'Lagos Book Fair', email: 'bola@example.com', partnershipType: 'events', message: 'A stall?' },
      },
      {
        collection: 'bookstore-applications' as const,
        data: {
          storeName: 'Rovingheights',
          contactName: 'Tolu',
          email: 'tolu@example.com',
          phone: '+234 800 000 0001',
          address: { line1: '1 Admiralty Way', city: 'Lagos', state: 'Lagos' },
          storeType: 'independent',
        },
      },
      {
        collection: 'advisory-enquiries' as const,
        data: { name: 'Kemi', email: 'kemi@example.com', needs: 'Help planning a memoir.' },
      },
    ]
    for (const entry of entries) {
      const doc = await payload.create({ ...entry, overrideAccess: false } as Parameters<Payload['create']>[0])
      expect(doc.id).toBeTruthy()
    }
  })

  it('starts a visitor entry as New and drops any staff notes', async () => {
    const doc = await payload.create({
      collection: 'contact-messages',
      data: contact({ status: 'done', staffNotes: 'Planted note' }),
      overrideAccess: false,
    })
    const stored = await payload.findByID({ collection: 'contact-messages', id: doc.id })
    expect(stored.status).toBe('new')
    expect(stored.staffNotes ?? null).toBeNull()
  })

  it('refuses an entry that fills in the hidden field', async () => {
    const before = await payload.count({ collection: 'contact-messages' })
    await expect(
      payload.create({ collection: 'contact-messages', data: contact({ website: 'http://spam.example' }), overrideAccess: false }),
    ).rejects.toThrow()
    const after = await payload.count({ collection: 'contact-messages' })
    expect(after.totalDocs).toBe(before.totalDocs)
  })

  it('never lets visitors read entries', async () => {
    await expect(payload.find({ collection: 'contact-messages', overrideAccess: false })).rejects.toThrow()
  })
})

describe('staff alerts', () => {
  it('emails the alert address, naming the form and linking to the entry', async () => {
    const send = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    const doc = await payload.create({ collection: 'contact-messages', data: contact(), overrideAccess: false })
    expect(send).toHaveBeenCalledTimes(1)
    const message = send.mock.calls[0][0]
    expect(message.to).toBe('inbox@noisystreetss.test')
    expect(message.subject).toBe('New contact message on the website')
    expect(String(message.text)).toContain(`/admin/collections/contact-messages/${doc.id}`)
    send.mockRestore()
  })

  it('still saves the entry when the email fails', async () => {
    const send = vi.spyOn(payload, 'sendEmail').mockRejectedValue(new Error('SMTP down'))
    const doc = await payload.create({ collection: 'contact-messages', data: contact(), overrideAccess: false })
    expect(doc.id).toBeTruthy()
    send.mockRestore()
  })
})

describe('staff handling entries', () => {
  it('lets editors read and update entries but not delete them; admins can delete', async () => {
    const doc = await payload.create({ collection: 'contact-messages', data: contact() })
    const updated = await payload.update({
      collection: 'contact-messages',
      id: doc.id,
      data: { status: 'in-progress', staffNotes: 'Replying today.' },
      overrideAccess: false,
      user: editor,
    })
    expect(updated.status).toBe('in-progress')
    await expect(
      payload.delete({ collection: 'contact-messages', id: doc.id, overrideAccess: false, user: editor }),
    ).rejects.toThrow()
    await payload.delete({ collection: 'contact-messages', id: doc.id, overrideAccess: false, user: admin })
  })
})

describe('manuscript submissions', () => {
  const call = (title: string, opensInDays: number, closesInDays: number) =>
    payload.create({
      collection: 'submission-calls',
      data: {
        title,
        themeSummary: 'A theme.',
        guidelines: richText('Up to 5,000 words.'),
        opensAt: fromNow(opensInDays),
        closesAt: fromNow(closesInDays),
        _status: 'published',
      },
    })

  const submission = (callId: number) => ({
    call: callId,
    name: 'Chidi Writer',
    email: 'chidi@example.com',
    workTitle: 'Harmattan Letters',
    shortBio: 'Writes from Enugu.',
    file: file.id,
  })

  it('accepts a manuscript for an open call', async () => {
    const open = await call('Open for forms', -2, 10)
    const doc = await payload.create({ collection: 'manuscript-submissions', data: submission(open.id) })
    expect(doc.status).toBe('new')
  })

  it('refuses closed and upcoming calls', async () => {
    const closed = await call('Closed for forms', -20, -1)
    const upcoming = await call('Upcoming for forms', 5, 20)
    await expect(
      payload.create({ collection: 'manuscript-submissions', data: submission(closed.id) }),
    ).rejects.toThrow(/not open/)
    await expect(
      payload.create({ collection: 'manuscript-submissions', data: submission(upcoming.id) }),
    ).rejects.toThrow(/not open/)
  })
})
```

- [ ] **Step 5: Run them to see them fail**

```bash
npx vitest run tests/int/forms.int.spec.ts
```

Expected: FAIL, because `manuscripts` exists but `contact-messages` doesn't.

- [ ] **Step 6: Write the shared form collection**

`src/collections/forms/formCollection.ts`:

```ts
import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionConfig, Field } from 'payload'

import { anyone, isAdmin, isStaff, isStaffUser } from '@/access'
import { sendFormAlert } from '@/hooks/formAlert'
import { dropSpam, honeypotField } from '@/hooks/honeypot'

/** Whatever a visitor sends, their entry starts as New with no staff notes. */
const visitorEntriesStartNew: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation !== 'create' || isStaffUser(req.user)) return data
  return { ...data, status: 'new', staffNotes: null }
}

type FormCollectionArgs = {
  slug: string
  singular: string
  plural: string
  titleField: string
  fields: Field[]
  beforeValidate?: CollectionBeforeValidateHook[]
}

/** An Inbox list for one website form: visitors create, staff read and update, admins delete. */
export function formCollection({ slug, singular, plural, titleField, fields, beforeValidate = [] }: FormCollectionArgs): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: {
      group: 'Inbox',
      useAsTitle: titleField,
      defaultColumns: [titleField, 'status', 'createdAt'],
    },
    access: { create: anyone, read: isStaff, update: isStaff, delete: isAdmin },
    hooks: {
      beforeValidate: [dropSpam, ...beforeValidate],
      beforeChange: [visitorEntriesStartNew],
      afterChange: [sendFormAlert(singular)],
    },
    fields: [
      ...fields,
      honeypotField,
      {
        name: 'status',
        type: 'select',
        required: true,
        defaultValue: 'new',
        options: [
          { label: 'New', value: 'new' },
          { label: 'In progress', value: 'in-progress' },
          { label: 'Done', value: 'done' },
        ],
        admin: { position: 'sidebar' },
      },
      {
        name: 'staffNotes',
        label: 'Staff notes',
        type: 'textarea',
        admin: { position: 'sidebar', description: 'Only staff see this.' },
      },
    ],
  }
}
```

- [ ] **Step 7: Write the five forms**

`src/collections/forms/ContactMessages.ts`:

```ts
import { formCollection } from './formCollection'

export const ContactMessages = formCollection({
  slug: 'contact-messages',
  singular: 'Contact message',
  plural: 'Contact messages',
  titleField: 'name',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'subject', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
  ],
})
```

`src/collections/forms/PartnershipEnquiries.ts`:

```ts
import { formCollection } from './formCollection'

export const PartnershipEnquiries = formCollection({
  slug: 'partnership-enquiries',
  singular: 'Partnership enquiry',
  plural: 'Partnership enquiries',
  titleField: 'organisation',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'organisation', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    {
      name: 'partnershipType',
      label: 'Type of partnership',
      type: 'select',
      required: true,
      options: [
        { label: 'Sponsorship', value: 'sponsorship' },
        { label: 'Advertising', value: 'advertising' },
        { label: 'Media', value: 'media' },
        { label: 'Events', value: 'events' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'message', type: 'textarea', required: true },
  ],
})
```

`src/collections/forms/BookstoreApplications.ts`:

```ts
import { formCollection } from './formCollection'

export const BookstoreApplications = formCollection({
  slug: 'bookstore-applications',
  singular: 'Bookstore application',
  plural: 'Bookstore applications',
  titleField: 'storeName',
  fields: [
    { name: 'storeName', label: 'Store name', type: 'text', required: true },
    { name: 'contactName', label: 'Contact name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', required: true },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'line1', label: 'Street address', type: 'text', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'state', type: 'text', required: true },
      ],
    },
    { name: 'websiteOrSocial', label: 'Website or social page', type: 'text' },
    {
      name: 'storeType',
      label: 'Type of store',
      type: 'select',
      required: true,
      options: [
        { label: 'Independent bookstore', value: 'independent' },
        { label: 'Chain', value: 'chain' },
        { label: 'Online', value: 'online' },
        { label: 'Library', value: 'library' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'message', type: 'textarea' },
  ],
})
```

`src/collections/forms/AdvisoryEnquiries.ts`:

```ts
import { formCollection } from './formCollection'

export const AdvisoryEnquiries = formCollection({
  slug: 'advisory-enquiries',
  singular: 'Advisory enquiry',
  plural: 'Advisory enquiries',
  titleField: 'name',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'organisation', type: 'text' },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'needs', label: 'What they need', type: 'textarea', required: true },
  ],
})
```

`src/collections/forms/ManuscriptSubmissions.ts`:

```ts
import type { CollectionBeforeValidateHook } from 'payload'

import { callStatus } from '@/rules/submissionCalls'
import { rejectField } from '@/rules/validation'

import { formCollection } from './formCollection'

/** Submissions are only accepted while their call is published and open. */
const callMustBeOpen: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  const raw = data?.call
  const callId = typeof raw === 'object' && raw !== null ? (raw as { id: number }).id : raw
  if (!callId) return data

  const call = await req.payload.findByID({
    collection: 'submission-calls',
    id: callId as number,
    depth: 0,
    req,
    disableErrors: true,
  })
  const isOpen = call && call._status === 'published' && callStatus(call.opensAt, call.closesAt) === 'open'
  if (!isOpen) {
    rejectField(req, 'manuscript-submissions', 'call', 'This call for submissions is not open, so the manuscript could not be sent.')
  }
  return data
}

export const ManuscriptSubmissions = formCollection({
  slug: 'manuscript-submissions',
  singular: 'Manuscript submission',
  plural: 'Manuscript submissions',
  titleField: 'workTitle',
  beforeValidate: [callMustBeOpen],
  fields: [
    { name: 'call', label: 'Submission call', type: 'relationship', relationTo: 'submission-calls', required: true },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'workTitle', label: 'Title of the work', type: 'text', required: true },
    { name: 'wordCount', label: 'Word count', type: 'number', min: 1 },
    { name: 'shortBio', label: 'Short bio', type: 'textarea', required: true },
    { name: 'coverNote', label: 'Cover note', type: 'textarea' },
    { name: 'file', label: 'Manuscript file', type: 'upload', relationTo: 'manuscripts', required: true },
  ],
})
```

- [ ] **Step 8: Register them and the email adapter**

In `src/payload.config.ts`, add the imports:

```ts
import { AdvisoryEnquiries } from './collections/forms/AdvisoryEnquiries'
import { BookstoreApplications } from './collections/forms/BookstoreApplications'
import { ContactMessages } from './collections/forms/ContactMessages'
import { ManuscriptSubmissions } from './collections/forms/ManuscriptSubmissions'
import { PartnershipEnquiries } from './collections/forms/PartnershipEnquiries'
import { emailAdapter } from './email'
```

Append the five to `collections`, after `Partners`. Add, after `editor: lexicalEditor(),`:

```ts
  email: emailAdapter(),
```

- [ ] **Step 9: Regenerate and run everything**

```bash
npm run generate:types
npm test
```

Expected: all pass, including 3 new unit and 9 new integration tests.

- [ ] **Step 10: Send one through the real API and check Mailpit**

Run `npm run dev`. In the admin, open Site settings, fill in the contact email and set "Send form alerts to" to `inbox@noisystreetss.test`. Save. Then in a second terminal:

```bash
curl -s -X POST http://localhost:3000/api/contact-messages -H "Content-Type: application/json" -d "{\"name\":\"Curl Test\",\"email\":\"curl@example.com\",\"message\":\"Sent through the REST API.\"}"
```

Expected: a JSON reply containing `"doc"` with `"status":"new"`. Open `http://localhost:28025`: one email, "New contact message on the website", whose link opens the entry in the admin.

Send the same request with `,\"website\":\"spam\"` added inside the braces. Expected: a 400 reply and no new email.

Screenshot the Inbox group and the opened entry at 1440 x 900 and 390 x 844, and look at each. Stop the dev server and close the browser.

- [ ] **Step 11: Commit**

```bash
git add src tests
git commit -m "Add the five website forms with staff alert emails and a honeypot spam check"
```

---
### Task 17: Dummy content (the seed)

`npm run seed` empties the local database and fills it with dummy content through Payload's Local API, so it can be rerun for a clean start at any time. It refuses to run in production or against any database that isn't on this machine. The content starts from the prototype's copy and its 18 photos, then fills the gaps. Every record type exists, including the awkward cases the spec asks for (a sold-out format, a hidden writer, a scheduled article and so on).

**Files:**
- Create: `src/seed/guard.ts`
- Create: `src/seed/data.ts`
- Create: `src/seed/index.ts`
- Create: `src/seed/run.ts`
- Modify: `package.json` (add the `seed` script)
- Test: `tests/unit/seedGuard.spec.ts`
- Test: `tests/int/seed.int.spec.ts`

**Interfaces:**
- Consumes: every collection and global from Tasks 5 to 16; `richText` (Task 9); `samplePdf` (Task 7); `callStatus` (Task 11); `isUpcomingEvent` (Task 12); `isCareerVisible` (Task 12); `activeAnnouncementsWhere` (Task 14).
- Produces:
  - `assertSafeToSeed(env: Record<string, string | undefined>): void` from `src/seed/guard.ts`
  - `wipe(payload: Payload): Promise<void>` and `seed(payload: Payload): Promise<void>` from `src/seed/index.ts`
  - `npm run seed`
  - staff accounts `admin@noisystreetss.test` (password `admin-dev-password`) and `editor@noisystreetss.test` (password `editor-dev-password`). These passwords are for local development only. `.test` addresses can never receive real mail.

The wipe deletes rows directly (`payload.db.deleteMany`), which skips hooks and doesn't remove files, so it also empties the local upload folders. Seeded form entries pass `context: { skipFormAlert: true }`, so seeding sends no alert emails.

- [ ] **Step 1: Write the failing guard tests**

`tests/unit/seedGuard.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { assertSafeToSeed } from '@/seed/guard'

describe('assertSafeToSeed', () => {
  it('allows a database on this machine', () => {
    expect(() => assertSafeToSeed({ DATABASE_URI: 'postgresql://postgres:postgres@127.0.0.1:5432/noisy_streetss' })).not.toThrow()
    expect(() => assertSafeToSeed({ DATABASE_URI: 'postgresql://postgres:postgres@localhost:5432/noisy_streetss' })).not.toThrow()
  })

  it('refuses production', () => {
    expect(() =>
      assertSafeToSeed({ NODE_ENV: 'production', DATABASE_URI: 'postgresql://postgres:postgres@127.0.0.1:5432/x' }),
    ).toThrow(/production/)
  })

  it('refuses any other host', () => {
    expect(() =>
      assertSafeToSeed({ DATABASE_URI: 'postgresql://user:pass@db.abcdefgh.supabase.co:5432/postgres' }),
    ).toThrow(/local database/)
  })

  it('refuses a missing or broken connection string', () => {
    expect(() => assertSafeToSeed({})).toThrow(/DATABASE_URI/)
    expect(() => assertSafeToSeed({ DATABASE_URI: 'not a url' })).toThrow(/DATABASE_URI/)
  })
})
```

- [ ] **Step 2: Run them to see them fail, then write the guard**

```bash
npx vitest run tests/unit/seedGuard.spec.ts
```

Expected: FAIL, because `@/seed/guard` doesn't exist.

`src/seed/guard.ts`:

```ts
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

/** The seed empties the database first, so it only ever runs against a local, non-production one. */
export function assertSafeToSeed(env: Record<string, string | undefined>): void {
  if (env.NODE_ENV === 'production') throw new Error('The seed never runs in production.')
  const uri = env.DATABASE_URI
  if (!uri) throw new Error('DATABASE_URI is not set.')
  let host: string
  try {
    host = new URL(uri).hostname
  } catch {
    throw new Error('DATABASE_URI is not a valid connection string.')
  }
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`The seed only runs against a local database, not ${host}.`)
  }
}
```

```bash
npx vitest run tests/unit/seedGuard.spec.ts
```

Expected: `4 passed`.

- [ ] **Step 3: Write the failing seed test**

`tests/int/seed.int.spec.ts`:

```ts
import type { CollectionSlug, Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { activeAnnouncementsWhere } from '@/rules/announcements'
import { isCareerVisible } from '@/rules/careers'
import { isUpcomingEvent } from '@/rules/events'
import { callStatus } from '@/rules/submissionCalls'
import { seed } from '@/seed'

import { getTestPayload } from '../helpers/payload'

let payload: Payload

const count = async (collection: CollectionSlug, where = {}) =>
  (await payload.count({ collection, where })).totalDocs

beforeAll(async () => {
  payload = await getTestPayload()
  // Twice in a row: the second run must start clean and end with the same content.
  await seed(payload)
  await seed(payload)
}, 300_000)

describe('the seed', () => {
  it('produces the agreed counts', async () => {
    const expected: Array<[CollectionSlug, number]> = [
      ['users', 2],
      ['media', 18],
      ['categories', 4],
      ['books', 6],
      ['writers', 8],
      ['articles', 12],
      ['podcast-shows', 2],
      ['podcast-episodes', 6],
      ['submission-calls', 3],
      ['awards', 2],
      ['events', 3],
      ['careers', 2],
      ['book-club-sessions', 2],
      ['merch', 4],
      ['studio-services', 4],
      ['membership-plans', 3],
      ['pages', 5],
      ['announcements', 2],
      ['popup-campaigns', 1],
      ['press-mentions', 4],
      ['partners', 4],
      ['contact-messages', 2],
      ['partnership-enquiries', 2],
      ['bookstore-applications', 2],
      ['advisory-enquiries', 2],
      ['manuscript-submissions', 2],
    ]
    for (const [collection, total] of expected) {
      expect(`${collection}: ${await count(collection)}`).toBe(`${collection}: ${total}`)
    }
  })

  it('includes the awkward cases on purpose', async () => {
    const books = (await payload.find({ collection: 'books', limit: 0 })).docs
    expect(books.some((book) => (book.formats ?? []).length >= 2)).toBe(true)
    expect(books.some((book) => (book.formats ?? []).some((format) => format.inStock === false))).toBe(true)
    expect(books.some((book) => !book.sellInShop)).toBe(true)
    expect(books.filter((book) => book.newRelease).length).toBeGreaterThan(0)
    expect(books.filter((book) => book.editorsChoice).length).toBeGreaterThan(0)

    expect(await count('writers', { showOnWritersPage: { equals: false } })).toBe(1)
    expect(await count('articles', { _status: { equals: 'draft' } })).toBe(2)
    expect(await count('articles', { featured: { equals: true } })).toBe(3)
    expect(await count('payload-jobs', { taskSlug: { equals: 'schedulePublish' } })).toBe(1)

    const episodes = (await payload.find({ collection: 'podcast-episodes', limit: 0 })).docs
    expect(episodes.some((e) => e.spotifyUrl && !e.youtubeUrl)).toBe(true)
    expect(episodes.some((e) => e.youtubeUrl && !e.spotifyUrl)).toBe(true)

    const calls = (await payload.find({ collection: 'submission-calls', limit: 0 })).docs
    expect(calls.map((call) => callStatus(call.opensAt, call.closesAt)).sort()).toEqual(['closed', 'open', 'upcoming'])

    const events = (await payload.find({ collection: 'events', limit: 0 })).docs
    expect(events.filter((event) => isUpcomingEvent(event.startsAt, event.endsAt)).length).toBe(2)

    const careers = (await payload.find({ collection: 'careers', limit: 0 })).docs
    expect(careers.filter((career) => isCareerVisible(career.open, career.closingDate)).length).toBe(1)

    expect(await count('book-club-sessions', { registrationOpen: { equals: true } })).toBe(1)
    expect(await count('announcements', activeAnnouncementsWhere())).toBe(1)
    const awards = (await payload.find({ collection: 'awards', limit: 0 })).docs
    expect(awards.filter((award) => (award.pastWinners ?? []).length > 0)).toHaveLength(1)
  })

  it('fills the settings and every page record', async () => {
    const site = await payload.findGlobal({ slug: 'site-settings' })
    expect(site.formAlertEmail).toBe('inbox@noisystreetss.test')
    const pageSlugs = payload.config.globals.map((global) => global.slug).filter((slug) => slug.startsWith('page-'))
    for (const slug of pageSlugs) {
      const record = (await payload.findGlobal({ slug: slug as 'page-home' })) as { heading?: string }
      expect(`${slug}: ${Boolean(record.heading)}`).toBe(`${slug}: true`)
    }
    const privacy = await payload.find({ collection: 'pages', where: { slug: { equals: 'privacy-policy' } } })
    expect(JSON.stringify(privacy.docs[0]?.body)).toContain("Placeholder: replace with the client's policy")
  })
})
```

- [ ] **Step 4: Run it to see it fail**

```bash
npx vitest run tests/int/seed.int.spec.ts
```

Expected: FAIL, because `@/seed` doesn't exist.

- [ ] **Step 5: Write the dummy content**

`src/seed/data.ts`:

```ts
// Dummy content for local development. Adapted from the prototype's copy in src/data/.
// Nothing here comes from the live site.

export const PHOTOS = {
  orchestra: { file: 'unsplash-1465847899084-d164df4dedc6.jpg', alt: 'Violinists performing on stage' },
  portraitGlasses: { file: 'unsplash-1472099645785-5658abf4ff4e.jpg', alt: 'Portrait of a man in glasses and a green shirt' },
  studioMic: { file: 'unsplash-1478737270239-2f02b77fc618.jpg', alt: 'A studio microphone in a dark recording room' },
  portraitJumper: { file: 'unsplash-1500648767791-00dcc994a43e.jpg', alt: 'Portrait of a man in a grey jumper' },
  portraitSmiling: { file: 'unsplash-1507003211169-0a1dd7228f2d.jpg', alt: 'Portrait of a smiling man in a white T-shirt' },
  bookStack: { file: 'unsplash-1512820790803-83ca734da794.jpg', alt: 'A stack of books on a desk' },
  concert: { file: 'unsplash-1516450360452-9312f5e86fc7.jpg', alt: 'A crowd at a concert under coloured stage lights' },
  eventHall: { file: 'unsplash-1519167758481-83f550bb49b3.jpg', alt: 'An event hall set with round tables' },
  bookTunnel: { file: 'unsplash-1532012197267-da84d127e765.jpg', alt: 'An open book framed by a tunnel of bookshelves' },
  portraitBlueLight: { file: 'unsplash-1534528741775-53994a69daeb.jpg', alt: 'Portrait of a woman in blue light' },
  openBook: { file: 'unsplash-1543002588-bfa74002ed7e.jpg', alt: 'An open book with fanned pages' },
  portraitStriped: { file: 'unsplash-1544005313-94ddf0286df2.jpg', alt: 'Portrait of a woman in a striped shirt at sunset' },
  tote: { file: 'unsplash-1544816155-12df9643f363.jpg', alt: 'A plain canvas tote bag' },
  bookOnTable: { file: 'unsplash-1544947950-fa07a98d237f.jpg', alt: 'A black poetry book on a wooden side table' },
  portraitBlazer: { file: 'unsplash-1573496359142-b8d87734a5a2.jpg', alt: 'Portrait of a smiling woman in a grey blazer' },
  podcastMic: { file: 'unsplash-1590602847861-f357a9332bbc.jpg', alt: 'A podcast microphone on a boom arm' },
  studioRoom: { file: 'unsplash-1598488035139-bdbb2231ce04.jpg', alt: 'A recording studio with guitars on the wall' },
  openBooks: { file: 'unsplash-1610116306796-6fea9f4fae38.jpg', alt: 'Open books scattered across a table' },
} as const

export type PhotoKey = keyof typeof PHOTOS

export const STAFF = [
  { email: 'admin@noisystreetss.test', password: 'admin-dev-password', name: 'Dev Admin', role: 'admin' as const },
  { email: 'editor@noisystreetss.test', password: 'editor-dev-password', name: 'Dev Editor', role: 'editor' as const },
]

export const CATEGORIES = [
  { key: 'publishing', name: 'Publishing', description: 'Behind the scenes of making books in Lagos.' },
  { key: 'culture', name: 'Culture', description: 'Essays on the city, its spaces and its people.' },
  { key: 'design', name: 'Design', description: 'Type, covers and the look of African books.' },
  { key: 'excerpts', name: 'Excerpts', description: 'Chapters from Noisy Streetss books.' },
]

export const TAGS = [
  { key: 'lagos', name: 'Lagos' },
  { key: 'printing', name: 'Printing' },
  { key: 'poetry', name: 'Poetry' },
  { key: 'interviews', name: 'Interviews' },
]

export const WRITERS: Array<{ key: string; name: string; photo?: PhotoKey; shortBio: string; showOnWritersPage?: boolean }> = [
  { key: 'modupe', name: 'Modupe Daramola', photo: 'portraitBlazer', shortBio: 'Novelist and mapmaker, writing about the shifting coastline of Lagos.' },
  { key: 'chika', name: 'Chika Alabi', photo: 'portraitBlueLight', shortBio: 'Essayist documenting the creeks and resilience of the Niger Delta.' },
  { key: 'adeoluwa', name: 'Adeoluwa Saro-Wewa', photo: 'portraitSmiling', shortBio: 'Poet of wharves, warehouses and the long roads out of Apapa.' },
  { key: 'funmilayo', name: 'Funmilayo Benson', photo: 'portraitStriped', shortBio: 'Editor of speculative anthologies from across Nigeria.' },
  { key: 'benedict', name: 'Benedict Onwudinjo', photo: 'portraitGlasses', shortBio: 'Writes on logistics, ports and the architecture of the city.' },
  { key: 'silas', name: 'Silas Oribhabor', photo: 'portraitJumper', shortBio: 'Master printer with forty years on the presses in Shomolu.' },
  { key: 'funmi', name: 'Funmi Dada', shortBio: 'Designer and editor, writing about type and African graphic language.' },
  { key: 'tomiwa', name: 'Tomiwa Ogunleye', shortBio: 'A new voice with a first novel in progress.', showOnWritersPage: false },
]

type Format = { formatName: string; priceNGN: number; inStock: boolean; weightGrams: number }

export const BOOKS: Array<{
  key: string
  title: string
  writers: string[]
  category: 'fiction' | 'poetry' | 'anthology' | 'non-fiction'
  cover: PhotoKey
  summary: string
  synopsis: string
  publishDate: string
  pageCount: number
  formats: Format[]
  sellInShop: boolean
  newRelease: boolean
  editorsChoice: boolean
}> = [
  {
    key: 'sandbars',
    title: 'The Cartographer of Sandbars',
    writers: ['modupe'],
    category: 'fiction',
    cover: 'openBook',
    summary: 'A mapmaker races dredging crews to chart the memories of a vanishing lagoon.',
    synopsis: 'Amid the shifting sandbars of the Lagos Lagoon, an eccentric mapmaker races against dredging crews to plot the memories of communities disappearing beneath new concrete.',
    publishDate: '2026-01-15',
    pageCount: 310,
    formats: [
      { formatName: 'Paperback', priceNGN: 12500, inStock: true, weightGrams: 420 },
      { formatName: 'Hardback', priceNGN: 15000, inStock: true, weightGrams: 610 },
    ],
    sellInShop: true,
    newRelease: true,
    editorsChoice: true,
  },
  {
    key: 'postOil',
    title: 'Post-Oil Ecologies',
    writers: ['chika'],
    category: 'non-fiction',
    cover: 'openBooks',
    summary: 'The creeks, furniture and design dialects of the Niger Delta after oil.',
    synopsis: 'A hybrid exploration of Niger Delta creeks, documenting the resilience of plant life, oil-drum furniture and the young people taking back their rivers.',
    publishDate: '2025-11-10',
    pageCount: 245,
    formats: [{ formatName: 'Paperback', priceNGN: 14000, inStock: false, weightGrams: 380 }],
    sellInShop: true,
    newRelease: false,
    editorsChoice: true,
  },
  {
    key: 'cocoaPort',
    title: 'Syllables of the Cocoa Port',
    writers: ['adeoluwa'],
    category: 'poetry',
    cover: 'bookOnTable',
    summary: 'Poems from the industrial rhythms of Apapa Wharf.',
    synopsis: 'A collection documenting the rhythms of Apapa Wharf, the damp of cocoa stores and the voices of lorry drivers at the customs checkpoints.',
    publishDate: '2026-03-02',
    pageCount: 96,
    formats: [{ formatName: 'Paperback', priceNGN: 8000, inStock: true, weightGrams: 180 }],
    sellInShop: true,
    newRelease: true,
    editorsChoice: false,
  },
  {
    key: 'avantGarde',
    title: 'Echoes of the Yoruba Avant-Garde',
    writers: ['funmilayo'],
    category: 'anthology',
    cover: 'bookTunnel',
    summary: 'Speculative writing that meets old spiritual systems with future Lagos.',
    synopsis: 'An anthology of speculative and multi-genre work by Nigerian writers, merging ancient spiritual systems with a cybernetic future Lagos.',
    publishDate: '2025-09-20',
    pageCount: 288,
    formats: [{ formatName: 'Paperback', priceNGN: 16000, inStock: true, weightGrams: 450 }],
    sellInShop: true,
    newRelease: false,
    editorsChoice: false,
  },
  {
    key: 'harmattan',
    title: 'Harmattan Ledger',
    writers: ['tomiwa'],
    category: 'fiction',
    cover: 'bookStack',
    summary: 'A first novel, coming soon: a clerk keeps the accounts of a dusty season.',
    synopsis: 'A junior clerk in a Kano trading house keeps a secret second ledger through one long harmattan.',
    publishDate: '2026-12-01',
    pageCount: 240,
    formats: [],
    sellInShop: false,
    newRelease: false,
    editorsChoice: false,
  },
  {
    key: 'shomoluLetters',
    title: 'Letters from Shomolu',
    writers: ['silas', 'funmi'],
    category: 'non-fiction',
    cover: 'openBooks',
    summary: 'A printer and a designer trade letters about making books by hand.',
    synopsis: 'Forty years of presswork and a young designer’s questions, in letters exchanged across one year in the Shomolu print district.',
    publishDate: '2026-10-01',
    pageCount: 180,
    formats: [{ formatName: 'Paperback', priceNGN: 9500, inStock: true, weightGrams: 300 }],
    sellInShop: true,
    newRelease: true,
    editorsChoice: false,
  },
]

export const ARTICLES: Array<{
  title: string
  summary: string
  paragraphs: string[]
  writers: string[]
  categories: string[]
  tags: string[]
  cover: PhotoKey
  featured: boolean
  /** Negative for the past. The scheduled article uses a future date. */
  publishInDays: number
  state: 'published' | 'draft' | 'scheduled'
}> = [
  { title: 'How Books Get Printed in the Storm', summary: 'The material realities of presswork in Lagos.', paragraphs: ['To publish a book in Nigeria is to negotiate with diesel engines, humidity and the price of ink rollers.', 'This friction is exactly why the books hold their weight.'], writers: ['modupe'], categories: ['publishing'], tags: ['printing', 'lagos'], cover: 'bookStack', featured: true, publishInDays: -40, state: 'published' },
  { title: 'The Architecture of the Lagos Verandah', summary: 'A study in social space and editorial solitude.', paragraphs: ['The verandah is where the street and the house negotiate.', 'Writers have always needed a place that is half in and half out.'], writers: ['benedict'], categories: ['culture'], tags: ['lagos'], cover: 'eventHall', featured: true, publishInDays: -35, state: 'published' },
  { title: 'Beyond the Cheetah Print Cliche', summary: 'Forging a modern African graphic language.', paragraphs: ['Book covers from the continent are too often dressed in borrowed patterns.', 'A new graphic language starts with the letters themselves.'], writers: ['funmi'], categories: ['design'], tags: [], cover: 'bookTunnel', featured: true, publishInDays: -30, state: 'published' },
  { title: 'Excerpt: The Cartographer of Sandbars', summary: 'The first chapter of Modupe Daramola’s novel.', paragraphs: ['The lagoon had moved again in the night.', 'By morning the map was already wrong.'], writers: ['modupe'], categories: ['excerpts'], tags: [], cover: 'openBook', featured: false, publishInDays: -28, state: 'published' },
  { title: 'Excerpt: Post-Oil Ecologies', summary: 'A chapter on the furniture of the creeks.', paragraphs: ['Every oil drum in the delta has had three lives.', 'The third is usually a chair.'], writers: ['chika'], categories: ['excerpts'], tags: [], cover: 'openBooks', featured: false, publishInDays: -25, state: 'published' },
  { title: 'Excerpt: Syllables of the Cocoa Port', summary: 'Three poems from the collection.', paragraphs: ['Wharf light, then the slow arithmetic of cranes.'], writers: ['adeoluwa'], categories: ['excerpts'], tags: ['poetry'], cover: 'bookOnTable', featured: false, publishInDays: -21, state: 'published' },
  { title: 'Excerpt: Echoes of the Yoruba Avant-Garde', summary: 'The anthology’s opening story.', paragraphs: ['The oracle answered in binary, which surprised no one.'], writers: ['funmilayo'], categories: ['excerpts'], tags: [], cover: 'bookTunnel', featured: false, publishInDays: -18, state: 'published' },
  { title: 'Mapping Memories of Coastal Lagos', summary: 'How sandbars and tides reshape community history.', paragraphs: ['Coastal communities keep their history in landmarks that move.'], writers: ['modupe'], categories: ['culture'], tags: ['lagos'], cover: 'openBook', featured: false, publishInDays: -14, state: 'published' },
  { title: 'The Heidelberg Press and Industrial Resilience', summary: 'Silas Oribhabor on keeping offset presses running.', paragraphs: ['A press that is fifty years old has outlived three currencies.'], writers: ['silas'], categories: ['publishing'], tags: ['printing', 'interviews'], cover: 'bookStack', featured: false, publishInDays: -10, state: 'published' },
  { title: 'Recording in the Dynamic City', summary: 'Building quiet audio booths in a loud city.', paragraphs: ['Silence in Lagos has to be built, layer by layer.'], writers: ['benedict'], categories: ['culture'], tags: ['interviews'], cover: 'studioMic', featured: false, publishInDays: -6, state: 'published' },
  { title: 'Notes from a Book Fair', summary: 'An unfinished report from the stalls.', paragraphs: ['Draft: notes still to be written up.'], writers: ['funmi'], categories: ['publishing'], tags: [], cover: 'eventHall', featured: false, publishInDays: -1, state: 'draft' },
  { title: 'Designing a Book Jacket in Yaba', summary: 'From first sketch to final proof.', paragraphs: ['Every jacket starts as a pencil line on the back of a proof.'], writers: ['funmi'], categories: ['design'], tags: [], cover: 'bookStack', featured: false, publishInDays: 7, state: 'scheduled' },
]

export const PODCAST_SHOWS = [
  { key: 'conversations', name: 'Noisy Conversations', description: 'Writers in conversation about the work.', cover: 'podcastMic' as PhotoKey, spotifyUrl: 'https://open.spotify.com/show/dummy-conversations' },
  { key: 'sessions', name: 'Shomolu Sessions', description: 'Readings recorded in the studio.', cover: 'studioMic' as PhotoKey, youtubeUrl: 'https://www.youtube.com/@dummy-shomolu-sessions' },
]

export const PODCAST_EPISODES: Array<{
  show: string
  title: string
  episodeNumber: number
  daysAgo: number
  summary: string
  spotifyUrl?: string
  youtubeUrl?: string
  guests: string[]
  lengthMinutes: number
}> = [
  { show: 'conversations', title: 'Mapping a Moving City', episodeNumber: 1, daysAgo: 60, summary: 'Modupe Daramola on maps, memory and the lagoon.', spotifyUrl: 'https://open.spotify.com/episode/dummy-1', youtubeUrl: 'https://www.youtube.com/watch?v=dummy1', guests: ['modupe'], lengthMinutes: 48 },
  { show: 'conversations', title: 'Poems from the Wharf', episodeNumber: 2, daysAgo: 45, summary: 'Adeoluwa Saro-Wewa reads and talks about Apapa.', spotifyUrl: 'https://open.spotify.com/episode/dummy-2', guests: ['adeoluwa'], lengthMinutes: 37 },
  { show: 'conversations', title: 'Editing the Future', episodeNumber: 3, daysAgo: 30, summary: 'Funmilayo Benson on putting an anthology together.', spotifyUrl: 'https://open.spotify.com/episode/dummy-3', youtubeUrl: 'https://www.youtube.com/watch?v=dummy3', guests: ['funmilayo'], lengthMinutes: 52 },
  { show: 'sessions', title: 'Session One: The Lagoon', episodeNumber: 1, daysAgo: 50, summary: 'A reading from The Cartographer of Sandbars.', youtubeUrl: 'https://www.youtube.com/watch?v=dummy4', guests: ['modupe'], lengthMinutes: 22 },
  { show: 'sessions', title: 'Session Two: The Delta', episodeNumber: 2, daysAgo: 20, summary: 'A reading from Post-Oil Ecologies.', spotifyUrl: 'https://open.spotify.com/episode/dummy-5', youtubeUrl: 'https://www.youtube.com/watch?v=dummy5', guests: ['chika'], lengthMinutes: 25 },
  { show: 'sessions', title: 'Session Three: The Press', episodeNumber: 3, daysAgo: 5, summary: 'Silas Oribhabor at the Heidelberg.', spotifyUrl: 'https://open.spotify.com/episode/dummy-6', youtubeUrl: 'https://www.youtube.com/watch?v=dummy6', guests: ['silas'], lengthMinutes: 31 },
]

export const SUBMISSION_CALLS = [
  { key: 'open', title: 'Lagos After Dark', themeSummary: 'Stories and poems set in the city at night.', opensInDays: -10, closesInDays: 20, cover: 'concert' as PhotoKey },
  { key: 'upcoming', title: 'Water and Memory', themeSummary: 'Writing about rivers, lagoons and the sea.', opensInDays: 15, closesInDays: 45, cover: 'openBook' as PhotoKey },
  { key: 'closed', title: 'City of Noise', themeSummary: 'The sound of Nigerian cities on the page.', opensInDays: -60, closesInDays: -30, cover: 'concert' as PhotoKey },
]

export const EVENTS = [
  { title: 'Book launch: Letters from Shomolu', startsInDays: 7, hours: 3, venue: 'The Shomolu print room', image: 'eventHall' as PhotoKey, actionLabel: 'Reserve a seat' },
  { title: 'Writers’ workshop in the Surulere courtyard', startsInDays: 21, hours: 5, venue: 'Surulere courtyard', image: 'bookTunnel' as PhotoKey, actionLabel: 'Book a place' },
  { title: 'Poetry night', startsInDays: -14, hours: 3, venue: 'Yaba studio', image: 'concert' as PhotoKey, actionLabel: 'See photos' },
]

export const MERCH = [
  { title: 'Official Noisy Canvas Tote Bag', images: ['tote'] as PhotoKey[], description: 'Heavy cotton canvas, screen-printed in deep indigo.', priceNGN: 12000, inStock: true, weightGrams: 300, type: 'apparel' as const },
  { title: 'The Shomolu Hardbound Sketchbook', images: ['bookStack'] as PhotoKey[], description: 'Handbound in Lagos. 160 pages of heavy drawing paper with a lay-flat spine.', priceNGN: 10000, inStock: true, weightGrams: 450, type: 'stationery' as const },
  { title: 'Noisy Streetss Pocket Notebook', images: ['openBooks'] as PhotoKey[], description: 'A slim lined notebook for the commute.', priceNGN: 4000, inStock: true, weightGrams: 120, type: 'stationery' as const },
  { title: 'Reader’s Cap', images: ['tote'] as PhotoKey[], description: 'A soft cotton cap. Back soon.', priceNGN: 7000, inStock: false, weightGrams: 150, type: 'apparel' as const },
]

export const STUDIO_SERVICES = [
  { name: 'Vocal booth', description: 'A treated booth for voice-overs and vocals.', hourlyRateNGN: 15000, inclusions: ['Condenser microphone', 'Engineer for the first hour'], images: ['studioMic'] as PhotoKey[], sortOrder: 1 },
  { name: 'Podcast recording', description: 'Two-person podcast set-up with video.', halfDayRateNGN: 45000, fullDayRateNGN: 80000, inclusions: ['Two microphones', 'Two cameras', 'Basic edit'], images: ['podcastMic'] as PhotoKey[], sortOrder: 2 },
  { name: 'Mixing and mastering', description: 'Finishing for music and spoken word.', hourlyRateNGN: 20000, inclusions: ['Two rounds of changes'], images: ['studioRoom'] as PhotoKey[], sortOrder: 3 },
  { name: 'Full studio day', description: 'The whole studio, with an engineer, for a day.', fullDayRateNGN: 120000, inclusions: ['Live room', 'Control room', 'Engineer'], images: ['studioRoom'] as PhotoKey[], sortOrder: 4 },
]

export const MEMBERSHIP_PLANS = [
  { name: 'Reader', priceNGN: 5000, billing: 'monthly' as const, perks: ['20% off books', 'Book Club registration'], sortOrder: 1 },
  { name: 'Patron', priceNGN: 50000, billing: 'yearly' as const, perks: ['20% off books', 'Book Club registration', 'Studio booking history'], sortOrder: 2 },
  { name: 'Friend of the Press', priceNGN: 2500, billing: 'monthly' as const, perks: ['20% off books'], sortOrder: 3 },
]

export const LEGAL_PLACEHOLDER = "Placeholder: replace with the client's policy."

export const BASIC_PAGES = [
  { title: 'Privacy policy', slug: 'privacy-policy', paragraphs: [LEGAL_PLACEHOLDER] },
  { title: 'Terms of use', slug: 'terms', paragraphs: [LEGAL_PLACEHOLDER] },
  { title: 'Shop terms', slug: 'shop-terms', paragraphs: [LEGAL_PLACEHOLDER] },
  { title: 'Cookie policy', slug: 'cookies', paragraphs: [LEGAL_PLACEHOLDER] },
  { title: 'Values', slug: 'values', paragraphs: ['Dummy text: the values copy is still to come from the client.'] },
]

export const PRESS_MENTIONS = [
  { outlet: 'The Lagos Review', headline: 'A small press with a loud voice', daysAgo: 90 },
  { outlet: 'Culture Desk Weekly', headline: 'Inside the Shomolu print room', daysAgo: 60 },
  { outlet: 'Pages Africa', headline: 'Five presses to watch this year', daysAgo: 40 },
  { outlet: 'City Radio', headline: 'Noisy Streetss on publishing in Lagos', daysAgo: 15 },
]

export const PARTNERS = [
  { name: 'Lagos Book Fair', quote: 'A brilliant stall every year.', quoteBy: 'Dummy Organiser', quoteByTitle: 'Fair director' },
  { name: 'Surulere Arts Trust', quote: 'Reliable and imaginative partners.', quoteBy: 'Dummy Trustee', quoteByTitle: 'Programme lead' },
  { name: 'Yaba Design School' },
  { name: 'Ibadan Writers’ Workshop' },
]

/** Heading and intro for each page record. */
export const PAGE_COPY: Record<string, { heading: string; intro: string; heroImage?: PhotoKey }> = {
  'page-home': { heading: 'Literature from the streets of Lagos', intro: 'Dummy text: a journal, a press, a studio and a podcast.', heroImage: 'bookTunnel' },
  'page-publishing': { heading: 'Publishing', intro: 'Dummy text: books made in Lagos.', heroImage: 'openBooks' },
  'page-writers': { heading: 'Our Writers', intro: 'Dummy text: the writers behind the books.' },
  'page-submissions': { heading: 'Submissions', intro: 'Dummy text: how to send work.' },
  'page-awards': { heading: 'Awards', intro: 'Dummy text: prizes run by Noisy Streetss.' },
  'page-advisory': { heading: 'Advisory', intro: 'Dummy text: publishing advice for writers and organisations.' },
  'page-distribution': { heading: 'Distribution', intro: 'Dummy text: getting books into stores.' },
  'page-studio': { heading: 'Studio', intro: 'Dummy text: a recording studio in Lagos.', heroImage: 'studioRoom' },
  'page-blog': { heading: 'Blog', intro: 'Dummy text: essays, excerpts and notes.' },
  'page-podcast': { heading: 'Podcast', intro: 'Dummy text: conversations and readings.', heroImage: 'podcastMic' },
  'page-shop': { heading: 'Shop', intro: 'Dummy text: books and merch, delivered across Nigeria.' },
  'page-book-club': { heading: 'Book Club', intro: 'Dummy text: read along with other members.' },
  'page-membership': { heading: 'Membership', intro: 'Dummy text: support the press and save on books.' },
  'page-events': { heading: 'Events', intro: 'Dummy text: launches, readings and workshops.', heroImage: 'eventHall' },
  'page-careers': { heading: 'Careers', intro: 'Dummy text: work with Noisy Streetss.' },
  'page-who-we-are': { heading: 'Who We Are', intro: 'Dummy text: the story of the press.' },
  'page-press': { heading: 'Press', intro: 'Dummy text: what others have written.' },
  'page-contact': { heading: 'Contact', intro: 'Dummy text: get in touch.' },
  'page-partner': { heading: 'Partner with Noisy Streetss', intro: 'Dummy text: sponsorship, media and events.' },
  'page-support': { heading: 'Support', intro: 'Dummy text: ways to support the press.' },
}
```

- [ ] **Step 6: Write the seed**

`src/seed/index.ts`:

```ts
import fs from 'node:fs'
import path from 'node:path'
import type { Payload } from 'payload'

import {
  ARTICLES,
  BASIC_PAGES,
  BOOKS,
  CATEGORIES,
  EVENTS,
  MEMBERSHIP_PLANS,
  MERCH,
  PAGE_COPY,
  PARTNERS,
  PHOTOS,
  type PhotoKey,
  PODCAST_EPISODES,
  PODCAST_SHOWS,
  PRESS_MENTIONS,
  STAFF,
  STUDIO_SERVICES,
  SUBMISSION_CALLS,
  TAGS,
  WRITERS,
} from './data'
import { richText } from './richText'
import { samplePdf } from './samplePdf'

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const fromNow = (ms: number) => new Date(Date.now() + ms).toISOString()
const PHOTO_DIR = path.resolve(process.cwd(), 'public/images/unsplash')
/** Seeded form entries must not email staff. */
const quiet = { skipFormAlert: true }

/** Empties every collection except the migrations record, and the local upload folders. */
export async function wipe(payload: Payload): Promise<void> {
  for (const collection of payload.config.collections) {
    if (collection.slug === 'payload-migrations') continue
    await payload.db.deleteMany({ collection: collection.slug, where: {} })
    if (collection.versions) await payload.db.deleteVersions({ collection: collection.slug, where: {} })
  }
  for (const collection of payload.config.collections) {
    const dir = collection.upload ? collection.upload.staticDir : undefined
    if (dir) fs.rmSync(dir, { recursive: true, force: true })
  }
}

async function byKey<T extends { key: string }>(items: T[], make: (item: T) => Promise<{ id: number }>) {
  const ids: Record<string, number> = {}
  for (const item of items) ids[item.key] = (await make(item)).id
  return ids
}

export async function seed(payload: Payload): Promise<void> {
  await wipe(payload)

  // Staff. The first account created is the admin.
  const staff = []
  for (const account of STAFF) staff.push(await payload.create({ collection: 'users', data: account }))
  const admin = staff[0]

  // Images
  const photos = {} as Record<PhotoKey, number>
  for (const [key, photo] of Object.entries(PHOTOS)) {
    const doc = await payload.create({
      collection: 'media',
      data: { alt: photo.alt },
      filePath: path.join(PHOTO_DIR, photo.file),
    })
    photos[key as PhotoKey] = doc.id
  }

  const categories = await byKey(CATEGORIES, (c) =>
    payload.create({ collection: 'categories', data: { name: c.name, description: c.description } }),
  )
  const tags = await byKey(TAGS, (t) => payload.create({ collection: 'tags', data: { name: t.name } }))

  const writers = await byKey(WRITERS, (w) =>
    payload.create({
      collection: 'writers',
      data: {
        name: w.name,
        photo: w.photo ? photos[w.photo] : undefined,
        shortBio: w.shortBio,
        bio: richText(w.shortBio, 'Dummy text: a longer biography goes here.'),
        showOnWritersPage: w.showOnWritersPage ?? true,
        _status: 'published',
      },
    }),
  )

  const books = await byKey(BOOKS, (b) =>
    payload.create({
      collection: 'books',
      data: {
        title: b.title,
        cover: photos[b.cover],
        writers: b.writers.map((key) => writers[key]),
        category: b.category,
        summary: b.summary,
        synopsis: richText(b.synopsis),
        publishDate: new Date(b.publishDate).toISOString(),
        pageCount: b.pageCount,
        formats: b.formats,
        sellInShop: b.sellInShop,
        newRelease: b.newRelease,
        editorsChoice: b.editorsChoice,
        _status: 'published',
      },
    }),
  )

  for (const a of ARTICLES) {
    const data = {
      title: a.title,
      cover: photos[a.cover],
      summary: a.summary,
      body: richText(...a.paragraphs),
      writers: a.writers.map((key) => writers[key]),
      categories: a.categories.map((key) => categories[key]),
      tags: a.tags.map((key) => tags[key]),
      featured: a.featured,
      publishDate: fromNow(a.publishInDays * DAY),
    }
    if (a.state === 'published') {
      await payload.create({ collection: 'articles', data: { ...data, _status: 'published' } })
      continue
    }
    const draft = await payload.create({ collection: 'articles', data, draft: true })
    if (a.state === 'scheduled') {
      await payload.jobs.queue({
        task: 'schedulePublish',
        input: {
          type: 'publish',
          doc: { relationTo: 'articles', value: String(draft.id) },
          user: { relationTo: 'users', value: admin.id },
        },
        waitUntil: new Date(Date.now() + a.publishInDays * DAY),
      })
    }
  }

  const shows = await byKey(PODCAST_SHOWS, (s) =>
    payload.create({
      collection: 'podcast-shows',
      data: { name: s.name, description: s.description, cover: photos[s.cover], spotifyUrl: s.spotifyUrl, youtubeUrl: s.youtubeUrl },
    }),
  )
  for (const e of PODCAST_EPISODES) {
    await payload.create({
      collection: 'podcast-episodes',
      data: {
        title: e.title,
        show: shows[e.show],
        episodeNumber: e.episodeNumber,
        date: fromNow(-e.daysAgo * DAY),
        summary: e.summary,
        showNotes: richText(e.summary, 'Dummy text: full show notes go here.'),
        spotifyUrl: e.spotifyUrl,
        youtubeUrl: e.youtubeUrl,
        guests: e.guests.map((key) => writers[key]),
        lengthMinutes: e.lengthMinutes,
        _status: 'published',
      },
    })
  }

  const calls = await byKey(SUBMISSION_CALLS, (c) =>
    payload.create({
      collection: 'submission-calls',
      data: {
        title: c.title,
        themeSummary: c.themeSummary,
        guidelines: richText('Send up to 5,000 words of prose or up to 5 poems.', 'PDF or Word files only, 10 MB at most.'),
        opensAt: fromNow(c.opensInDays * DAY),
        closesAt: fromNow(c.closesInDays * DAY),
        cover: photos[c.cover],
        _status: 'published',
      },
    }),
  )

  await payload.create({
    collection: 'awards',
    data: {
      name: 'Noisy Streetss Prize for Short Fiction',
      summary: 'An annual prize for an unpublished short story by a Nigerian writer.',
      status: 'open',
      prize: '₦500,000 and publication',
      rules: richText('Dummy text: the rules go here.'),
      keyDates: [
        { label: 'Entries close', date: fromNow(30 * DAY) },
        { label: 'Shortlist announced', date: fromNow(60 * DAY) },
      ],
      howToEnter: richText('Dummy text: how to enter goes here.'),
      entryUrl: 'https://example.com/enter',
      cover: photos.openBook,
      _status: 'published',
    },
  })
  await payload.create({
    collection: 'awards',
    data: {
      name: 'Shomolu Poetry Award',
      summary: 'Celebrating a debut collection of poetry.',
      status: 'winners-announced',
      prize: '₦250,000',
      pastWinners: [
        { year: 2024, name: 'Adeoluwa Saro-Wewa', work: 'Syllables of the Cocoa Port' },
        { year: 2025, name: 'Dummy Winner', work: 'Dummy Collection' },
      ],
      cover: photos.bookOnTable,
      _status: 'published',
    },
  })

  for (const e of EVENTS) {
    const startsAt = Date.now() + e.startsInDays * DAY
    await payload.create({
      collection: 'events',
      data: {
        title: e.title,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(startsAt + e.hours * HOUR).toISOString(),
        venue: e.venue,
        address: 'Dummy address, Lagos',
        description: richText('Dummy text: event details go here.'),
        image: photos[e.image],
        actionUrl: 'https://example.com/tickets',
        actionLabel: e.actionLabel,
        _status: 'published',
      },
    })
  }

  await payload.create({
    collection: 'careers',
    data: {
      role: 'Assistant Editor',
      type: 'full-time',
      location: 'Lagos',
      description: richText('Dummy text: about the role.'),
      howToApply: 'Dummy text: send a CV and a short letter.',
      closingDate: fromNow(30 * DAY),
      open: true,
      _status: 'published',
    },
  })
  await payload.create({
    collection: 'careers',
    data: {
      role: 'Social Media Intern',
      type: 'internship',
      location: 'Lagos or remote',
      description: richText('Dummy text: about the internship.'),
      howToApply: 'Dummy text: send links to work you are proud of.',
      closingDate: fromNow(-5 * DAY),
      open: true,
      _status: 'published',
    },
  })

  await payload.create({
    collection: 'book-club-sessions',
    data: {
      book: books.cocoaPort,
      title: 'Reading Syllables of the Cocoa Port',
      startsAt: fromNow(10 * DAY),
      venue: 'Yaba studio',
      description: 'Dummy text: bring a favourite poem.',
      registrationOpen: true,
      _status: 'published',
    },
  })
  await payload.create({
    collection: 'book-club-sessions',
    data: {
      title: 'Short story circle',
      startsAt: fromNow(40 * DAY),
      onlineUrl: 'https://example.com/meeting',
      description: 'Dummy text: read three stories before the session.',
      registrationOpen: false,
      _status: 'published',
    },
  })

  for (const m of MERCH) {
    await payload.create({
      collection: 'merch',
      data: { ...m, images: m.images.map((key) => photos[key]), _status: 'published' },
    })
  }
  for (const s of STUDIO_SERVICES) {
    await payload.create({
      collection: 'studio-services',
      data: {
        ...s,
        inclusions: s.inclusions.map((item) => ({ item })),
        images: s.images.map((key) => photos[key]),
        bookable: true,
        _status: 'published',
      },
    })
  }
  for (const p of MEMBERSHIP_PLANS) {
    await payload.create({
      collection: 'membership-plans',
      data: { ...p, perks: p.perks.map((perk) => ({ perk })), active: true },
    })
  }

  for (const page of BASIC_PAGES) {
    await payload.create({
      collection: 'pages',
      data: { title: page.title, slug: page.slug, body: richText(...page.paragraphs), _status: 'published' },
    })
  }

  await payload.create({
    collection: 'announcements',
    data: {
      text: 'Submissions are open for Lagos After Dark',
      url: 'https://example.com/submissions',
      buttonLabel: 'Send your work',
      startsAt: fromNow(-2 * DAY),
    },
  })
  await payload.create({
    collection: 'announcements',
    data: { text: 'Order by Friday for holiday delivery', startsAt: fromNow(-20 * DAY), endsAt: fromNow(-3 * DAY) },
  })

  await payload.create({
    collection: 'popup-campaigns',
    data: {
      book: books.shomoluLetters,
      headline: 'New: Letters from Shomolu',
      pitch: 'A printer and a designer trade letters about making books by hand.',
      buttonLabel: 'Buy the book',
      startsAt: fromNow(-1 * DAY),
      endsAt: fromNow(14 * DAY),
      enabled: true,
    },
  })

  for (const p of PRESS_MENTIONS) {
    await payload.create({
      collection: 'press-mentions',
      data: {
        outlet: p.outlet,
        headline: p.headline,
        url: 'https://example.com/press',
        date: fromNow(-p.daysAgo * DAY),
        quote: 'Dummy quote from the piece.',
      },
    })
  }
  for (const [index, p] of PARTNERS.entries()) {
    await payload.create({ collection: 'partners', data: { ...p, sortOrder: index + 1 } })
  }

  // Settings and page records
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      contactEmail: 'hello@noisystreetss.test',
      phone: '+234 800 000 0000',
      address: 'Dummy address, Shomolu, Lagos',
      socialLinks: [
        { platform: 'instagram', url: 'https://www.instagram.com/dummy' },
        { platform: 'x', url: 'https://x.com/dummy' },
      ],
      footerText: 'Dummy text: footer line.',
      newsletterText: 'Dummy text: new books and events, once a month.',
      defaultShareImage: photos.bookTunnel,
      formAlertEmail: 'inbox@noisystreetss.test',
    },
  })
  await payload.updateGlobal({
    slug: 'shop-settings',
    data: {
      pickupAddress: { name: 'Dummy Dispatch', phone: '+234 800 000 0001', line1: 'Dummy street', city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
      flatDeliveryPrices: [
        { areaName: 'Lagos Mainland', priceNGN: 2500 },
        { areaName: 'Lagos Island', priceNGN: 3000 },
        { areaName: 'Rest of Nigeria', priceNGN: 5000 },
      ],
      memberDiscountPercent: 20,
      unpaidOrderExpiryMinutes: 30,
      orderAlertEmail: 'orders@noisystreetss.test',
    },
  })
  for (const [slug, copy] of Object.entries(PAGE_COPY)) {
    await payload.updateGlobal({
      slug: slug as 'page-home',
      data: {
        heading: copy.heading,
        intro: richText(copy.intro),
        heroImage: copy.heroImage ? photos[copy.heroImage] : undefined,
        ...(slug === 'page-submissions'
          ? { guidelines: richText('Dummy text: the general submission guidelines go here.') }
          : {}),
      },
    })
  }

  // Form entries, two per form. Passed as the admin so statuses and notes are kept.
  const asAdmin = { user: admin, context: quiet }
  const contact = [
    { name: 'Ada Visitor', email: 'ada@example.com', subject: 'Stockists', message: 'Dummy text: where can I buy your books?' },
    { name: 'Bayo Reader', email: 'bayo@example.com', message: 'Dummy text: loved the last reading.', status: 'in-progress' as const, staffNotes: 'Replying this week.' },
  ]
  for (const data of contact) await payload.create({ collection: 'contact-messages', data, ...asAdmin })

  const partnerships = [
    { name: 'Chioma', organisation: 'Dummy Brand Ltd', email: 'chioma@example.com', partnershipType: 'sponsorship' as const, message: 'Dummy text: sponsoring the prize.' },
    { name: 'Dayo', organisation: 'Dummy Radio', email: 'dayo@example.com', partnershipType: 'media' as const, message: 'Dummy text: a radio series.' },
  ]
  for (const data of partnerships) await payload.create({ collection: 'partnership-enquiries', data, ...asAdmin })

  const bookstores = [
    { storeName: 'Dummy Books Ikeja', contactName: 'Efe', email: 'efe@example.com', phone: '+234 800 000 0002', address: { line1: 'Dummy road', city: 'Ikeja', state: 'Lagos' }, storeType: 'independent' as const },
    { storeName: 'Dummy Online Books', contactName: 'Femi', email: 'femi@example.com', phone: '+234 800 000 0003', address: { line1: 'Dummy close', city: 'Abuja', state: 'FCT' }, storeType: 'online' as const, websiteOrSocial: 'https://example.com/shop' },
  ]
  for (const data of bookstores) await payload.create({ collection: 'bookstore-applications', data, ...asAdmin })

  const advisory = [
    { name: 'Gbenga', email: 'gbenga@example.com', needs: 'Dummy text: help publishing a memoir.' },
    { name: 'Halima', organisation: 'Dummy Foundation', email: 'halima@example.com', needs: 'Dummy text: an annual report as a book.', status: 'done' as const },
  ]
  for (const data of advisory) await payload.create({ collection: 'advisory-enquiries', data, ...asAdmin })

  for (const [index, writer] of ['Ifeoma Writer', 'Jide Writer'].entries()) {
    const file = await payload.create({ collection: 'manuscripts', data: {}, file: samplePdf(`sample-manuscript-${index + 1}.pdf`) })
    await payload.create({
      collection: 'manuscript-submissions',
      data: {
        call: calls.open,
        name: writer,
        email: `writer${index + 1}@example.com`,
        workTitle: `Dummy Manuscript ${index + 1}`,
        wordCount: 4200,
        shortBio: 'Dummy text: a short bio.',
        coverNote: 'Dummy text: a cover note.',
        file: file.id,
      },
      ...asAdmin,
    })
  }
}
```

`src/seed/run.ts`:

```ts
import { getPayload } from 'payload'

import config from '../payload.config'
import { assertSafeToSeed } from './guard'
import { seed } from './index'

assertSafeToSeed(process.env)

const payload = await getPayload({ config })
await seed(payload)
payload.logger.info(
  'Seed finished. Log in at /admin as admin@noisystreetss.test (admin-dev-password) or editor@noisystreetss.test (editor-dev-password).',
)
process.exit(0)
```

Add to `scripts` in `package.json`:

```json
    "seed": "cross-env NODE_OPTIONS=--no-deprecation payload run src/seed/run.ts",
```

- [ ] **Step 7: Run the tests**

```bash
npm test
```

Expected: all pass, including 4 new unit tests and 3 new seed tests. The seed test runs the seed twice and takes a minute or two.

If a count is off, the failure message names the collection, for example `expected 'books: 5' to be 'books: 6'`.

- [ ] **Step 8: Seed the development database twice and look at it**

```bash
npm run seed
npm run seed
```

Expected: both finish with "Seed finished." and no errors. Run `npm run dev`, then:

1. Log in as `admin@noisystreetss.test`. Check that every menu group from spec section 7.3 is there (Publishing, Editorial, What's on, Shop and services, About, Pages, Inbox, Media, Settings), and that the lists are full. Open a book, an article and the Home page record.
2. Log out and log in as `editor@noisystreetss.test`. Expected: no Shop settings and no Staff accounts in the menu, and `/admin/globals/shop-settings` is refused.
3. Open `http://localhost:28025`. Expected: no alert emails from seeding.

Screenshot the admin dashboard for each account, a filled book and the Inbox list, at 1440 x 900 and 390 x 844, and look at each. Stop the dev server and close the browser.

- [ ] **Step 9: Commit**

```bash
git add package.json src tests
git commit -m "Add the seed: dummy content for every type, safe to rerun, local databases only"
```

---
### Task 18: The first migration and the final checks

So far the local database has followed the code automatically (Payload's development "push"). B1 ends by generating the first migration: a script that builds the whole database from nothing, in order. From here on, every schema change ships as a migration, and production only ever runs migrations, never push.

**Files:**
- Create: `src/migrations/<timestamp>_initial.ts`, `src/migrations/<timestamp>_initial.json`, `src/migrations/index.ts` (generated)
- Modify: `package.json` (migration scripts)
- Modify: `README.md`

**Interfaces:**
- Consumes: the complete config from Tasks 3 to 17.
- Produces: `npm run migrate:create` and `npm run migrate`; a committed initial migration that builds the full B1 schema on an empty database; a README with the local set-up steps.

- [ ] **Step 1: Add the migration scripts**

Add to `scripts` in `package.json`:

```json
    "migrate": "cross-env NODE_OPTIONS=--no-deprecation payload migrate",
    "migrate:create": "cross-env NODE_OPTIONS=--no-deprecation payload migrate:create",
```

- [ ] **Step 2: Generate the initial migration**

```bash
npm run migrate:create -- initial
```

Expected: three new files in `src/migrations/`: `<timestamp>_initial.ts`, `<timestamp>_initial.json` and `index.ts`. The `.ts` file's `up` function creates every table (search it for `"books"`, `"manuscript_submissions"` and `"page_home"`).

- [ ] **Step 3: Prove it builds an empty database**

```bash
docker compose exec postgres psql -U postgres -c "CREATE DATABASE noisy_streetss_migration_check;"
DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:5432/noisy_streetss_migration_check npm run migrate
DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:5432/noisy_streetss_migration_check npm run payload -- migrate:status
```

(These are Bash commands. In PowerShell, set the variable first: `$env:DATABASE_URI = "postgresql://postgres:postgres@127.0.0.1:5432/noisy_streetss_migration_check"`, run the two npm commands, then `Remove-Item Env:DATABASE_URI`.)

Expected: `migrate` finishes without errors, and `migrate:status` lists the `initial` migration as run. Then remove the scratch database:

```bash
docker compose exec postgres psql -U postgres -c "DROP DATABASE noisy_streetss_migration_check;"
```

The development database keeps using push and needs nothing here.

- [ ] **Step 4: Write the local set-up steps in the README**

Replace `README.md` with:

````markdown
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
````

- [ ] **Step 5: Run every check**

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Expected: all four exit 0. Fix anything that fails before going on. `tsc` also checks the test files, so a type error in a test counts.

- [ ] **Step 6: The manual checks from spec section 9**

Run `npm run seed`, then `npm run dev`. With the Playwright browser tools:

1. **Admin:** log in as `admin@noisystreetss.test`. Every menu group from spec section 7.3 is present and every list has its seeded content.
2. **Editor:** log in as `editor@noisystreetss.test`. Shop settings and Staff accounts are missing from the menu. Opening `/admin/globals/shop-settings` and `/admin/collections/users` directly is refused. The editor's own profile opens from the account menu.
3. **Form through the API:** send the `curl` request from Task 16 Step 10. The entry appears in Inbox, Contact messages, and its alert email arrives in Mailpit with a working link.
4. **Prototype:** repeat Task 1 Step 1 (home, Publishing and Shop, at 1440 x 900 and 390 x 844), saving as `.screenshots/final-*.png`. Compare each with its `before-*` twin from Task 1. They must match.

Look at every screenshot. Write down which pages and widths were checked, for the pull request description.

- [ ] **Step 7: Clean up**

Stop the dev server. Close the Playwright browser. Stop the Docker services (`docker compose stop`, which keeps the data).

- [ ] **Step 8: Commit**

```bash
git add package.json README.md src/migrations
git commit -m "Add the initial database migration and the local set-up steps"
```

---

## B1 is done when

- every automated test passes, and `lint`, `tsc` and `build` exit 0 (Task 18 Step 5)
- the manual checks in Task 18 Step 6 pass, at both widths
- the initial migration is committed
- every collection and global from spec section 6 is visible in the admin with dummy content

## Left for later, on purpose

- **B2, members:** the member login collection must set `access: { admin: () => false }`. Payload checks a login collection's own admin rule before `admin.user`, so leaving it out would let members into the admin. B2 also adds the unpaid-order expiry task to the job queue from Task 9.
- **Frontend phase:** add `images.localPatterns` (for `/api/media/file/**` and the prototype's `/images/**`) when pages start showing Payload images. Read `site-settings` with `overrideAccess: false`, so `formAlertEmail` never reaches a page.
- **Near launch:**
  - Create the client's Supabase project and test one upload through the S3 adapter.
  - Settle the connection pooler mode with a test deploy.
  - Add `CRON_SECRET` to Vercel.
  - Decide how migrations run on deploy (for example a `payload migrate` step before `next build`).
  - Choose the email sending service: Resend, or the client's existing service.
