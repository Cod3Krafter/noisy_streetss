# B1: Payload and content (design spec)

- **Date:** 18 October 2026
- **Status:** Approved 21 October 2026. Updated the same day with the client's hosting and payment decisions, and with corrections from checking Payload 3.90.2's source
- **Scope source:** the accepted proposal, `refs/NoisyStreetss_Redesign_Breakdown_Updated.pdf`
- **Part of:** the backend build, split into B1 (this spec), B2 (shop) and B3 (members, membership and studio). Members moved from B2 to B3 on 27 October 2026 (B2 spec, `2026-10-27-b2-shop-design.md`). Each part gets its own spec, plan and build. The frontend comes after the backend.

## 1. Purpose

B1 turns the current prototype into a Next.js app with Payload CMS inside it. B1 is done when staff can log in at `/admin` and manage every type of content the new site needs, filled with dummy content, on a local database.

### In scope

- A git repository, the version upgrades, and a Payload install inside the existing Next.js app
- A local Postgres database and a local mail catcher, both running in Docker
- Staff accounts with two roles (Admin and Editor) and the access rules for everything in B1
- Every content type, page record and settings record listed in section 6
- The five website forms, stored as admin lists, each sending a staff alert email
- A seed command that fills the local database with dummy content
- Scheduled publishing for articles, which needs Payload's job queue switched on

### Out of scope

| Item | Where it goes |
|---|---|
| Orders (guest checkout), Paystack payments, Terminal Africa shipping, unpaid-order expiry. The customer pays the Paystack fee, and the fee is never refunded (client, 21 Oct) | B2 |
| Member accounts and the member discount (moved from B2 on 27 Oct), Paystack subscriptions, studio bookings and their approval, Book Club registrations. A studio booking is charged in full when requested and refunded without the fee if rejected (client, 21 Oct) | B3 |
| All public pages and their layouts | Frontend phase, after the backend |
| WordPress content migration | Deferred. Still owed under the proposal. The live site is not used as a source until the developer says so |
| Setting up the production accounts and services | Near launch. Hosting is chosen (section 3), and B1 makes the code ready for it (sections 5.5 to 5.8) |

## 2. Starting point

- Next.js 16.2.4 and React 19.2.4. The whole site is one URL that swaps "views" in client state (`src/context/ViewContext.tsx`, `src/views/`).
- All content is hardcoded placeholder data in `src/data/`. The photos are in `public/images/unsplash/`.
- No backend, no database, no git repository. npm is the package manager (`package-lock.json`).

## 3. Decisions this spec builds on

