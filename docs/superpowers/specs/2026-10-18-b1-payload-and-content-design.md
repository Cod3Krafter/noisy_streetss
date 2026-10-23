# B1: Payload and content (design spec)

- **Date:** 18 October 2026
- **Status:** Approved 21 October 2026. Updated the same day with the client's hosting and payment decisions, and with corrections from checking Payload 3.90.2's source
- **Scope source:** the accepted proposal, `refs/NoisyStreetss_Redesign_Breakdown_Updated.pdf`
- **Part of:** the backend build, split into B1 (this spec), B2 (members and shop) and B3 (membership and studio). Each part gets its own spec, plan and build. The frontend comes after the backend.

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
| Member accounts, orders, Paystack payments, Terminal Africa shipping, member discount, unpaid-order expiry. The customer pays the Paystack fee as a checkout line, and the fee is never refunded (client, 21 Oct) | B2 |
| Paystack subscriptions, studio bookings and their approval, Book Club registrations. A studio booking is charged in full when requested and refunded without the fee if rejected (client, 21 Oct) | B3 |
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

**Recheck on the day the build starts.** Payload's release templates show what each release was tested with: `https://raw.githubusercontent.com/payloadcms/payload/v<version>/templates/website/package.json`. The `main` branch runs ahead of releases and is not a guide.

| Package | Version | Reason |
|---|---|---|
| `payload` and every `@payloadcms/*` package | 3.90.2 | 3.91.0 was 3 days old on 18 Oct. Move to 3.91.x once it has a patch and two weeks behind it |
| `next`, `eslint-config-next` | 16.4.1 | Built on 16.3.8, the last patch of the line Payload's templates use. The developer upgraded to 16.4.1 on 22 October 2026, inside Payload's supported range (16.3.3 and later) |
| `react`, `react-dom` | 19.2.9 | The 19.2 line is the one Payload ships with. 19.2.9 came out alongside fixes for 19.0 and 19.1, which usually signals a security fix |
| `@types/react`, `@types/react-dom` | Latest 19.2.x | Matches React |
| `typescript` | 5.9.3 | Last 5.x release. TypeScript 6 and 7 are newer major versions |
| Node.js | 24 LTS (24.22.x) | Current long-term-support line. Pinned in `.nvmrc` and `package.json` `engines` |
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

Folder layout:

```
src/
  app/(frontend)/        current site (moved, otherwise unchanged in B1)
  app/(payload)/         Payload admin and API routes
  payload.config.ts
  collections/           one file per collection
  globals/               page records and settings
  access/                shared access rules (isAdmin, isStaff, publishedOrStaff, ...)
  fields/                shared fields (slug, seo, ...)
  hooks/                 shared hooks (form alert emails, popup overlap check, ...)
  seed/                  dummy content and the seed command
docker-compose.yml       postgres + mailpit
.env.example
```

### 5.3 Local services

`docker-compose.yml` runs:

