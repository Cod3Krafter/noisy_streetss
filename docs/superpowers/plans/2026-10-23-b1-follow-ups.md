# B1 Follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the four decisions left open at the end of B1: admin styles that work on phones, a guard against deleting records still in use, article drafts that can't break a scheduled publish, and a honeypot that answers bots with a normal success.

**Architecture:** Each task is a small change to the existing Payload 3 setup. Task 2 overrides Payload's admin styles in `src/app/(payload)/custom.scss` (unlayered rules beat Payload's `@layer payload-default`). Task 3 adds a `beforeDelete` hook to every collection, backed by a module that finds every place a record is referenced (relationship and upload fields by database query, rich text and globals by reading them once per request). Task 4 switches on `versions.drafts.validate` for articles. Task 5 gives each public form its own `POST /` endpoint that fakes success for a filled-in honeypot and otherwise creates the entry through the Local API.

**Tech Stack:** Payload 3.90.2 (Postgres adapter, Lexical rich text), Next.js 16.4.1, React 19.2.9, Vitest 4.0.18, Postgres 17.11 and Mailpit in Docker, Playwright (MCP browser) for screenshots.

**Context:** B1 is finished on `dev` (186 tests; lint, tsc and build clean). Its spec is `docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md`, kept as-built; each task below updates it. Task 1 of the brief (reconciling GitHub's `main`) was done before this plan: `main` now includes GitHub's August history and the canary workflow, and `dev` has `main` merged in. Tasks are numbered 2 to 5 to match the brief.

Decisions already made by the developer (23 October 2026):
- Task 3 counts rich text as "in use": images placed in rich text, relationship blocks and internal links all block a delete, as do relationship and upload fields in collections and globals.
- Task 4 uses `drafts.validate: true` on articles (the only collection with scheduled publishing).
- Task 5 fakes success (normal 201 response, nothing saved, no alert).

## Global Constraints

- Versions are fixed: `payload` and every `@payloadcms/*` package `3.90.2`, `next` `16.4.1`, `react` `19.2.9`, `vitest` `4.0.18`, `typescript` `5.9.3`. No package is added or upgraded by this plan.
- `AGENTS.md`: this Next.js version has breaking changes. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. (No task here writes Next.js routing code.)
- Never open or read `.env` or `.env.example`, and keep them out of anything sent for review.
- Git: each task is built on its own branch, created from `dev` by the controller before the implementer starts. The implementer commits only on that branch and never switches branches. The controller merges each branch into `dev` with `git merge --no-ff` after its review passes. Nothing is pushed.
- Commit messages are in the developer's own voice. No `Co-Authored-By` trailer, no "Generated with Claude Code" line, no robot emoji.
- Writing rules for every comment, commit message, admin label, error message and doc line: no em dashes or en dashes (use commas, colons, brackets or separate sentences), and never "we", "us" or "our" (proper names such as "Our Writers" are fine). Plain British English for anything staff read.
- Services: start Docker with `docker compose up -d` before running tests. Postgres is on 5432; Mailpit SMTP on 21025, inbox at http://localhost:28025.
- Port 3000 belongs to another project. The dev server runs on 3100, with the server URL pointed at it so admin login works: in Git Bash `NEXT_PUBLIC_SERVER_URL=http://localhost:3100 npm run dev -- -p 3100`, in PowerShell `$env:NEXT_PUBLIC_SERVER_URL='http://localhost:3100'; npm run dev -- -p 3100`. Seeded logins: `admin@noisystreetss.test` / `admin-dev-password`.
- Tests: `npm test` runs everything against the separate `noisy_streetss_test` database. One file: `npx vitest run <path>`. Lint: `npm run lint`. Types: `npx tsc --noEmit`. Do not run `npm run build` while a dev server is running; the controller runs the build at the end.
- UI checks: after any change that can affect what the admin looks like, screenshot it with Playwright and look at the screenshots, at every width the change affects (always 1440 px and 390 px). Say exactly which widths were viewed. Screenshots go in `.screenshots/` (git-ignored).
- No schema changes: none of these tasks adds or changes a field, so no migration and no `generate:types` run is needed. If a task finds it needs one, stop and report.

---

### Task 2: Admin styles on phones

**Branch:** `fix/admin-phone-styles`

**Files:**
- Modify: `src/app/(payload)/custom.scss`
- Modify: `docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md` (section 5.2)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing other tasks rely on. (Task 4 makes more field errors appear on article drafts; this task is what makes them visible on phones.)

**What is wrong today** (seen by the controller on 23 October 2026, screenshots in `.screenshots/task2-before/`):

1. Field error messages are hidden at 1024 px and below. Payload renders each one as `<aside class="tooltip field-error tooltip--show tooltip--caret-right tooltip--position-top">` inside `.field-type__wrap` (which is `position: relative`), and its tooltip stylesheet has `.tooltip { @media (max-width: 1024px) { display: none } }`. On a phone, an invalid field only turns red, and the toast names the field (`The following field is invalid: startsAt`) without the reason. (`popup-empty-390.png`, `popup-clash-390.png`.)
2. Long messages are cut short at every width. The tooltip is `white-space: nowrap` with `max-width: 75%` of the field, and its `.tooltip-content` has `overflow: hidden; text-overflow: ellipsis`. The book popup clash message on the half-width "Show from" field reads `These dates overlap with "New: Letters from Shom...` at 1440. (`popup-clash-1440.png`.)
3. An image placed in rich text overflows at 390. The card is `.LexicalEditorTheme__upload`; Payload sets landscape images to `min-width: 450px; max-width: 450px` and at 768 px and below only unsets the minimum, so the image stays 400 px wide inside a 343 px column and runs off the right edge (page scroll width 418 at a 390 viewport). (`article-390-top.png`.)
4. The "Status / Last Modified / Created" row is clipped at 390. At 1024 px and below Payload keeps `.doc-controls__meta` on one line inside `.doc-controls__content { overflow: auto }` with the scrollbar hidden and a fade (`.doc-controls__meta::after`) at the right edge, so "Created: October 23..." is cut off with no visible way to reach it. (`article-390-top.png`.)

**Test records** (in the local development database; the controller created them before this plan):
- Article "Visual check: image in body" (id 50, a draft with an image placed in its body).
- Book popup "Visual check clash" (id 6, switched off, dates 25 to 30 October 2026, which overlap the seeded popup).

If `npm run seed` has been run since, they are gone. Recreate them by running this with the Playwright MCP tool `browser_run_code_unsafe` while the dev server is up, and use the ids it returns:

```js
async (page) => {
  const base = 'http://localhost:3100/api';
  const { token } = await (await page.request.post(base + '/users/login', { data: { email: 'admin@noisystreetss.test', password: 'admin-dev-password' } })).json();
  const headers = { Authorization: `JWT ${token}` };
  const get = async (p) => (await page.request.get(base + p, { headers })).json();
  const media = await get('/media?depth=0&limit=1');
  const a = (await get('/articles?depth=0&limit=1&draft=true')).docs[0];
  const body = JSON.parse(JSON.stringify(a.body));
  body.root.children.splice(1, 0, { type: 'upload', version: 3, format: '', id: 'visual-check-1', fields: null, relationTo: 'media', value: media.docs[0].id });
  const article = await (await page.request.post(base + '/articles?depth=0', { headers, data: { title: 'Visual check: image in body', summary: 'Checking the image card on phones.', body, writers: a.writers, categories: a.categories, publishDate: a.publishDate, _status: 'draft' } })).json();
  const book = (await get('/books?depth=0&limit=1')).docs[0].id;
  const popup = await (await page.request.post(base + '/popup-campaigns?depth=0', { headers, data: { book, headline: 'Visual check clash', startsAt: '2026-10-25T09:00:00.000Z', endsAt: '2026-10-30T09:00:00.000Z', enabled: false } })).json();
  return { articleId: article.doc?.id, popupId: popup.doc?.id };
}
```

The browser must be logged in to the admin: open http://localhost:3100/admin/login and sign in as the seeded admin, or call `page.request.post('http://localhost:3100/api/users/login', ...)` in `browser_run_code_unsafe`, which sets the cookie for the page.

- [ ] **Step 1: Confirm the "before" screenshots exist**

Run: `ls .screenshots/task2-before/`
Expected: `article-1440.png`, `article-390-top.png`, `popup-clash-1440.png`, `popup-clash-390.png`, `popup-empty-1440.png`, `popup-empty-390.png`. Open two or three of them to see the problems described above.

- [ ] **Step 2: Write the overrides**

Replace the whole of `src/app/(payload)/custom.scss` with:

```scss
// Text boxes keep a fixed width and only grow downwards, so dragging one can't push
// a field out of its column. Payload's own styles sit in a cascade layer, so this
// unlayered rule takes precedence. The same goes for every rule below.
textarea {
  resize: vertical;
}

// Field error messages. Payload shows each one as a one-line tooltip above the field,
// cut short with an ellipsis, so a long reason such as the book popup clash can't be
// read. Here the whole message wraps, growing upwards from the field so it doesn't
// cover the input.
.field-error.tooltip {
  white-space: normal;

  .tooltip-content {
    overflow: visible;
    text-overflow: clip;
  }

  &.tooltip--position-top {
    top: auto;
    bottom: 100%;
  }
}

// Payload hides every tooltip at 1024 px and below, which leaves an invalid field
// red with no reason given. There the message sits in the page above the input,
// at full width, instead of floating.
@media (max-width: 1024px) {
  .field-error.tooltip--show {
    display: block;
    position: relative;
    inset: auto;
    max-width: none;
    margin-bottom: calc(var(--base) * 0.5);
    transform: none;
  }
}

// An image placed in rich text. Payload sets landscape images to exactly 450 px wide
// and only lifts the minimum on small screens, so on a phone the card runs off the edge.
@media (max-width: 768px) {
  .LexicalEditorTheme__upload {
    max-width: 100%;

    img,
    svg {
      max-width: 100%;
      height: auto;
    }
  }
}

// The Status, Last Modified and Created row above each record. At 1024 px and below
// Payload keeps it on one line that scrolls sideways with its scrollbar hidden, so on
// a phone the end of the row is cut off. Here the items wrap onto new lines instead.
@media (max-width: 1024px) {
  .doc-controls__content {
    overflow: visible;
  }

  .doc-controls__meta {
    flex-wrap: wrap;
    row-gap: calc(var(--base) / 4);

    // Payload's fade at the right edge, a hint that the row scrolls. It no longer does.
    &::after {
      display: none;
    }
  }
}
```

- [ ] **Step 3: Start the dev server (if it isn't running) and take the "after" screenshots**

If http://localhost:3100/admin/login doesn't answer, start the server in the background as described in Global Constraints and wait for the login page to return 200.

With Playwright, save each of these into `.screenshots/task2-after/`, then open and look at every one:

| File | Page and state | Width |
|---|---|---|
| `popup-clash-1440.png` | `/admin/collections/popup-campaigns/<popup id>`: tick "Switched on", click Save, wait for the error | 1440 × 900 |
| `popup-clash-1024.png` | the same state, after resizing | 1024 × 768 |
| `popup-clash-390.png` | the same state, scrolled so "Show from" is in view | 390 × 844 |
| `popup-empty-1440.png` | `/admin/collections/popup-campaigns/create`, click Save with nothing filled in | 1440 × 900 |
| `popup-empty-390.png` | the same state | 390 × 844 |
| `article-empty-390.png` | `/admin/collections/articles/create`, click "Publish changes" with nothing filled in (rich text, relationship and date fields all show errors), full page | 390 × 844, `fullPage: true` |
| `article-1440.png` | `/admin/collections/articles/<article id>` | 1440 × 900 |
| `article-768.png` | the same | 768 × 1024 |
| `article-390-top.png` | the same | 390 × 844 |

The edit form asks before leaving with unsaved changes; accept that dialog (`page.on('dialog', d => d.accept())` in `browser_run_code_unsafe`, or `browser_handle_dialog`).

Expected, from looking at the screenshots:
- 1440: the clash message reads in full, wrapped over two or three lines above the "Show from" input, right-aligned as before, and covers no part of the input. Single-line errors ("This field is required.") look as they did before.
- 1024 and 390: every error message shows above its input at full width, in Payload's red, with the caret pointing at the input, and pushes the input down rather than overlapping anything.
- 768 and 390: the image card fits inside the editor column; nothing runs off the right edge.
- 390: "Status", "Last Modified" and "Created" each show in full, wrapping onto a second line; no fade at the right edge.
- 1440: the article page and the meta row look exactly as in `.screenshots/task2-before/article-1440.png`.

Also run this with `browser_evaluate` at 390 on the article page:

```js
() => ({ viewport: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })
```

Expected: `scrollWidth` equals `viewport`. (Before: 418 against 375.) This number alone does not prove the layout is right; the screenshots do.

- [ ] **Step 4: Adjust if anything looks wrong, then re-check**

If an error message overlaps something, a card still overflows, or the 1440 look changed where it shouldn't have, adjust only `custom.scss`, keep each rule's comment accurate, and repeat Step 3 for the affected screenshots. Report any adjustment and why.

- [ ] **Step 5: Update the spec**

In `docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md`, section 5.2, add this bullet after "The admin lives at `/admin`, and the REST API at `/api`.":

```markdown
- `src/app/(payload)/custom.scss` overrides a few of Payload's admin styles so the admin works on phones (added 23 October 2026): field error messages show in full at every width and sit above the input at 1024 px and below (Payload hides them there), images placed in rich text fit the column at 768 px and below, and the Status / Last Modified / Created row wraps instead of being cut off. Text boxes only resize vertically.
```

- [ ] **Step 6: Lint and commit**

Run: `npm run lint`
Expected: no errors.

```bash
git add "src/app/(payload)/custom.scss" docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md
git commit -m "Show field errors in full and on phones, and stop admin cards overflowing at 390 px"
```

Report which widths were looked at, and list the screenshot files.

---

### Task 3: Refuse to delete records that are still in use

**Branch:** `feat/delete-guard`

**Files:**
- Create: `src/rules/references.ts` (finds every place a record is used; builds the message)
- Create: `src/hooks/deleteGuard.ts` (the `beforeDelete` hook and `guardDeletes`)
- Modify: `src/payload.config.ts` (wrap the collections list in `guardDeletes`)
- Modify: `tests/helpers/payload.ts` (add `rest` and `tokenFor`; name the staff test password)
- Create: `tests/unit/references.spec.ts`
- Create: `tests/int/deleteGuard.int.spec.ts`
- Modify: `docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md` (section 6.1)

**Interfaces:**
- Consumes: nothing from other tasks. The guard reads the sanitised config (`req.payload.config`) at run time, so it covers new collections and fields without changes.
- Produces:
  - `rest(method: string, path: string, options?: { body?: unknown; token?: string }): Promise<Response>` in `tests/helpers/payload.ts`. Sends a request through Payload's REST API (`handleEndpoints`, the code behind `/api`). `path` is relative to `/api`, for example `/books/12`. Task 5 uses it.
  - `tokenFor(payload: Payload, user: User): Promise<string>` in `tests/helpers/payload.ts`. A login token for an account made by `createStaff`.
  - `STAFF_PASSWORD` constant in `tests/helpers/payload.ts` (`'test-password-123'`, the value `createStaff` already uses).
  - `refuseDeleteWhileInUse` and `guardDeletes(collections: CollectionConfig[]): CollectionConfig[]` in `src/hooks/deleteGuard.ts`.
  - `findUsages(req: PayloadRequest, target: string, id: number | string): Promise<Usage[]>`, `inUseMessage(name: string, usages: Usage[]): string`, `richTextRefs(value: unknown): Ref[]`, `wordsFromName(name: string): string` in `src/rules/references.ts`.

**Background the implementer needs:**
- Today, deleting a record that others point at either silently empties the pointer (collections with drafts: their columns allow empty values, so Postgres's `ON DELETE SET NULL` succeeds) or fails with a raw database error (lists without drafts: a required column can't be set to null). Examples: a book used by a book popup, a submission call with manuscript submissions.
- Payload calls a collection's `beforeDelete` hooks with `{ collection, id, req }` for a single delete and, for a bulk delete, once per record with the same `req` (in parallel, inside one transaction). A hook that throws stops only that record: a bulk delete carries on with the others and reports `errors: [{ id, message, isPublic }]`. An `APIError` built with `isPublic: true` keeps its message in REST responses, and the admin shows it in a toast (bulk: the toast lists every message).
- Drafts: saving a draft writes only to the version history, not the main table. `payload.find({ draft: true })` reads the latest version of each record. So a reference can be in the main table (the version last published, or as created), in the latest draft, or both. The guard checks both.
- Every sanitised collection and global has `flattenedFields`: rows, collapsibles and unnamed tabs are flattened away; groups, named tabs (`type: 'tab'`), arrays and blocks keep their own `flattenedFields`.
- Rich text is stored as Lexical JSON. The nodes that point at records: `{ type: 'upload', relationTo, value }`, `{ type: 'relationship', relationTo, value }`, and links `{ type: 'link' | 'autolink', fields: { linkType: 'internal', doc: { relationTo, value } } }`. `value` is an id at depth 0, or an object with `id` when populated.
- Payload's own collections (`payload-jobs`, `payload-locked-documents`, `payload-preferences`, `payload-migrations` and any other slug starting `payload-`) are skipped: they point at everything and must never block a delete.
- The seed and `resetCollections` empty tables with `payload.db.deleteMany`, which runs no hooks, so they are unaffected.

- [ ] **Step 1: Add the REST helpers to `tests/helpers/payload.ts`**

Add `handleEndpoints` to the existing `payload` import, so it reads:

```ts
import { type CollectionSlug, getPayload, handleEndpoints, type Payload } from 'payload'
```

Replace the literal password in `createStaff` with a named constant, adding above `let staffCount = 0`:

```ts
/** The password every createStaff account gets. */
export const STAFF_PASSWORD = 'test-password-123'
```

and in `createStaff`, `password: 'test-password-123',` becomes `password: STAFF_PASSWORD,`.

Add at the end of the file:

```ts
/** A login token for an account made by createStaff, for REST requests. */
export async function tokenFor(payload: Payload, user: User): Promise<string> {
  const { token } = await payload.login({ collection: 'users', data: { email: user.email, password: STAFF_PASSWORD } })
  if (!token) throw new Error(`No login token for ${user.email}`)
  return token
}

/**
 * Sends a request through Payload's REST API: the same code that answers /api in the app,
 * so access rules, endpoints and error responses are all the real ones. `path` is relative
 * to /api, for example `/books/12`. Without a token the request comes from a visitor.
 */
export function rest(method: string, path: string, { body, token }: { body?: unknown; token?: string } = {}): Promise<Response> {
  const headers = new Headers()
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `JWT ${token}`)
  return handleEndpoints({
    config,
    request: new Request(`http://localhost:3000/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  })
}
```

(`config` is already imported at the top of the file from `@payload-config`. The controller checked on 23 October 2026 that `handleEndpoints` runs under Vitest against the test database.)

- [ ] **Step 2: Write the failing unit tests**

Create `tests/unit/references.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { inUseMessage, richTextRefs, wordsFromName } from '@/rules/references'

describe('wordsFromName', () => {
  it('turns a field name into a label', () => {
    expect(wordsFromName('heroImage')).toBe('Hero image')
    expect(wordsFromName('cover')).toBe('Cover')
    expect(wordsFromName('site-settings')).toBe('Site settings')
  })
})

describe('richTextRefs', () => {
  const paragraph = (...children: unknown[]) => ({ type: 'paragraph', children })

  it('finds placed images, relationship blocks and internal links, at any depth', () => {
    const value = {
      root: {
        type: 'root',
        children: [
          { type: 'upload', relationTo: 'media', value: 7 },
          { type: 'relationship', relationTo: 'books', value: { id: 3, title: 'Populated' } },
          paragraph({ type: 'link', fields: { linkType: 'internal', doc: { relationTo: 'writers', value: 9 } }, children: [] }),
          paragraph({ type: 'link', fields: { linkType: 'custom', url: 'https://example.com' }, children: [] }),
        ],
      },
    }
    expect(richTextRefs(value)).toEqual([
      { relationTo: 'media', id: '7' },
      { relationTo: 'books', id: '3' },
      { relationTo: 'writers', id: '9' },
    ])
  })

  it('returns nothing for empty or unexpected values', () => {
    expect(richTextRefs(null)).toEqual([])
    expect(richTextRefs({})).toEqual([])
    expect(richTextRefs({ root: { children: 'not a list' } })).toEqual([])
  })
})

describe('inUseMessage', () => {
  it('names each place once, with every field it is used in', () => {
    const message = inUseMessage('"Harmattan"', [
      { holder: 'Article "One"', field: 'Cover', record: { collection: 'articles', id: 1 } },
      { holder: 'Article "One"', field: 'Body', record: { collection: 'articles', id: 1 } },
      { holder: 'Article "One"', field: 'Body', record: { collection: 'articles', id: 1 } },
      { holder: 'Site settings', field: 'Default sharing image' },
    ])
    expect(message).toBe(
      '"Harmattan" is still used by Article "One" (Cover, Body); Site settings (Default sharing image). Remove it from there first, then delete it.',
    )
  })

  it('keeps two records with the same title apart', () => {
    const message = inUseMessage('"Photo"', [
      { holder: 'Book "Same"', field: 'Cover', record: { collection: 'books', id: 1 } },
      { holder: 'Book "Same"', field: 'Cover', record: { collection: 'books', id: 2 } },
    ])
    expect(message).toContain('Book "Same" (Cover); Book "Same" (Cover).')
  })

  it('lists five places and counts the rest', () => {
    const usages = Array.from({ length: 7 }, (_, i) => ({
      holder: `Book "B${i}"`,
      field: 'Cover',
      record: { collection: 'books', id: i },
    }))
    const message = inUseMessage('"Photo"', usages)
    expect(message).toContain('Book "B4" (Cover); and 2 more. Remove it from there first')
    expect(message).not.toContain('B5')
  })
})
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run tests/unit/references.spec.ts`
Expected: FAIL, because `@/rules/references` doesn't exist.

- [ ] **Step 4: Write `src/rules/references.ts`**

```ts
import type {
  CollectionSlug,
  FlattenedField,
  GlobalSlug,
  PayloadRequest,
  SanitizedCollectionConfig,
  SelectType,
  Where,
} from 'payload'

/** One place a record is used: the record or page holding it, and the field it's in. */
export type Usage = {
  /** How staff know the holder: `Book popup "Spring sale"`, or a page such as `Site settings`. */
  holder: string
  /** The field's label in the admin, such as `Cover` or `Meta › Image`. */
  field: string
  /** Set for records in collections, so two records with the same title stay apart and a record never blocks itself. */
  record?: { collection: string; id: number | string }
}

/** What a reference points at. Ids are kept as strings, so 12 and "12" match. */
export type Ref = { relationTo: string; id: string }

const MAX_LISTED = 5

/** Payload's own collections point at everything (locks, preferences, jobs) and never count. */
const isInternal = (slug: string) => slug.startsWith('payload-')

/** 'heroImage' or 'site-settings' becomes 'Hero image' or 'Site settings', for anything without a label. */
export function wordsFromName(name: string): string {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function labelOf(field: FlattenedField): string {
  const label = 'label' in field ? field.label : undefined
  return typeof label === 'string' ? label : wordsFromName(field.name)
}

function singularOf(collection: SanitizedCollectionConfig): string {
  const singular = collection.labels?.singular
  return typeof singular === 'string' ? singular : wordsFromName(collection.slug)
}

function titleOf(collection: SanitizedCollectionConfig, doc: Record<string, unknown>): string | undefined {
  const title = doc[collection.admin.useAsTitle]
  return typeof title === 'string' && title.trim() ? title : undefined
}

/** A record as the subject of the message: its title in quotes, or the list's name and its number. */
export function recordName(collection: SanitizedCollectionConfig, doc: Record<string, unknown>): string {
  const title = titleOf(collection, doc)
  return title ? `"${title}"` : `${singularOf(collection)} ${String(doc.id)}`
}

/** A record holding a reference: `Book popup "Spring sale"`, or `Image 12` when it has no title. */
function holderName(collection: SanitizedCollectionConfig, doc: Record<string, unknown>): string {
  const title = titleOf(collection, doc)
  return title ? `${singularOf(collection)} "${title}"` : `${singularOf(collection)} ${String(doc.id)}`
}

const idOf = (value: unknown): string | undefined => {
  if (typeof value === 'number' || (typeof value === 'string' && value !== '')) return String(value)
  if (value && typeof value === 'object' && 'id' in value) return idOf((value as { id: unknown }).id)
  return undefined
}

type LexicalNode = {
  type?: unknown
  relationTo?: unknown
  value?: unknown
  fields?: { linkType?: unknown; doc?: { relationTo?: unknown; value?: unknown } | null } | null
  children?: unknown
}

/** The records an editor has placed in rich text: images, relationship blocks and internal links. */
export function richTextRefs(value: unknown): Ref[] {
  const refs: Ref[] = []
  const visit = (node: LexicalNode) => {
    if ((node.type === 'upload' || node.type === 'relationship') && typeof node.relationTo === 'string') {
      const id = idOf(node.value)
      if (id) refs.push({ relationTo: node.relationTo, id })
    }
    if ((node.type === 'link' || node.type === 'autolink') && node.fields?.linkType === 'internal') {
      const doc = node.fields.doc
      const id = idOf(doc?.value)
      if (doc && typeof doc.relationTo === 'string' && id) refs.push({ relationTo: doc.relationTo, id })
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) if (child && typeof child === 'object') visit(child as LexicalNode)
    }
  }
  const root = value && typeof value === 'object' ? (value as { root?: unknown }).root : undefined
  if (root && typeof root === 'object') visit(root as LexicalNode)
  return refs
}

/** Relationship and upload fields, at any depth, that point at `target`: their query path and label. */
function referenceFields(fields: FlattenedField[], target: string, pathPrefix = '', labelPrefix = '') {
  const found: { path: string; label: string }[] = []
  for (const field of fields) {
    const path = pathPrefix + field.name
    const label = labelPrefix + labelOf(field)
    if ((field.type === 'relationship' || field.type === 'upload') && field.relationTo === target) {
      found.push({ path, label })
    } else if (field.type === 'group' || field.type === 'tab' || field.type === 'array') {
      found.push(...referenceFields(field.flattenedFields, target, `${path}.`, `${label} › `))
    } else if (field.type === 'blocks') {
      for (const block of field.blocks) found.push(...referenceFields(block.flattenedFields, target, `${path}.`, `${label} › `))
    }
  }
  return found
}

/**
 * Every reference in one record's data, with the label of the field it sits in. Rich text is
 * always read; relationship and upload values only when `withFields` is set (collections answer
 * those by database query instead).
 */
function refsInData(fields: FlattenedField[], data: unknown, withFields: boolean, labelPrefix = ''): { ref: Ref; field: string }[] {
  const out: { ref: Ref; field: string }[] = []
  if (!data || typeof data !== 'object') return out
  const record = data as Record<string, unknown>
  for (const field of fields) {
    const value = record[field.name]
    const label = labelPrefix + labelOf(field)
    if (field.type === 'richText') {
      for (const ref of richTextRefs(value)) out.push({ ref, field: label })
    } else if (withFields && (field.type === 'relationship' || field.type === 'upload') && typeof field.relationTo === 'string') {
      for (const item of Array.isArray(value) ? value : [value]) {
        const id = idOf(item)
        if (id) out.push({ ref: { relationTo: field.relationTo, id }, field: label })
      }
    } else if (field.type === 'group' || field.type === 'tab') {
      out.push(...refsInData(field.flattenedFields, value, withFields, `${label} › `))
    } else if (field.type === 'array' && Array.isArray(value)) {
      for (const row of value) out.push(...refsInData(field.flattenedFields, row, withFields, `${label} › `))
    } else if (field.type === 'blocks' && Array.isArray(value)) {
      for (const row of value) {
        const blockType = row && typeof row === 'object' ? (row as { blockType?: unknown }).blockType : undefined
        const block = field.blocks.find((candidate) => candidate.slug === blockType)
        if (block) out.push(...refsInData(block.flattenedFields, row, withFields, `${label} › `))
      }
    }
  }
  return out
}

/** The top-level fields whose data holds rich text somewhere inside, to limit what is read. */
function richTextFieldNames(fields: FlattenedField[]): string[] {
  const holds = (field: FlattenedField): boolean => {
    if (field.type === 'richText') return true
    if (field.type === 'group' || field.type === 'tab' || field.type === 'array') return field.flattenedFields.some(holds)
    if (field.type === 'blocks') return field.blocks.some((block) => block.flattenedFields.some(holds))
    return false
  }
  return fields.filter(holds).map((field) => field.name)
}

type Index = Map<string, Usage[]>

const refKey = (relationTo: string, id: number | string) => `${relationTo}:${String(id)}`

/**
 * Rich text across every collection, and every reference held by a global, read once and
 * looked up by what it points at. A bulk delete calls the guard once per record with the same
 * request, so the index is kept per request rather than rebuilt for each record.
 */
const indexes = new WeakMap<PayloadRequest, Promise<Index>>()

async function buildIndex(req: PayloadRequest): Promise<Index> {
  const index: Index = new Map()
  const add = (ref: Ref, usage: Usage) => {
    const key = refKey(ref.relationTo, ref.id)
    index.set(key, [...(index.get(key) ?? []), usage])
  }

  for (const collection of req.payload.config.collections) {
    if (isInternal(collection.slug)) continue
    const names = richTextFieldNames(collection.flattenedFields)
    if (names.length === 0) continue
    const select = Object.fromEntries([collection.admin.useAsTitle, ...names].map((name) => [name, true])) as SelectType
    for (const draft of collection.versions?.drafts ? [false, true] : [false]) {
      const { docs } = await req.payload.find({
        collection: collection.slug as CollectionSlug,
        depth: 0,
        draft,
        overrideAccess: true,
        pagination: false,
        req,
        select,
      })
      for (const doc of docs as Record<string, unknown>[]) {
        const holder = holderName(collection, doc)
        for (const { ref, field } of refsInData(collection.flattenedFields, doc, false)) {
          add(ref, { holder, field, record: { collection: collection.slug, id: doc.id as number | string } })
        }
      }
    }
  }

  for (const global of req.payload.config.globals) {
    const data = await req.payload.findGlobal({ slug: global.slug as GlobalSlug, depth: 0, overrideAccess: true, req })
    const holder = typeof global.label === 'string' ? global.label : wordsFromName(global.slug)
    for (const { ref, field } of refsInData(global.flattenedFields, data, true)) add(ref, { holder, field })
  }
  return index
}

/**
 * Every place the record `target`/`id` is still used: relationship and upload fields in any
 * collection (published and latest draft), rich text anywhere, and the globals. A record's
 * references to itself don't count.
 */
export async function findUsages(req: PayloadRequest, target: string, id: number | string): Promise<Usage[]> {
  const usages: Usage[] = []

  for (const collection of req.payload.config.collections) {
    if (isInternal(collection.slug)) continue
    for (const { path, label } of referenceFields(collection.flattenedFields, target)) {
      const where: Where = { [path]: { in: [id] } }
      for (const draft of collection.versions?.drafts ? [false, true] : [false]) {
        const { docs } = await req.payload.find({
          collection: collection.slug as CollectionSlug,
          depth: 0,
          draft,
          overrideAccess: true,
          pagination: false,
          req,
          select: { [collection.admin.useAsTitle]: true } as SelectType,
          where,
        })
        for (const doc of docs as Record<string, unknown>[]) {
          usages.push({ holder: holderName(collection, doc), field: label, record: { collection: collection.slug, id: doc.id as number | string } })
        }
      }
    }
  }

  let index = indexes.get(req)
  if (!index) {
    index = buildIndex(req)
    indexes.set(req, index)
  }
  usages.push(...((await index).get(refKey(target, id)) ?? []))

  return usages.filter((usage) => !(usage.record?.collection === target && String(usage.record.id) === String(id)))
}

/** The plain message shown in the admin when a delete is refused. */
export function inUseMessage(name: string, usages: Usage[]): string {
  const places = new Map<string, { holder: string; fields: Set<string> }>()
  for (const usage of usages) {
    const key = usage.record ? refKey(usage.record.collection, usage.record.id) : usage.holder
    const place = places.get(key) ?? { holder: usage.holder, fields: new Set<string>() }
    place.fields.add(usage.field)
    places.set(key, place)
  }
  const described = [...places.values()].map(({ holder, fields }) => `${holder} (${[...fields].join(', ')})`)
  const listed = described.slice(0, MAX_LISTED).join('; ')
  const more = described.length > MAX_LISTED ? `; and ${described.length - MAX_LISTED} more` : ''
  return `${name} is still used by ${listed}${more}. Remove it from there first, then delete it.`
}
```

If TypeScript rejects one of the casts (`as SelectType`, `as CollectionSlug`, `as GlobalSlug`, `as Record<string, unknown>[]`), keep the cast at that call and fix only its type; these lookups run across every collection, which Payload's per-collection generics don't describe. Don't widen anything to `any`.

- [ ] **Step 5: Run the unit tests to see them pass**

Run: `npx vitest run tests/unit/references.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Write the failing integration tests**

Create `tests/int/deleteGuard.int.spec.ts`:

```ts
import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User, Writer } from '@/payload-types'
import { richText } from '@/seed/richText'
import { samplePdf } from '@/seed/samplePdf'

import { createImage, createStaff, createWriter, getTestPayload, rest, tokenFor } from '../helpers/payload'

const DAY = 24 * 60 * 60 * 1000
const fromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()
const unique = () => Math.random().toString(36).slice(2, 8)
const inUse = /is still used by .+\. Remove it from there first, then delete it\./

let payload: Payload
let admin: User
let writer: Writer
let categoryId: number
let popupDays = 400

beforeAll(async () => {
  payload = await getTestPayload()
  admin = await createStaff(payload, 'admin')
  writer = await createWriter(payload)
  categoryId = (await payload.create({ collection: 'categories', data: { name: `Guard ${unique()}` } })).id
})

afterAll(async () => {
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { contactEmail: 'hello@noisystreetss.test', formAlertEmail: 'inbox@noisystreetss.test', defaultShareImage: null },
  })
})

const newBook = async () =>
  payload.create({
    collection: 'books',
    data: {
      title: `Guard Book ${unique()}`,
      cover: (await createImage(payload)).id,
      writers: [writer.id],
      category: 'fiction',
      summary: 'A test book.',
      _status: 'published',
    },
  })

// Switched off, and far in the future, so it never clashes with another test's popup.
const newPopup = (bookId: number) => {
  popupDays += 10
  return payload.create({
    collection: 'popup-campaigns',
    data: { book: bookId, headline: `Guard popup ${unique()}`, startsAt: fromNow(popupDays), endsAt: fromNow(popupDays + 1), enabled: false },
  })
}

const newArticle = (overrides: Record<string, unknown> = {}) =>
  payload.create({
    collection: 'articles',
    data: {
      title: `Guard Article ${unique()}`,
      summary: 'A test article.',
      body: richText('Some text.'),
      writers: [writer.id],
      categories: [categoryId],
      publishDate: fromNow(0),
      _status: 'published',
      ...overrides,
    },
  })

/** Rich text with one extra node after a paragraph. */
const bodyWith = (node: Record<string, unknown>) => {
  const body = richText('Before the extra node.')
  return { root: { ...body.root, children: [...body.root.children, node] } }
}

/** A paragraph holding an internal link to a record. */
const linkTo = (relationTo: string, value: number) => {
  const paragraph = richText('x').root.children[0]
  return {
    ...paragraph,
    children: [
      {
        type: 'link',
        version: 3,
        direction: 'ltr',
        format: '',
        indent: 0,
        fields: { linkType: 'internal', newTab: false, doc: { relationTo, value } },
        children: [{ type: 'text', text: 'a link', format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
      },
    ],
  }
}

const placedImage = (value: number) => ({ type: 'upload', version: 3, format: '', id: `guard-${unique()}`, fields: null, relationTo: 'media', value })

const stillThere = async (collection: 'books' | 'media' | 'writers' | 'submission-calls' | 'manuscripts', id: number) =>
  (await payload.count({ collection, where: { id: { equals: id } } })).totalDocs === 1

describe('deleting a record that is still in use', () => {
  it('refuses a book that a book popup uses, and names the popup (list without drafts)', async () => {
    const book = await newBook()
    const popup = await newPopup(book.id)
    await expect(payload.delete({ collection: 'books', id: book.id })).rejects.toThrow(
      `"${book.title}" is still used by Book popup "${popup.headline}" (Book). Remove it from there first, then delete it.`,
    )
    expect(await stillThere('books', book.id)).toBe(true)
  })

  it('refuses a submission call that has submissions, and the file a submission holds', async () => {
    const call = await payload.create({
      collection: 'submission-calls',
      data: {
        title: `Guard call ${unique()}`,
        themeSummary: 'A theme.',
        guidelines: richText('Up to 5,000 words.'),
        opensAt: fromNow(-2),
        closesAt: fromNow(10),
        _status: 'published',
      },
    })
    const file = await payload.create({ collection: 'manuscripts', data: {}, file: samplePdf(`guard-${unique()}.pdf`) })
    const submission = await payload.create({
      collection: 'manuscript-submissions',
      data: { call: call.id, name: 'Chidi Writer', email: 'chidi@example.com', workTitle: `Guard work ${unique()}`, shortBio: 'Writes.', file: file.id, status: 'new' },
    })
    await expect(payload.delete({ collection: 'submission-calls', id: call.id })).rejects.toThrow(
      `Manuscript submission "${submission.workTitle}" (Submission call)`,
    )
    await expect(payload.delete({ collection: 'manuscripts', id: file.id })).rejects.toThrow(
      `Manuscript submission "${submission.workTitle}" (Manuscript file)`,
    )
    expect(await stillThere('submission-calls', call.id)).toBe(true)
    expect(await stillThere('manuscripts', file.id)).toBe(true)
  })

  it('refuses a writer named on a published article, and the article keeps the writer (list with drafts)', async () => {
    const solo = await createWriter(payload)
    const article = await newArticle({ writers: [solo.id] })
    await expect(payload.delete({ collection: 'writers', id: solo.id })).rejects.toThrow(`Article "${article.title}" (Writers)`)
    const kept = await payload.findByID({ collection: 'articles', id: article.id, depth: 0 })
    expect(kept.writers).toEqual([solo.id])
  })

  it('refuses a writer named only in an article draft that is not published yet', async () => {
    const solo = await createWriter(payload)
    const article = await newArticle()
    await payload.update({ collection: 'articles', id: article.id, data: { writers: [writer.id, solo.id] }, draft: true })
    await expect(payload.delete({ collection: 'writers', id: solo.id })).rejects.toThrow(`Article "${article.title}" (Writers)`)
  })

  it('refuses an image placed in an article body', async () => {
    const image = await createImage(payload)
    const article = await newArticle({ body: bodyWith(placedImage(image.id)) })
    await expect(payload.delete({ collection: 'media', id: image.id })).rejects.toThrow(`Article "${article.title}" (Body)`)
    expect(await stillThere('media', image.id)).toBe(true)
  })

  it('refuses a book linked from rich text', async () => {
    const book = await newBook()
    const article = await newArticle({ body: bodyWith(linkTo('books', book.id)) })
    await expect(payload.delete({ collection: 'books', id: book.id })).rejects.toThrow(`Article "${article.title}" (Body)`)
  })

  it('refuses an image a page or setting still uses', async () => {
    const image = await createImage(payload)
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { contactEmail: 'hello@noisystreetss.test', formAlertEmail: 'inbox@noisystreetss.test', defaultShareImage: image.id },
    })
    await expect(payload.delete({ collection: 'media', id: image.id })).rejects.toThrow('Site settings (Default sharing image)')
  })

  it('refuses an image used as an article sharing image (SEO, inside a group)', async () => {
    const image = await createImage(payload)
    const article = await newArticle({ meta: { image: image.id } })
    await expect(payload.delete({ collection: 'media', id: image.id })).rejects.toThrow(`Article "${article.title}" (`)
  })

  it('deletes a record nothing uses, and one that only links to itself', async () => {
    const image = await createImage(payload)
    await payload.delete({ collection: 'media', id: image.id })
    expect(await stillThere('media', image.id)).toBe(false)

    const article = await newArticle()
    await payload.update({ collection: 'articles', id: article.id, data: { body: bodyWith(linkTo('articles', article.id)) } })
    await payload.delete({ collection: 'articles', id: article.id })
    expect((await payload.count({ collection: 'articles', where: { id: { equals: article.id } } })).totalDocs).toBe(0)
  })
})

describe('bulk deletes', () => {
  it('deletes the records nothing uses and refuses the rest, each with its own message', async () => {
    const used = await newBook()
    await newPopup(used.id)
    const unused = await newBook()
    const result = await payload.delete({ collection: 'books', where: { id: { in: [used.id, unused.id] } } })
    expect(result.docs.map((doc) => doc.id)).toEqual([unused.id])
    expect(result.errors).toEqual([expect.objectContaining({ id: used.id, message: expect.stringMatching(inUse) })])
    expect(await stillThere('books', used.id)).toBe(true)
    expect(await stillThere('books', unused.id)).toBe(false)
  })
})

describe('over the REST API, as the admin uses it', () => {
  it('answers a single delete with the plain message, not a database error', async () => {
    const token = await tokenFor(payload, admin)
    const book = await newBook()
    await newPopup(book.id)
    const res = await rest('DELETE', `/books/${book.id}`, { token })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.errors[0].message).toMatch(inUse)
  })

  it('answers a bulk delete with each refused record and its message', async () => {
    const token = await tokenFor(payload, admin)
    const used = await newBook()
    await newPopup(used.id)
    const unused = await newBook()
    const res = await rest('DELETE', `/books?where[id][in]=${used.id},${unused.id}`, { token })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.docs.map((doc: { id: number }) => doc.id)).toEqual([unused.id])
    expect(body.errors).toEqual([expect.objectContaining({ id: used.id, message: expect.stringMatching(inUse) })])
  })
})

describe('what the guard can see', () => {
  // The guard follows relationship and upload fields that point at one list. A field that can
  // point at several lists would need a different query, so this fails if one is ever added.
  it('finds no relationship or upload field that points at several lists', () => {
    const several: string[] = []
    const walk = (fields: Array<Record<string, unknown>>, where: string) => {
      for (const field of fields) {
        const path = `${where}.${String(field.name)}`
        if ((field.type === 'relationship' || field.type === 'upload') && Array.isArray(field.relationTo)) several.push(path)
        if (Array.isArray(field.flattenedFields)) walk(field.flattenedFields as Array<Record<string, unknown>>, path)
        if (Array.isArray(field.blocks)) {
          for (const block of field.blocks as Array<{ flattenedFields: Array<Record<string, unknown>> }>) walk(block.flattenedFields, path)
        }
      }
    }
    for (const collection of payload.config.collections) {
      if (!collection.slug.startsWith('payload-')) walk(collection.flattenedFields as unknown as Array<Record<string, unknown>>, collection.slug)
    }
    for (const global of payload.config.globals) walk(global.flattenedFields as unknown as Array<Record<string, unknown>>, global.slug)
    expect(several).toEqual([])
  })
})
```

Notes for the implementer:
- `toThrow(string)` checks that the message contains the string.
- If a data factory fails validation (for example a published book needs a field not listed), fix the factory, not the guard, and mention it in the report.
- If the SEO plugin's group isn't called `meta` or its image field isn't `image`, read the SEO field names from `node_modules/@payloadcms/plugin-seo` and adjust the test data only.

- [ ] **Step 7: Run them to see them fail**

Run: `docker compose up -d` (if not already up), then `npx vitest run tests/int/deleteGuard.int.spec.ts`
Expected: FAIL. The single-delete tests fail because deletes go through (or fail with a database error for the popup case), the bulk tests fail on the error message, and the last test (no polymorphic fields) already passes.

- [ ] **Step 8: Write the hook**

Create `src/hooks/deleteGuard.ts`:

```ts
import { APIError, type CollectionBeforeDeleteHook, type CollectionConfig, type CollectionSlug } from 'payload'

import { findUsages, inUseMessage, recordName } from '@/rules/references'

/**
 * Refuses to delete a record that another record, or a page, still points at, and says where.
 * Without it, deleting a book a popup uses fails with a database error staff can't read, and on
 * lists with drafts the pointer is silently emptied. In a bulk delete only the records still in
 * use are refused; the others are deleted, and each refusal is listed with its own message.
 */
export const refuseDeleteWhileInUse: CollectionBeforeDeleteHook = async ({ collection, id, req }) => {
  const usages = await findUsages(req, collection.slug, id)
  if (usages.length === 0) return
  const doc = await req.payload.findByID({
    collection: collection.slug as CollectionSlug,
    id,
    depth: 0,
    disableErrors: true,
    overrideAccess: true,
    req,
  })
  const name = recordName(collection, (doc as Record<string, unknown> | null) ?? { id })
  throw new APIError(inUseMessage(name, usages), 400, undefined, true)
}

/** Adds the guard to every collection, ahead of any delete hooks of its own. */
export function guardDeletes(collections: CollectionConfig[]): CollectionConfig[] {
  return collections.map((collection) => ({
    ...collection,
    hooks: {
      ...collection.hooks,
      beforeDelete: [refuseDeleteWhileInUse, ...(collection.hooks?.beforeDelete ?? [])],
    },
  }))
}
```

- [ ] **Step 9: Switch it on**

In `src/payload.config.ts`, add the import next to the other `./hooks` or `./rules` style imports (keep the file's alphabetical-ish order):

```ts
import { guardDeletes } from './hooks/deleteGuard'
```

and change the `collections:` line to wrap the existing array, unchanged inside:

```ts
  collections: guardDeletes([Users, Categories, Tags, Media, Manuscripts, Writers, Books, Articles, PodcastShows, PodcastEpisodes, SubmissionCalls, Awards, Events, Careers, BookClubSessions, Merch, StudioServices, MembershipPlans, Pages, Announcements, PopupCampaigns, PressMentions, Partners, ContactMessages, PartnershipEnquiries, BookstoreApplications, AdvisoryEnquiries, ManuscriptSubmissions]),
```

- [ ] **Step 10: Run the new tests to see them pass**

Run: `npx vitest run tests/int/deleteGuard.int.spec.ts tests/unit/references.spec.ts`
Expected: PASS (all).

- [ ] **Step 11: Run the whole suite, lint and types**

Run: `npm test`
Expected: PASS. All 186 earlier tests still pass, plus the new ones.

Run: `npm run lint` and `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 12: Update the spec**

In `docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md`, section 6.1, add this bullet at the end of the list:

```markdown
- **Deleting a record still in use** (added 23 October 2026): a delete is refused, with a plain message naming each record or page that still uses it and the field it's in, when the record is still referenced by a relationship or image field in any list (in the published version or the latest draft), by rich text anywhere (placed images, relationship blocks and internal links), or by a page record or setting. In a bulk delete only the records still in use are refused; the rest are deleted. A record's references to itself don't count. Known limit: two records that point at each other and are deleted together in one bulk delete are both refused; deleting them one at a time works once the reference is removed.
```

- [ ] **Step 13: Commit**

```bash
git add src/rules/references.ts src/hooks/deleteGuard.ts src/payload.config.ts tests/helpers/payload.ts tests/unit/references.spec.ts tests/int/deleteGuard.int.spec.ts docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md
git commit -m "Refuse to delete records that are still in use, and say where they are used"
```

---

### Task 4: Article drafts must be complete before they can be saved

**Branch:** `feat/article-draft-validation`

**Files:**
- Modify: `src/collections/Articles.ts`
- Modify: `tests/int/articles.int.spec.ts`
- Modify: `docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md` (section 6.1)

**Interfaces:**
- Consumes: `expectFieldError` from `tests/helpers/payload.ts` (existing).
- Produces: nothing other tasks rely on.

**Background:** A scheduled publish runs `payload.update({ data: { _status: 'published' } })` from the job queue. Drafts skip validation, so a draft missing a required field saves fine and then fails silently when its publish is due. The developer chose `versions.drafts.validate: true` for articles (the only collection with scheduled publishing): every draft save then runs the same validation as publishing. The cost, accepted: editors can't save a half-finished article (for example, a title only). Other collections with drafts keep saving incomplete drafts.

- [ ] **Step 1: Change the tests first**

In `tests/int/articles.int.spec.ts`, replace the test `'lets a draft be saved without a writer or category'` (the whole `it(...)` block) with:

```ts
  it('refuses to save a draft without a writer or category', async () => {
    await expectFieldError(
      payload.create({ collection: 'articles', data: article({ writers: [] }), draft: true }),
      'writers',
      /required/i,
    )
    await expectFieldError(
      payload.create({ collection: 'articles', data: article({ categories: [] }), draft: true }),
      'categories',
      /required/i,
    )
  })

  it('refuses a draft change that empties a required field', async () => {
    const draft = await payload.create({ collection: 'articles', data: article(), draft: true })
    await expectFieldError(
      payload.update({ collection: 'articles', id: draft.id, data: { summary: '' }, draft: true }),
      'summary',
      /required/i,
    )
  })

  it('still lets other lists save incomplete drafts', async () => {
    const draft = await payload.create({ collection: 'writers', data: { name: `Draft writer ${Math.random()}` }, draft: true })
    expect(draft._status).toBe('draft')
  })
```

(`shortBio` is required on writers, so the last test proves the change is limited to articles. If the `writers` create call doesn't type-check because `shortBio` is required in the generated type, cast the data as the existing tests do elsewhere: `data: { name: ... } as Parameters<Payload['create']>[0]['data']`, or add `// @ts-expect-error: a draft may leave required fields empty` on the `data` line.)

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/int/articles.int.spec.ts`
Expected: FAIL on `'refuses to save a draft without a writer or category'` and `'refuses a draft change that empties a required field'` (the saves succeed today). The other tests, including the scheduled publish test, pass.

- [ ] **Step 3: Switch on draft validation for articles**

In `src/collections/Articles.ts`, change:

```ts
  versions: {
    drafts: { schedulePublish: true },
    maxPerDoc: 50,
  },
```

to:

```ts
  versions: {
    // Drafts are checked like a publish, so a scheduled publish can never fail on a missing field.
    drafts: { schedulePublish: true, validate: true },
    maxPerDoc: 50,
  },
```

and add a `description` to the `admin` block (after `defaultColumns`), so staff know why a draft save is refused:

```ts
    description:
      'An article can only be saved, even as a draft, once its title, summary, body, writer, category and publication date are filled in. That way a scheduled publish never fails.',
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run tests/int/articles.int.spec.ts`
Expected: PASS, including the existing `'publishes a scheduled article when its job runs, not before'`.

- [ ] **Step 5: Run the whole suite, lint and types**

Run: `npm test`
Expected: PASS. In particular `tests/int/seed.int.spec.ts` (the seed's draft and scheduled articles are complete, so they still save) and `tests/int/deleteGuard.int.spec.ts` if Task 3 is merged.

Run: `npm run lint` and `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Look at it in the admin**

With the dev server on 3100 and the browser logged in, open `/admin/collections/articles/create`, type only a title, and click "Save Draft". Screenshot at 1440 × 900 and at 390 × 844 (full page) into `.screenshots/task4/`, and look at both.

Expected: the save is refused; the required fields show their errors (at 390 too, if Task 2 is merged into `dev` before this branch was created; if not, say so in the report). The collection description shows at the top of the list view (`/admin/collections/articles`); screenshot that at 390 as well.

- [ ] **Step 7: Update the spec**

In `docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md`, section 6.1, change the bullet

```markdown
- **Scheduled publishing:** articles only.
```

to

```markdown
- **Scheduled publishing:** articles only. Article drafts are validated like a publish (`drafts.validate`, decided 23 October 2026), so an article can only be saved once every required field is filled in, and a scheduled publish can't fail on a missing field. Other lists still save incomplete drafts.
```

- [ ] **Step 8: Commit**

```bash
git add src/collections/Articles.ts tests/int/articles.int.spec.ts docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md
git commit -m "Check article drafts like a publish, so a scheduled publish can't fail on a missing field"
```

---

### Task 5: Answer honeypot bots with a normal success, and save nothing

**Branch:** `fix/honeypot-silent-success`

**Files:**
- Modify: `src/hooks/honeypot.ts`
- Modify: `src/collections/forms/formCollection.ts`
- Modify: `tests/int/forms.int.spec.ts`
- Modify: `docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md` (section 6.7)

**Interfaces:**
- Consumes: `rest(method, path, { body?, token? })` from `tests/helpers/payload.ts` (added in Task 3).
- Produces:
  - `isSpam(data: Record<string, unknown> | null | undefined): boolean` in `src/hooks/honeypot.ts`, for B2's server code that saves manuscript submissions itself.
  - `createUnlessSpam(slug: CollectionSlug, singular: string): Endpoint` in `src/hooks/honeypot.ts`.

**Background:**
- Today `dropSpam` (a `beforeValidate` hook) throws a 400 "This form could not be sent." when the hidden `website` field is filled in. A hook can't make a create succeed without saving, so the change happens at the endpoint.
- Payload matches a collection's own `endpoints` before its built-in ones, so an endpoint `{ path: '/', method: 'post' }` on a form collection replaces Payload's `POST /api/<form>` for that collection. The admin's "Create new" for these lists uses the same address, so the replacement must create real entries exactly as Payload would.
- Payload's built-in endpoints read the request body for themselves (`addDataAndFileToRequest`); a custom endpoint must call it. The body can only be read once, so the custom endpoint can't hand over to Payload's built-in handler afterwards. Instead it creates the entry with `req.payload.create({ ..., overrideAccess: false, req })`, which applies the visitor's access rules and every hook, as the built-in route does.
- Only the four public forms get the endpoint. Manuscript submissions are created only by the site's own server code (`create: isStaff`); a visitor posting there keeps getting Payload's 403, honeypot or not.
- `dropSpam` stays as a backstop, so server code that saves an entry directly through the Local API can never store one with the hidden field filled in.

- [ ] **Step 1: Write the failing tests**

In `tests/int/forms.int.spec.ts`, add `rest` to the helpers import:

```ts
import { createStaff, expectFieldError, getTestPayload, rest } from '../helpers/payload'
```

Rename the test `'refuses an entry that fills in the hidden field'` to `'never stores an entry with the hidden field filled in when server code saves it directly'` (its body stays the same: the Local API still refuses). Rename `'refuses a non-string honeypot value'` to `'treats a non-string hidden field value as spam when server code saves it directly'` (body unchanged).

Then add this `describe` block after the `'visitors sending forms'` block:

```ts
describe('the hidden spam field, for forms sent over the website', () => {
  const post = (slug: string, data: Record<string, unknown>) => rest('POST', `/${slug}`, { body: data })

  it('answers a bot with the usual success, but saves nothing and sends no alert', async () => {
    const send = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    const before = await payload.count({ collection: 'contact-messages' })
    const res = await post('contact-messages', contact({ website: 'http://spam.example' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.message).toBe('Contact message successfully created.')
    expect(body.doc).toMatchObject({ name: 'Ada Visitor', email: 'ada@example.com', status: 'new' })
    expect(body.doc).not.toHaveProperty('website')
    const after = await payload.count({ collection: 'contact-messages' })
    expect(after.totalDocs).toBe(before.totalDocs)
    expect(send).not.toHaveBeenCalled()
    send.mockRestore()
  })

  it('treats any value in the hidden field as spam, not only text', async () => {
    const before = await payload.count({ collection: 'contact-messages' })
    const res = await post('contact-messages', contact({ website: 1 }))
    expect(res.status).toBe(201)
    expect((await payload.count({ collection: 'contact-messages' })).totalDocs).toBe(before.totalDocs)
  })

  it('saves a real entry sent to the same address, and alerts staff', async () => {
    const send = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    const res = await post('contact-messages', contact({ message: 'A real visitor.', website: '' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.message).toBe('Contact message successfully created.')
    const stored = await payload.findByID({ collection: 'contact-messages', id: body.doc.id })
    expect(stored.message).toBe('A real visitor.')
    expect(send).toHaveBeenCalledTimes(1)
    send.mockRestore()
  })

  it('keeps the visitor rules for real entries: status starts New, staff notes are dropped', async () => {
    const res = await post('contact-messages', contact({ status: 'done', staffNotes: 'Planted note' }))
    const body = await res.json()
    const stored = await payload.findByID({ collection: 'contact-messages', id: body.doc.id })
    expect(stored.status).toBe('new')
    expect(stored.staffNotes ?? null).toBeNull()
  })

  it('still sends back field errors for a real entry', async () => {
    const res = await post('contact-messages', contact({ message: 'a'.repeat(5001) }))
    expect(res.status).toBe(400)
  })

  it('does the same on the other public forms', async () => {
    const before = await payload.count({ collection: 'partnership-enquiries' })
    const res = await post('partnership-enquiries', {
      name: 'Bot',
      organisation: 'Spam Ltd',
      email: 'bot@example.com',
      partnershipType: 'events',
      message: 'Buy now',
      website: 'http://spam.example',
    })
    expect(res.status).toBe(201)
    expect((await res.json()).message).toBe('Partnership enquiry successfully created.')
    expect((await payload.count({ collection: 'partnership-enquiries' })).totalDocs).toBe(before.totalDocs)
  })

  it('gives no pretend success where visitors may not post at all', async () => {
    const res = await post('manuscript-submissions', { name: 'Bot', website: 'http://spam.example' })
    expect(res.status).toBe(403)
  })
})
```

Check the singular label of partnership enquiries in `src/collections/forms/PartnershipEnquiries.ts` and use it in the expected message (Payload's message is `<singular> successfully created.`).

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/int/forms.int.spec.ts`
Expected: FAIL. The spam tests get 400 instead of 201. The real-entry tests may already pass (Payload's own route creates entries today); that's expected.

- [ ] **Step 3: Rewrite `src/hooks/honeypot.ts`**

```ts
import {
  addDataAndFileToRequest,
  APIError,
  type CollectionBeforeValidateHook,
  type CollectionSlug,
  type Endpoint,
  type Field,
} from 'payload'

/** Hidden from people, so only bots fill it in. Never stored. */
export const HONEYPOT_FIELD = 'website'

export const honeypotField: Field = {
  name: HONEYPOT_FIELD,
  type: 'text',
  virtual: true,
  admin: { hidden: true },
}

/** True when the hidden field has anything in it, which only a bot does. */
export function isSpam(data: Record<string, unknown> | null | undefined): boolean {
  const value = data?.[HONEYPOT_FIELD]
  return value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')
}

/**
 * A backstop for server code that saves an entry directly (the Local API), which doesn't go
 * through the endpoint below: an entry with the hidden field filled in is never stored. Server
 * code should check `isSpam` first and answer the visitor as if the entry had been sent.
 */
export const dropSpam: CollectionBeforeValidateHook = ({ data, operation }) => {
  if (operation === 'create' && isSpam(data)) {
    throw new APIError('This form could not be sent.', 400, null, true)
  }
  return data
}

/**
 * Takes the place of Payload's own `POST /api/<form>` on a public form. A bot that fills in the
 * hidden field gets the same success response a person would, so it has no reason to try
 * again, but nothing is saved and no alert is sent. Anything else is created as Payload's own
 * route would: with the sender's access, and every hook (visitor entries start as New, staff are
 * alerted). The body can only be read once, so this creates the entry itself rather than
 * handing over to Payload's route. Form entries have no drafts or locales, so the query options
 * that route reads don't apply.
 */
export function createUnlessSpam(slug: CollectionSlug, singular: string): Endpoint {
  return {
    path: '/',
    method: 'post',
    handler: async (req) => {
      await addDataAndFileToRequest(req)
      const data = (req.data ?? {}) as Record<string, unknown>
      const message = req.t('general:successfullyCreated', { label: singular })
      if (isSpam(data)) {
        const echo = { ...data }
        delete echo[HONEYPOT_FIELD]
        const now = new Date().toISOString()
        return Response.json({ doc: { ...echo, status: 'new', createdAt: now, updatedAt: now }, message }, { status: 201 })
      }
      const doc = await req.payload.create({ collection: slug, data, depth: 0, overrideAccess: false, req })
      return Response.json({ doc, message }, { status: 201 })
    },
  }
}
```

If TypeScript rejects `data` in `req.payload.create` for a dynamic `slug`, cast it at that call only, to `Parameters<typeof req.payload.create>[0]['data']`, and say so in the report. Don't cast to `never` or `any`.

- [ ] **Step 4: Give the public forms the endpoint**

In `src/collections/forms/formCollection.ts`, change the honeypot import to:

```ts
import { createUnlessSpam, dropSpam, honeypotField } from '@/hooks/honeypot'
```

Change the factory's doc comment and return value. Above `export function formCollection`, the comment becomes:

```ts
/**
 * An Inbox list for one website form: visitors create, staff read and update, admins delete.
 * A public form (created by anyone) answers spam with a pretend success; see `createUnlessSpam`.
 */
```

and in the returned config, add after `access: { ... },`:

```ts
    // Only public forms: where visitors can't post at all, Payload's own route keeps refusing them.
    endpoints: create === anyone ? [createUnlessSpam(slug as CollectionSlug, singular)] : [],
```

adding `type CollectionSlug` to the existing `payload` type import at the top of the file.

- [ ] **Step 5: Run the tests to see them pass**

Run: `npx vitest run tests/int/forms.int.spec.ts`
Expected: PASS (all, including the existing Local API tests and the manuscript submission tests).

- [ ] **Step 6: Run the whole suite, lint and types**

Run: `npm test`
Expected: PASS.

Run: `npm run lint` and `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Check that staff can still add an entry in the admin**

The admin's "Create new" on these lists now goes through the new endpoint. With the dev server on 3100 and the browser logged in, open `/admin/collections/contact-messages/create`, fill in name, email and message, and click Save. Screenshot at 1440 × 900 into `.screenshots/task5/` and look at it.

Expected: the entry saves and the page moves to the new entry's edit view, as before. Then delete that entry from its edit view (admins may) so the development inbox stays as seeded.

- [ ] **Step 8: Update the spec**

In `docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md`, section 6.7, replace the bullet that starts `- Every form carries a hidden honeypot field` with:

```markdown
- Every form carries a hidden honeypot field (left empty by people, filled in by spam bots). A bot that fills it in gets the normal success response, but nothing is saved and no alert is sent (changed 23 October 2026; it used to get a 400 error, which tells a bot to try again). The four public forms do this through their own `POST /api/<form>` endpoint. Server code that saves entries directly, such as the manuscript form in B2, must check the field itself with `isSpam` and answer the same way; the collection still refuses to store such an entry as a backstop. Stronger spam protection and rate limits are decided with the frontend forms.
```

- [ ] **Step 9: Commit**

```bash
git add src/hooks/honeypot.ts src/collections/forms/formCollection.ts tests/int/forms.int.spec.ts docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md
git commit -m "Answer spam bots on the public forms with a normal success, and save nothing"
```

---

## After all tasks (controller)

- [ ] Final whole-branch review of `dev` against the commit before this plan's first merge.
- [ ] Stop the dev server, then run on `dev`: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`. All must pass.
- [ ] Close Playwright. Stop Docker with `docker compose stop`.
- [ ] Update the memory file `b1-done-open-decisions.md`: the four decisions are done, and record what B2 must do (`isSpam` in the manuscript server code).