| Decision | Made |
|---|---|
| Payload CMS for content, database, logins and admin screens | 12 Oct 2026 |
| Fixed page layouts in code. Editors change text, images and featured items, not page structure. No page builder | 18 Oct 2026 |
| Staff and members are separate login collections. Only staff can reach `/admin` | 18 Oct 2026 |
| Most recent stable, compatible versions, with stability first | 18 Oct 2026 |
| Dummy content for now. The live site is not referenced | 18 Oct 2026 |
| Backend before frontend | 18 Oct 2026 |
| Site map and web addresses as listed in the site map decisions (for example `/books/[book]`, `/blog/[article]`, a single `/careers` page) | 18 Oct 2026 |
| Hosting: Vercel Pro for the site, Supabase Pro for the database and file storage (the client's choice) | 21 Oct 2026 |

## 4. Versions

**Rule:** use the set of versions that Payload's latest release was built and tested with, each on the newest patch of its line. Skip anything less than about two weeks old unless it is a security fix. Pin exact versions (no `^` or `~`) and upgrade deliberately, one change at a time.

Since 27 October 2026 the pin rule holds for every package in `package.json`, dependencies and dev dependencies alike, with no `^` or `~` anywhere.

**Recheck on the day the build starts.** Payload's release templates show what each release was tested with: `https://raw.githubusercontent.com/payloadcms/payload/v<version>/templates/website/package.json`. The `main` branch runs ahead of releases and is not a guide.

| Package | Version | Reason |
|---|---|---|
| `payload` and every `@payloadcms/*` package | 3.90.2 | 3.91.0 was 3 days old on 18 Oct. Move to 3.91.x once it has a patch and two weeks behind it |
| `next`, `eslint-config-next` | 16.4.1 | Built on 16.3.8, the last patch of the line Payload's templates use. The developer upgraded to 16.4.1 on 22 October 2026, inside Payload's supported range (16.3.3 and later) |
| `react`, `react-dom` | 19.2.9 | The 19.2 line is the one Payload ships with. 19.2.9 came out alongside fixes for 19.0 and 19.1, which usually signals a security fix |
| `@types/react`, `@types/react-dom` | Latest 19.2.x | Matches React |
| `typescript` | 5.9.3 | Last 5.x release. TypeScript 6 and 7 are newer major versions |
| Node.js | 24 LTS (24.22.x) | Current long-term-support line. `.nvmrc` holds `24` and `package.json` `engines` says `24.x`. `.npmrc` sets `engine-strict=true`, so `npm install` refuses to run on another Node version. This project's VS Code terminals switch to Node 24 through fnm (`.vscode/settings.json`); in any other terminal, run `fnm use` first |
| Postgres (Docker image) | `postgres:17.11` | Match the major version Supabase gives new projects. Check it on the day the build starts |
| Mailpit (Docker image) | `axllent/mailpit:v1.31.6` | Current stable release |
| `sharp` | 0.35.5 | Image resizing. Upgraded with Next.js on 22 October 2026 (Payload's templates pin 0.35.4) |

## 5. Setup

### 5.1 Repository and upgrades

1. Run `git init`. Keep the existing `.gitignore`, and add `.env`, `media/`, `manuscripts/` and Docker volume folders.
2. Upgrade Next.js, React, their types and TypeScript to the versions in section 4. Before writing code, read the relevant guides in `node_modules/next/dist/docs/` as `AGENTS.md` requires.
3. Confirm that the prototype still builds and renders before Payload goes in. Check the home page and two other views at desktop and phone widths.

### 5.2 Payload inside the Next.js app

- Install Payload with the Postgres adapter, the Lexical rich-text editor, the SEO plugin, the Nodemailer email adapter and `sharp`.
- Follow Payload's guide for adding it to an existing Next.js app:
  - The current site moves into a `src/app/(frontend)/` route group with its own root layout.
  - Payload's admin and API routes live in `src/app/(payload)/`.
  - `next.config.ts` is wrapped with `withPayload`.
- The admin lives at `/admin`, and the REST API at `/api`.
- `src/app/(payload)/custom.scss` overrides a few of Payload's admin styles so the admin works on phones (added 23 October 2026): field error messages show in full at every width and sit above the input at 1024 px and below (Payload hides them there), images placed in rich text fit the column at 768 px and below, and the Status / Last Modified / Created row wraps instead of being cut off. Text boxes only resize vertically.
- Expected refusals (a delete refused because the record is still in use, the last admin kept, a spam entry refused, a file over the size limit) are thrown as the project's `Refusal` error, which Payload logs as a one-line note (`info`) instead of an error with a stack trace (added 23 October 2026). Every other error keeps Payload's own logging.

Folder layout:

```
src/
  app/(frontend)/        current site (moved, otherwise unchanged in B1)
  app/(payload)/         Payload admin and API routes
  payload.config.ts
  collections/           one file per collection
  globals/               page records and settings
  access/                shared access rules (isAdmin, isStaff, publishedOrStaff, ...), the job endpoint's
                         secret check, and the staff-only lock on Payload's internal lists
  fields/                shared fields (slug, rich text)
  hooks/                 shared hooks (form alert emails, honeypot, delete guard, file size limit)
  rules/                 plain functions with no database: dates, validators, production settings checks, ...
  jobs/                  the scheduled publish failure alert
  lib/                   small shared helpers
  migrations/            the committed database migrations
  seed/                  dummy content, the seed command and its safety guard
  storage.ts             the S3 storage plugins (one per bucket)
  email.ts               the Nodemailer adapter and its connection options
  refusal.ts             the Refusal error for expected refusals
  seo.ts                 the SEO plugin settings
tests/
  unit/                  tests that need no database
  int/                   integration tests against the test database
  helpers/               test helpers (createStaff and others)
  env.ts, globalSetup.ts, setup.ts   test environment and database reset
docker/postgres-init/    creates the test database the first time the Postgres volume is built
docker-compose.yml       postgres + mailpit
vercel.json              the cron call for the job queue
.env.example
```

### 5.3 Local services

`docker-compose.yml` runs:

- **Postgres** on port 5432, with a named volume so data survives restarts.
- Both services only listen on this machine (`127.0.0.1`), never the local network.
- **Mailpit**, receiving mail on port 21025 and showing its inbox at `http://localhost:28025`. Nothing is delivered to real inboxes. (Mailpit's usual ports, 1025 and 8025, fall inside ranges Windows reserves on the development machine.)
- A second database, `noisy_streetss_test`, created by `docker/postgres-init/01-test-database.sql` the first time the Postgres volume is built. The automated tests use it, so they never touch development content. (On a volume that already exists the script does not run again; create the database by hand or recreate the volume.)

The settings the code reads (a search for `process.env.` in `src/`, `tests/` and the config files), by name:

| Setting | Used for |
|---|---|
| `DATABASE_URI` | The database the app connects to (in production, the pooler address) |
| `PAYLOAD_SECRET` | Signs login tokens. At least 32 characters in production |
| `NEXT_PUBLIC_SERVER_URL` | The site's own address: Payload's `serverURL`, the only origin allowed to log in, and the links in alert emails. In production exactly `https://host` |
| `CRON_SECRET` | The key Vercel Cron sends to `/api/payload-jobs/run`. At least 16 characters, or the endpoint refuses every call |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Email sending. Without `SMTP_HOST`, Payload only logs emails (as in the tests). `SMTP_PORT` defaults to 587 |
| `S3_BUCKET_MEDIA`, `S3_BUCKET_MANUSCRIPTS` | Each switches its own bucket on (5.5) |
| `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | The bucket connection, required as soon as either bucket is named |
| `MEDIA_DIR`, `MANUSCRIPTS_DIR` | Optional: the local folders for uploads. They default to `media/` and `manuscripts/` in the project. The tests point them at `.test-uploads/` |
| `TEST_DATABASE_URI` | The test database. Required by the tests, and its name must end in `_test`. The tests copy it into `DATABASE_URI` |
| `NODE_ENV` | Set by Next.js. Switches on the production checks, secure login cookies, required TLS (Transport Layer Security, encrypted mail) and the start-up checks |
| `VITEST` | Set by Vitest. Turns off the background job runner (5.7) |

The README and the plan also name `DIRECT_DATABASE_URI`, the direct database connection used for migrations. No code reads it: it is a name for the address, and for migrations it is passed inline as `DATABASE_URI` (5.4). `.env.example` is the template for `.env`. A real `.env` is never committed.

### 5.4 Database changes

- In development, Payload's automatic schema push keeps the local database in step with the code, but only when the database is a local one (`isLocalDatabase` in `src/seed/guard.ts`: host `localhost` or `127.0.0.1`, no host override in the address, database `noisy_streetss` or ending `_test`). Against any other database the push is off and a warning is logged at start-up. This stops a stray `npm run dev` from reshaping a live database and from recording a "dev" row that makes `payload migrate` refuse to run later (updated 26 October 2026).
- The first migration, `20261022_233859_initial`, is generated and committed in `src/migrations/`. On 27 October 2026, `npm run migrate` applied it cleanly to a fresh local database, and the resulting schema matched the one the code builds, apart from the column order in one of Payload's internal tables (harmless).
- From then on, every schema change ships as a migration. Production only ever runs migrations, never push, and they are run by hand (section 11).

### 5.5 Files

- **Images (`media`):** stored on local disk in development. In production they go in Supabase Storage through Payload's S3 storage adapter (`@payloadcms/storage-s3`), because Supabase Storage accepts the S3 protocol. Each bucket switches on from its own name: `S3_BUCKET_MEDIA` for images and `S3_BUCKET_MANUSCRIPTS` for manuscripts, so either can be on without the other. Once either is named, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` are required, and the production start-up check logs any that are missing. Local development needs no Supabase account. The adapter's own fields are always kept in the schema, so the database and its migrations are the same with storage on or off.
- **Manuscripts:** stored in a separate folder outside `public/` in development, and in a private Supabase bucket in production. In both cases files are only served through Payload's access-checked route, so only staff can download them.
- The adapter's compatibility with Supabase Storage is confirmed with a test upload once the client's Supabase project exists.

### 5.6 Email

- Development uses Payload's Nodemailer adapter pointed at Mailpit.
- Production sends through Resend, unless the client's current site already uses a sending service that can be reused (the client is being asked). Nodemailer works with any SMTP service, Resend included, so only the settings change.

### 5.7 Job queue

- Payload's job queue is switched on in B1 because scheduled publishing needs it.
- In development it runs inside the app (`autoRun`, every minute). Under the tests nothing runs in the background: Vitest sets `VITEST`, which turns `autoRun` off, and a test that needs a job calls `payload.jobs.run()` itself.
- In production a Vercel Cron Job calls `/api/payload-jobs/run` every minute, which Vercel Pro allows. The call carries `CRON_SECRET`, and the endpoint rejects any call without it.
- A scheduled publish that fails emails the form alert address (6.1), and a staff account with scheduled publishes waiting can't be deleted.
- B2 adds the unpaid-order expiry task to the same queue.

### 5.8 Database connection in production

- On Vercel, many requests can run at once, and each can open a database connection. The site therefore connects through Supabase's connection pooler, a service that shares a few database connections between many requests, not straight to the database.
- Migrations run over the direct connection or the session pooler, not the transaction pooler.
- The site connects through the pooler; migrations take the connection string inline (see 5.4). The exact pooler mode Payload needs is checked when production is set up.

## 6. Content model

### 6.1 Shared behaviour

- **Drafts and version history:** books, writers, articles, podcast episodes, submission calls, awards, events, careers, Book Club sessions, merch, studio services and basic pages. Editors can save without publishing and restore earlier versions.
- **Scheduled publishing:** articles only. Article drafts are validated like a publish (`drafts.validate`, decided 23 October 2026), so an article can only be saved once every required field is filled in, and a scheduled publish can't fail on a missing field. Deleting a staff account that still has scheduled publishes waiting is refused, naming the articles, so the job never loses the account it runs as. Any scheduled publish that still fails (for example its web address was taken in the meantime) emails the form alert address, naming the article, linking to it and giving the reason; the failure is still recorded in the jobs list. Other lists still save incomplete drafts.
- **Web address (slug):** created from the title, editable, and unique within its collection. Applies to every type with its own page, and also to categories, tags, podcast shows, submission calls and studio services, which the site map gives no page of their own: their addresses are for filters and links (for example a category filter on the blog, or a link to one call). A small slug field of the project's own is used, because Payload's built-in one is marked experimental in 3.90.2.
- **SEO fields** (meta title, meta description, sharing image), from Payload's SEO plugin. Applies to books, writers, articles, podcast episodes, awards, merch, basic pages and every page record.
- **Visibility:** visitors only ever receive published records. Staff can read drafts.
- **Deleting a record still in use** (added 23 October 2026): a delete is refused, with a plain message naming each record or page that still uses it and the field it's in, when the record is still referenced by a relationship or image field in any list (in the published version or the latest draft), by rich text anywhere (placed images, relationship blocks and internal links), or by a page record or setting. In a bulk delete only the records still in use are refused; the rest are deleted. A record's references to itself don't count. Known limit: references between records deleted together in one bulk delete still count. If one article links to another and both are selected, the linked one is refused (its message names the article that was just deleted) and deleting it again works. Two records that point at each other are both refused; delete one at a time once one of the references is removed.

### 6.2 Editorial collections

`*` marks a required field.

| Collection (slug) | Fields | Rules |
|---|---|---|
| Books (`books`) | title\*, slug\*, cover\* (media), writers\* (writers, many), category\* (Fiction, Poetry, Anthology, Non-fiction), summary\* (one line), synopsis (rich text), publishDate, pageCount, isbn, formats (array: formatName\*, priceNGN\* whole naira, inStock switch, weightGrams\*), sellInShop switch, newRelease switch, editorsChoice switch | At least one format is required when `sellInShop` is on |
| Writers (`writers`) | name\*, slug\*, photo (media), shortBio\* (1 to 2 sentences), bio (rich text), links (array: label\*, url\*), showOnWritersPage switch (default on) | Their books and articles show automatically through join fields |
| Articles (`articles`) | title\*, slug\*, cover (media), summary\*, body\* (rich text with images, quotes and video embeds), writers\* (writers, many), categories\* (categories, many), tags (tags, many), featured switch, publishDate\* | Scheduled publishing |
| Categories (`categories`) | name\*, slug\*, description | |
| Tags (`tags`) | name\*, slug\* | |
| Podcast shows (`podcast-shows`) | name\*, slug\*, description, cover (media), spotifyUrl, youtubeUrl, appleUrl | |
| Podcast episodes (`podcast-episodes`) | title\*, slug\*, show\* (podcast-shows), episodeNumber, date\*, summary\*, showNotes (rich text), spotifyUrl, youtubeUrl, cover (media), guests (writers, many), lengthMinutes | At least one of the Spotify or YouTube links is required |
| Submission calls (`submission-calls`) | title\*, slug\*, themeSummary\*, guidelines\* (rich text), opensAt\*, closesAt\*, cover (media) | Status (upcoming, open, closed) is worked out from the dates when read, never stored. `closesAt` must be after `opensAt` |
| Awards (`awards`) | name\*, slug\*, summary\*, rules (rich text), prize, keyDates (array: label\*, date\*), status\* (Open, Judging, Winners announced, Closed), pastWinners (array: year\*, name\*, work, url), howToEnter (rich text), entryUrl, cover (media) | |
| Events (`events`) | title\*, startsAt\*, endsAt, venue, address, onlineUrl, description (rich text), image (media), actionUrl, actionLabel | Counts as upcoming while `endsAt`, or `startsAt` if there's no end, is in the future |
| Careers (`careers`) | role\*, type\* (Full-time, Part-time, Contract, Internship, NYSC), location, description\* (rich text), howToApply\*, closingDate, open switch | Shown only when `open` is on and the closing date hasn't passed |
| Book Club sessions (`book-club-sessions`) | book (books) or title (at least one required), startsAt\*, venue, onlineUrl, description, registrationOpen switch | Registrations themselves come in B3 |
| Merch (`merch`) | title\*, slug\*, images\* (media, many), description, priceNGN\*, inStock switch, weightGrams\*, type\* (Stationery, Apparel, Other) | No sizes or colours |
| Studio services (`studio-services`) | name\*, slug\*, description\*, hourlyRateNGN, halfDayRateNGN, fullDayRateNGN, inclusions (array of text), images (media, many), bookable switch, sortOrder | At least one rate is required. Booking rules come in B3 |
| Membership plans (`membership-plans`) | name\*, priceNGN\*, billing\* (Monthly, Yearly), perks (array of text), active switch, sortOrder | The Paystack plan code is added in B3, visible to admins only |

**Basic pages** (`pages`) have title\*, slug\*, body\* (rich text), drafts and SEO fields. They hold the legal pages (privacy, terms, shop terms, cookies) and Values.

### 6.3 Lists without drafts

These go live when saved.

| Collection (slug) | Fields | Rules |
|---|---|---|
| Announcements (`announcements`) | text\*, url, buttonLabel, startsAt\*, endsAt | Active while the current time is inside its dates. The home page shows up to 3 active ones, newest first |
| Book popup campaigns (`popup-campaigns`) | book\* (books), headline\*, pitch, buttonLabel, startsAt\*, endsAt\*, enabled switch | Saving fails if another enabled campaign overlaps its dates |
| Press mentions (`press-mentions`) | outlet\*, headline\*, url\*, date, logo (media), quote | |
| People we've worked with (`partners`) | name\*, logo (media), quote, quoteBy, quoteByTitle, url, sortOrder | |

### 6.4 Page records (Payload globals)

There is one record per designed page:

- Home
- Publishing
- Writers
- Submissions (holds the general submission guidelines)
- Awards
- Advisory
- Distribution
- Studio
- Blog
- Podcast
- Shop
- Book Club
- Membership
- Events
- Careers
- Who We Are
- Press
- Contact
- Partner
- Support

In B1 each record has `heading`\*, `intro` (rich text), an optional `heroImage`, and SEO fields. Each page's remaining fields are added when its layout is designed in the frontend phase. Under the fixed-layout approach, that is expected growth and not a change of plan.

### 6.5 Settings (globals)

| Global | Fields | Who can edit |
|---|---|---|
| Site settings (`site-settings`) | contactEmail\*, phone, address, socialLinks (array: platform\*, url\*), footerText, newsletterText, defaultShareImage (media), formAlertEmail\* | Admins and editors |
| Shop settings (`shop-settings`) | pickupAddress (name, phone, line1, city, state, country), flatDeliveryPrices (array: areaName\*, priceNGN\*), memberDiscountPercent (default 20), unpaidOrderExpiryMinutes (default 30), orderAlertEmail | Admins only. B2 reads these, matches flat prices by state and adds a parcel box (B2 spec 5.3) |

### 6.6 Files

| Collection (slug) | Fields | Rules |
|---|---|---|
| Images (`media`) | file\*, alt\*, caption, credit | Payload generates three sizes: thumbnail (400px), card (800px) and large (1600px). Focal point enabled |
| Manuscripts (`manuscripts`) | file\* | PDF or Word (`.docx`) only, maximum 10 MB (checked in a hook, because Payload has no per-collection size limit). Readable by staff only. Not in the public folder |

### 6.7 Form entries

Each website form is its own admin collection. Payload's form-builder plugin isn't used, because it can't accept file uploads and fixed layouts don't need editor-built forms.

Every entry also has `status` (New, In progress, Done; default New) and `staffNotes`. Neither is shown to the public.

| Collection (slug) | Fields |
|---|---|
| Contact messages (`contact-messages`) | name\*, email\*, subject, message\* |
| Partnership enquiries (`partnership-enquiries`) | name\*, organisation\*, email\*, phone, partnershipType\* (Sponsorship, Advertising, Media, Events, Other), message\* |
| Bookstore applications (`bookstore-applications`) | storeName\*, contactName\*, email\*, phone\*, address\* (line1, city, state), websiteOrSocial, storeType\* (Independent bookstore, Chain, Online, Library, Other), message |
| Advisory enquiries (`advisory-enquiries`) | name\*, organisation, email\*, phone, needs\* |
| Manuscript submissions (`manuscript-submissions`) | call\* (submission-calls), name\*, email\*, phone, workTitle\*, wordCount, shortBio\*, coverNote, file\* (manuscripts) |

Rules:

- Visitors may create entries but never read, change or delete them.
- A manuscript submission is rejected unless its call is open at the moment of submitting.
- Manuscript submissions are created by the site's own server code, which stores the file and the submission together. Visitors never post to that list directly, and one file can only belong to one submission. (Added 22 October 2026, after review: a direct post could otherwise point at another visitor's file.)
- Each new entry sends an alert email to the site's `formAlertEmail`. The email names the form and links to the entry in the admin.
- Every form carries a hidden honeypot field (left empty by people, filled in by spam bots). A bot that fills it in gets the normal success response, but nothing is saved and no alert is sent (changed 23 October 2026; it used to get a 400 error, which tells a bot to try again). The four public forms do this through their own `POST /api/<form>` endpoint. Server code that saves entries directly, such as the manuscript form (built with the frontend forms, moved from B2 on 27 October 2026), must check the field itself with `isSpam` and answer the same way; the collection still refuses to store such an entry as a backstop. Stronger spam protection and rate limits are decided with the frontend forms.

## 7. Staff accounts and access

### 7.1 Logins

- Staff log in through `users` (email, password, `name`\*, `role`\* Admin or Editor, default Editor). Payload loads the logged-in account on every request, so access checks read the role from it directly. (An earlier draft said the role would be read from the login token to save a database lookup. Payload 3.90.2 reloads the account either way, so that option buys nothing.)
- `admin.user` is `users`, so only staff accounts can open `/admin`.
- The member collection arrives in B3 (moved from B2 on 27 October 2026) as a separate login collection, and members get no admin access. Payload checks a login collection's own admin rule before it checks `admin.user`, so the member collection must set its admin rule to deny.
- Payload's own edit locks (the hidden `payload-locked-documents` list, and the `payload-jobs-stats` record) are staff-only (added 26 October 2026). Payload gives them open access for any logged-in account and offers no option to change it, so the rule is set on the finished config after `buildConfig` (`withStaffOnlyInternals`). Without it, a member account (B3) could list what staff are editing or forge a lock. The admin's own locking only ever runs as staff, so it is unaffected.
- The first admin account in development comes from the seed. In production, Payload's first-user screen creates it.

### 7.2 Who can do what in B1

| | Admin | Editor | Visitor |
|---|---|---|---|
| Editorial collections, lists, basic pages, page records | Full | Full | Read published only |
| Images | Full | Full | Read |
| Manuscripts | Full | Read | None |
| Form entries | Full | Full (no delete) | Create only |
| Site settings | Full | Edit | Read everything except `formAlertEmail` |
| Shop settings | Full | None | None |
| Staff accounts | Full | Own profile only | None |

Editors don't see Shop settings or Staff accounts in the admin menu.

### 7.3 Admin menu groups

The groups are listed in the order the admin menu shows them. Payload orders groups by their first list, in the order of the `collections` list in `src/payload.config.ts`, and always puts a group that only holds page records or settings after those, so Pages comes last. Within a group, lists follow the same order.

- **Publishing:** Books, Writers, Submission calls, Awards
- **Editorial:** Articles, Categories, Tags, Podcast shows, Podcast episodes
- **What's on:** Events, Book Club sessions, Careers, Announcements, Book popup campaigns
- **Shop and services:** Merch, Studio services, Membership plans
- **About:** Press mentions, People we've worked with, Basic pages
- **Inbox:** Manuscripts first (a manuscript submission's file points at it), then the five form-entry collections
- **Media:** Images
- **Settings:** Staff accounts, then Site settings and Shop settings (an editor has no Staff accounts list, so for an editor Settings holds only settings and comes after Pages)
- **Pages:** every page record

## 8. Dummy content (seed)

- `npm run seed` wipes the local database and fills it through Payload's Local API, so it can be rerun for a clean start.
- It refuses to run (`assertSafeToSeed` in `src/seed/guard.ts`) unless all of these hold: `NODE_ENV` is not `production`; the host in `DATABASE_URI` is `localhost` or `127.0.0.1`; the address has no `host` or `hostaddr` override in its query; the database is named `noisy_streetss` or ends in `_test`; and neither `S3_BUCKET_MEDIA` nor `S3_BUCKET_MANUSCRIPTS` is set (the seed only works with local file storage). The check runs at the start of the command and again inside `wipe()`, so no other caller can empty a database without passing it.
- Reseeding fully resets the page records and settings: each is first emptied field by field from the config, then filled, so a field added later never keeps an old value.
- The seed only empties the project's own `media/` and `manuscripts/` folders, or folders inside `.test-uploads/`.
- It starts from the prototype's `src/data/` and the photos in `public/images/unsplash/`, then fills the gaps.

| Content | Records | Cases included on purpose |
|---|---|---|
| Books | 6 | One with paperback and hardback, one format sold out, one not for sale, new releases, editor's choice |
| Writers | 8 | One hidden from Our Writers |
| Articles | 12 across 4 categories | One draft, one scheduled for a week ahead, 3 featured |
| Podcast | 2 shows, 6 episodes | Spotify-only and YouTube-only episodes |
| Submission calls | 3 | One open, one upcoming, one closed |
| Awards | 2 | One open, one with past winners |
| Events | 3 | Two upcoming, one past |
| Careers | 2 | One open, one past its closing date |
| Book Club sessions | 2 | Registration open on one only |
| Merch, studio services, membership plans | 5, 4, 3 | From the prototype. The merch includes one T-shirt with sizes, one size sold out (B2) |
| Announcements, popup campaigns | 2, 1 | One announcement expired |
| Press mentions, partners | 4 each | |
| Form entries | 2 per form | The two manuscript submissions each have their own sample PDF, and belong to the open call |
| Page records, basic pages, settings | All | Legal pages read "Placeholder: replace with the client's policy" |
| Staff accounts | `admin@noisystreetss.test`, `editor@noisystreetss.test`, `shop@noisystreetss.test` | Development passwords only. `.test` addresses can never receive real mail |
| Orders (B2) | 3 | One Paid, one Delivered, one Expired |

## 9. Testing and verification

### Automated (Vitest)

Vitest runs two projects (`vitest.config.mts`). **Unit tests** (`tests/unit/`) need no database or Docker. **Integration tests** (`tests/int/`) run against the separate `noisy_streetss_test` database in Docker, which is emptied once before they start. The files run one at a time and share that database, so two test runs must never overlap.

| Command | Runs |
|---|---|
| `npm run test:unit` | Unit tests only. No Docker needed |
| `npm run test:int` | Integration tests only (resets the test database first) |
| `npm test` | Both projects (resets the test database first) |
| `npm run test:shuffle` | Integration tests with the files in random order, to catch tests that depend on another file having run first |

At the end of B1 (27 October 2026) the suite has 310 tests in 39 files, 125 of them unit tests in 18 files, all passing.

- **Access:** a visitor can't read drafts, manuscripts or form entries, and can create a contact message. An editor can't read Shop settings or other staff accounts. An admin can do everything.
- **Rules:**
  - submission call status from its dates
  - upcoming events
  - careers visibility
  - active announcements
  - the popup overlap check
  - books requiring a format when sold
  - manuscript submissions to a closed call being rejected
  - slugs created and kept unique
- **Seed:** runs twice in a row without errors and produces the counts in section 8.

### Commands

`npm run lint`, `tsc --noEmit` and `npm run build` all pass.

### Manual checks

- Log in as the seeded admin and editor. Each sees the right menu groups, and the editor can't reach the admin-only screens.
- Create a contact message through the API. It appears in the Inbox, and its alert email arrives in Mailpit.
- After the upgrade and the move into `(frontend)`, the prototype still renders as before. Check it at desktop and phone widths and look at it, not just numbers.

### B1 is done when

- every check above passes,
- the migration file is committed,
- all of section 6 is visible in the admin with dummy content.

## 10. Open items and risks

| Item | Effect on B1 |
|---|---|
| Email sending service | Resend, unless the client's current site uses a service that can be reused. Only settings change, so B1 is unaffected |
| Supabase Storage with Payload's S3 adapter | Confirmed with a test upload once the client's Supabase project exists. Local development doesn't depend on it |
| Vercel's 4.5 MB request limit | Moved to section 11 (Set up), because it is work to do before launch rather than an open question |
| Rate limits on the public forms | Not yet decided. See section 11 (Decide) |
| Page records grow during frontend design | Expected under fixed layouts. Each addition ships as a migration |
| WordPress migration deferred | Collections are designed so migrated articles, categories, tags and images fit later without changes |
| Payload 3.91.x | Upgrade once it meets the version rule, as its own small change |
| Editors can edit Site settings | Assumed so they can update contact details and social links. Admin-only is a one-line change |
| Form field lists in 6.7 | Proposed in this spec and not yet confirmed by the client. Easy to adjust before or after the frontend forms exist |
| Membership plan perks | The client still has to confirm which perks are real (raised 11 Oct). The fields don't depend on the answer |

## 11. Production hardening

Everything to do or decide before and just after the first production deploy. Tick each item off as it is done. Nothing here changes the B1 code unless it says so.

### Decide

- [ ] **Rate limits on the public forms.** `POST /api/contact-messages`, `/api/partnership-enquiries`, `/api/bookstore-applications` and `/api/advisory-enquiries` are live from the first deploy, whether or not any page shows the form. Each real entry sends an alert email, and the sending quota (Resend's free tier, about 100 a day) is shared with password resets and B2's order emails. Anyone can post to these addresses, so a script could use up the quota and block password resets. Options: a per-IP limit (a cap on requests from one address), a daily cap on alert emails, both before the first deploy; or deploy with public create switched off (`create: nobody`) until the frontend forms exist. B2's public shop endpoints (`/api/shop/quotes`, `/api/shop/checkout` and `/api/shop/orders/:reference`) join this decision: each checkout calls Paystack and each quote calls Terminal. **Not yet decided** (developer, 26 October 2026).

### Set up

- [ ] **Uploads over 4.5 MB.** Vercel refuses request bodies over 4.5 MB, so manuscripts (up to 10 MB) and large photos can't be uploaded through the site's own server there. Use uploads straight to the bucket (the S3 adapter's client uploads, with the bucket's CORS (cross-origin) rules allowing the site's address), move the size check to the stored file, and show upload progress to staff and visitors.
- [ ] **Migrations are run by hand.** Nothing runs them on deploy. Run `npm run migrate` with the live address passed inline for that one command, never put in `.env` (see 5.4 and the README), over Supabase's direct connection, or the session pooler, never the transaction pooler, and check that SSL (encrypted database connections) works at the test deploy. Before the first run, prove the migrations build an empty database: done locally on 27 October 2026 for `20261022_233859_initial`; redo it after any new migration (done again on 28 October 2026 for `20261028_100928_b2_shop`).
- [ ] **Database connection pool.** On Vercel, set `max`, `idleTimeoutMillis` and `connectionTimeoutMillis` on the adapter's pool. node-postgres defaults to 10 connections and waits forever for one. Also consider `attachDatabasePool` from `@vercel/functions` on Fluid compute (Vercel's reuse of function instances).
- [ ] **Region.** The Vercel function region must match the Supabase region, because the delete guard makes several database reads in a row and each pays the distance.
- [ ] **Settings in Vercel.** `CRON_SECRET` of at least 16 characters and `PAYLOAD_SECRET` of at least 32. `NEXT_PUBLIC_SERVER_URL` exactly `https://host` in lowercase, with no path, trailing slash or `:443`. Production start-up logs any of these that is missing or unusable: `PAYLOAD_SECRET`, `SMTP_HOST`, `SMTP_FROM`, `NEXT_PUBLIC_SERVER_URL`, `CRON_SECRET`, both bucket names, and (with a bucket named) the four `S3_*` connection settings. B2 adds `PAYSTACK_SECRET_KEY` (also reported when it is a test key, `sk_test_`), `TERMINAL_SECRET_KEY`, `TERMINAL_BASE_URL` (also reported when it is Terminal's sandbox address) and `QUOTE_STAMP_SECRET` (at least 32 characters). Crons only run on production deployments.
- [ ] **Preview deployments.** Admin login is refused on Vercel preview URLs, because the site address is the only allowed origin. Test the admin on production or a staging domain set as that address.
- [ ] **Buckets.** The manuscripts bucket must be private; check that a direct bucket URL is refused. Consider a random per-file key prefix so file names can't be guessed. Consider a public media bucket so images don't each cost a function call.
- [ ] **Backups.** Supabase's database backups don't include Storage files. Decide how images and manuscripts are backed up.
- [ ] **Shop (B2), before launch.**
  - [ ] Turn on "Pass fees to customers" in Paystack's live mode, if P1 confirmed it.
  - [ ] Set the live Paystack webhook address in Paystack's dashboard.
  - [ ] Register the live Terminal webhook with the script.
  - [ ] Fund the Terminal wallet.
  - [ ] In Shop settings: the pickup address with its postcode, the flat delivery prices, the parcel box, and `orderAlertEmail`.
  - [ ] Real weights on every book format and merch item.
  - [ ] Rate limits: the shop's public endpoints (`/api/shop/quotes`, `/api/shop/checkout`, `/api/shop/orders/:reference`) join the open rate-limit decision. Each checkout calls Paystack and each quote calls Terminal.
  - [ ] One real order for a small amount after the first deploy, booked and then refunded.
  - [ ] Size Supabase's pooler with the row locks in mind: each request waiting on a lock holds a pooled connection, and checkout also holds one connection while Paystack starts the payment (up to 10 seconds).
  - [ ] Review Shop settings after the B2 migration: the everywhere-else price (filled from the highest flat price, or ₦5,000), any area with no states, and the pickup state (empty if the old text could not be matched).
  - [ ] Frontend: product pages refresh when stock or prices change (no revalidate hooks exist yet).
  - [ ] `webhook_events` gains one row per applied Terminal event and nothing prunes it. Decide a retention.
  - [ ] Add a staff alert or a check for jobs that finally fail. An expiry or email job that gives up shows only in Payload's logs.
- [ ] **Dependency audit.** Run `npm audit --omit=dev`. At the end of B1 it reported 35 findings, all transitive (pulled in by Payload), none directly in this project's own dependencies.
- [ ] **GitHub canary workflow.** GitHub disabled it for inactivity. Re-enable it: `gh workflow enable canary --repo Cod3Krafter/noisy_streetss`.

### Check after the first deploy

- [ ] Create the first admin straight away, through Payload's first-user screen, so nobody else can.
- [ ] Fill in Site settings, including the form alert address. Without it, no alert emails go out.
- [ ] Vercel's cron log shows 200s for `/api/payload-jobs/run`.
- [ ] Schedule a test article a few minutes ahead and watch it publish.

### Later

- [ ] Measure delete times on Vercel after the WordPress import, since the delete guard reads several lists.