- **Postgres** on port 5432, with a named volume so data survives restarts.
- Both services only listen on this machine (`127.0.0.1`), never the local network.
- **Mailpit**, receiving mail on port 21025 and showing its inbox at `http://localhost:28025`. Nothing is delivered to real inboxes. (Mailpit's usual ports, 1025 and 8025, fall inside ranges Windows reserves on the development machine.)

`.env.example` lists `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` and `CRON_SECRET`. It also lists the file storage settings (`S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_MEDIA`, `S3_BUCKET_MANUSCRIPTS`), left empty locally. A real `.env` is never committed.

### 5.4 Database changes

- In development, Payload's automatic schema push keeps the local database in step with the code.
- Before B1 is finished, a migration file (a script that applies a database change in order) is generated and committed.
- From then on, every schema change ships as a migration. Production only ever runs migrations, never push.

### 5.5 Files

- **Images (`media`):** stored on local disk in development. In production they go in Supabase Storage through Payload's S3 storage adapter (`@payloadcms/storage-s3`), because Supabase Storage accepts the S3 protocol. The adapter only switches on when the `S3_*` settings are present, so local development needs no Supabase account. The adapter's own fields are always kept in the schema, so the database and its migrations are the same with storage on or off.
- **Manuscripts:** stored in a separate folder outside `public/` in development, and in a private Supabase bucket in production. In both cases files are only served through Payload's access-checked route, so only staff can download them.
- The adapter's compatibility with Supabase Storage is confirmed with a test upload once the client's Supabase project exists.

### 5.6 Email

- Development uses Payload's Nodemailer adapter pointed at Mailpit.
- Production sends through Resend, unless the client's current site already uses a sending service that can be reused (the client is being asked). Nodemailer works with any SMTP service, Resend included, so only the settings change.

### 5.7 Job queue

- Payload's job queue is switched on in B1 because scheduled publishing needs it.
- In development it runs inside the app (`autoRun`).
- In production a Vercel Cron Job calls `/api/payload-jobs/run` every minute, which Vercel Pro allows. The call carries `CRON_SECRET`, and the endpoint rejects any call without it.
- B2 adds the unpaid-order expiry task to the same queue.

### 5.8 Database connection in production

- On Vercel, many requests can run at once, and each can open a database connection. The site therefore connects through Supabase's connection pooler, a service that shares a few database connections between many requests, not straight to the database.
- Migrations run over the direct connection.
- B1 only records both connection strings in `.env.example`. The exact pooler mode Payload needs is checked when production is set up.

## 6. Content model

### 6.1 Shared behaviour

- **Drafts and version history:** books, writers, articles, podcast episodes, submission calls, awards, events, careers, Book Club sessions, merch, studio services and basic pages. Editors can save without publishing and restore earlier versions.
- **Scheduled publishing:** articles only. Article drafts are validated like a publish (`drafts.validate`, decided 23 October 2026), so an article can only be saved once every required field is filled in, and a scheduled publish can't fail on a missing field. Other lists still save incomplete drafts.
- **Web address (slug):** created from the title, editable, and unique within its collection. Applies to every type with its own page. A small slug field of the project's own is used, because Payload's built-in one is marked experimental in 3.90.2.
- **SEO fields** (meta title, meta description, sharing image), from Payload's SEO plugin. Applies to books, writers, articles, podcast episodes, awards, merch, basic pages and every page record.
- **Visibility:** visitors only ever receive published records. Staff can read drafts.
- **Deleting a record still in use** (added 23 October 2026): a delete is refused, with a plain message naming each record or page that still uses it and the field it's in, when the record is still referenced by a relationship or image field in any list (in the published version or the latest draft), by rich text anywhere (placed images, relationship blocks and internal links), or by a page record or setting. In a bulk delete only the records still in use are refused; the rest are deleted. A record's references to itself don't count. Known limit: two records that point at each other and are deleted together in one bulk delete are both refused; deleting them one at a time works once the reference is removed.

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
| Shop settings (`shop-settings`) | pickupAddress (name, phone, line1, city, state, country), flatDeliveryPrices (array: areaName\*, priceNGN\*), memberDiscountPercent (default 20), unpaidOrderExpiryMinutes (default 30), orderAlertEmail | Admins only. B2 reads these |

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
- Every form carries a hidden honeypot field (left empty by people, filled in by spam bots). Entries that fill it in are dropped. Stronger spam protection and rate limits are decided with the frontend forms.

## 7. Staff accounts and access

### 7.1 Logins

- Staff log in through `users` (email, password, `name`\*, `role`\* Admin or Editor, default Editor). Payload loads the logged-in account on every request, so access checks read the role from it directly. (An earlier draft said the role would be read from the login token to save a database lookup. Payload 3.90.2 reloads the account either way, so that option buys nothing.)
- `admin.user` is `users`, so only staff accounts can open `/admin`.
- The member collection arrives in B2 as a separate login collection, and members get no admin access. Payload checks a login collection's own admin rule before it checks `admin.user`, so the member collection must set its admin rule to deny.
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

- **Publishing:** Books, Writers, Submission calls, Awards
- **Editorial:** Articles, Categories, Tags, Podcast shows, Podcast episodes
- **What's on:** Events, Book Club sessions, Careers, Announcements, Book popup campaigns
- **Shop and services:** Merch, Studio services, Membership plans
- **About:** Press mentions, People we've worked with, Basic pages
- **Pages:** every page record
- **Inbox:** the five form-entry collections and Manuscripts
- **Media:** Images
- **Settings:** Site settings, Shop settings, Staff accounts

## 8. Dummy content (seed)

- `npm run seed` wipes the local database and fills it through Payload's Local API, so it can be rerun for a clean start.
- It refuses to run when `NODE_ENV` is `production` or when `DATABASE_URI` points anywhere other than `localhost` or `127.0.0.1`.
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
| Merch, studio services, membership plans | 4, 4, 3 | From the prototype |
| Announcements, popup campaigns | 2, 1 | One announcement expired |
| Press mentions, partners | 4 each | |
| Form entries | 2 per form | One manuscript submission with a sample PDF |
| Page records, basic pages, settings | All | Legal pages read "Placeholder: replace with the client's policy" |
| Staff accounts | `admin@noisystreetss.test`, `editor@noisystreetss.test` | Development passwords only. `.test` addresses can never receive real mail |

## 9. Testing and verification

### Automated (Vitest, against the local Docker database)

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
| Vercel's 4.5 MB request limit | Vercel refuses request bodies over 4.5 MB, so manuscripts up to the 10 MB limit, and large photos, can't be uploaded through the site's own server there. Before launch, uploads go straight to the bucket (the adapter's client uploads, with the bucket allowing uploads from the site's address), and the size check moves to the stored file |
| Page records grow during frontend design | Expected under fixed layouts. Each addition ships as a migration |
| WordPress migration deferred | Collections are designed so migrated articles, categories, tags and images fit later without changes |
| Payload 3.91.x | Upgrade once it meets the version rule, as its own small change |
| Editors can edit Site settings | Assumed so they can update contact details and social links. Admin-only is a one-line change |
| Form field lists in 6.7 | Proposed in this spec and not yet confirmed by the client. Easy to adjust before or after the frontend forms exist |
| Membership plan perks | The client still has to confirm which perks are real (raised 11 Oct). The fields don't depend on the answer |
