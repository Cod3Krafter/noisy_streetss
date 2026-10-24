import fs from 'node:fs'
import path from 'node:path'
import type { GlobalSlug, Payload } from 'payload'

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
import { assertSafeToSeed } from './guard'
import { emptyFieldData } from './resetGlobals'
import { richText } from './richText'
import { samplePdf } from './samplePdf'

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const fromNow = (ms: number) => new Date(Date.now() + ms).toISOString()
const PHOTO_DIR = path.resolve(process.cwd(), 'public/images/unsplash')
/** Seeded form entries must not email staff. */
const quiet = { skipFormAlert: true }

/** True only for a folder strictly inside `root`: never the root itself, a parent, or elsewhere. */
export function isInsideFolder(dir: string, root: string = process.cwd()): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(dir))
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}

/**
 * The only folders the seed may empty: the project's own media and manuscripts folders, and the
 * folders the tests use inside .test-uploads. A wrong setting (say MEDIA_DIR pointing at src)
 * must stop the seed rather than delete real files.
 */
export function isSeedUploadFolder(dir: string, root: string = process.cwd()): boolean {
  const resolved = path.resolve(dir)
  const base = path.resolve(root)
  if (resolved === path.join(base, 'media') || resolved === path.join(base, 'manuscripts')) return true
  return isInsideFolder(resolved, path.join(base, '.test-uploads'))
}

/**
 * Empties every collection except the migrations record, and the local upload folders. The
 * settings and page records are rewritten in full by `seed`, see `writeGlobal`. Refuses outright
 * unless the environment points at a local database.
 */
export async function wipe(payload: Payload): Promise<void> {
  assertSafeToSeed(process.env)
  // Check every upload folder before anything is deleted, so an unsafe setting stops the seed cold.
  const uploadDirs = payload.config.collections.flatMap((collection) =>
    collection.upload && collection.upload.staticDir ? [collection.upload.staticDir] : [],
  )
  for (const dir of uploadDirs) {
    if (!isSeedUploadFolder(dir)) {
      throw new Error(`Refusing to empty ${dir}: only the media and manuscripts folders, or folders inside .test-uploads, may be emptied.`)
    }
  }

  // Reverse config order: lists that point at others (submissions at calls, popups at books)
  // are emptied before the records they point at, so no foreign key refuses the delete.
  for (const collection of [...payload.config.collections].reverse()) {
    if (collection.slug === 'payload-migrations') continue
    await payload.db.deleteMany({ collection: collection.slug, where: {} })
    if (collection.versions) await payload.db.deleteVersions({ collection: collection.slug, where: {} })
  }
  for (const dir of uploadDirs) fs.rmSync(dir, { recursive: true, force: true })
}

/**
 * Writes a settings or page record so it holds exactly `data`. `updateGlobal` merges into what is
 * stored, so every field the seed does not set is emptied first (from the global's own config).
 */
async function writeGlobal(payload: Payload, slug: GlobalSlug, data: Record<string, unknown> = {}): Promise<void> {
  const global = payload.config.globals.find((candidate) => candidate.slug === slug)
  if (!global) throw new Error(`Unknown global ${slug}`)
  // An undefined value would leave the stored one alone, so it counts as not set.
  const set = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))
  const full = { ...emptyFieldData(global.fields), ...set }
  await payload.updateGlobal({ slug, data: full as Parameters<Payload['updateGlobal']>[0]['data'] })
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
          // Payload's job input is typed as a number, but its handler expects the id as a string.
          doc: { relationTo: 'articles', value: String(draft.id) as unknown as number },
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
  const written = new Set<string>()
  const write = async (slug: GlobalSlug, data: Record<string, unknown>) => {
    await writeGlobal(payload, slug, data)
    written.add(slug)
  }
  await write('site-settings', {
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
  })
  await write('shop-settings', {
    pickupAddress: { name: 'Dummy Dispatch', phone: '+234 800 000 0001', line1: 'Dummy street', city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
    flatDeliveryPrices: [
      { areaName: 'Lagos Mainland', priceNGN: 2500 },
      { areaName: 'Lagos Island', priceNGN: 3000 },
      { areaName: 'Rest of Nigeria', priceNGN: 5000 },
    ],
    memberDiscountPercent: 20,
    unpaidOrderExpiryMinutes: 30,
    orderAlertEmail: 'orders@noisystreetss.test',
  })
  for (const [slug, copy] of Object.entries(PAGE_COPY)) {
    await write(slug as GlobalSlug, {
      heading: copy.heading,
      intro: richText(copy.intro),
      heroImage: copy.heroImage ? photos[copy.heroImage] : undefined,
      ...(slug === 'page-submissions'
        ? { guidelines: richText('Dummy text: the general submission guidelines go here.') }
        : {}),
    })
  }
  // Any record the seed has no copy for is reset too, so nothing typed by hand survives.
  for (const global of payload.config.globals) {
    if (!written.has(global.slug)) await writeGlobal(payload, global.slug as GlobalSlug)
  }

  // Form entries, two per form. Passed as the admin so statuses and notes are kept.
  const asAdmin = { user: admin, context: quiet }
  const contact = [
    { name: 'Ada Visitor', email: 'ada@example.com', subject: 'Stockists', message: 'Dummy text: where can I buy your books?' },
    { name: 'Bayo Reader', email: 'bayo@example.com', message: 'Dummy text: loved the last reading.', status: 'in-progress' as const, staffNotes: 'Replying this week.' },
  ]
  for (const data of contact) await payload.create({ collection: 'contact-messages', data: { status: 'new' as const, ...data }, ...asAdmin })

  const partnerships = [
    { name: 'Chioma', organisation: 'Dummy Brand Ltd', email: 'chioma@example.com', partnershipType: 'sponsorship' as const, message: 'Dummy text: sponsoring the prize.' },
    { name: 'Dayo', organisation: 'Dummy Radio', email: 'dayo@example.com', partnershipType: 'media' as const, message: 'Dummy text: a radio series.' },
  ]
  for (const data of partnerships) await payload.create({ collection: 'partnership-enquiries', data: { status: 'new' as const, ...data }, ...asAdmin })

  const bookstores = [
    { storeName: 'Dummy Books Ikeja', contactName: 'Efe', email: 'efe@example.com', phone: '+234 800 000 0002', address: { line1: 'Dummy road', city: 'Ikeja', state: 'Lagos' }, storeType: 'independent' as const },
    { storeName: 'Dummy Online Books', contactName: 'Femi', email: 'femi@example.com', phone: '+234 800 000 0003', address: { line1: 'Dummy close', city: 'Abuja', state: 'FCT' }, storeType: 'online' as const, websiteOrSocial: 'https://example.com/shop' },
  ]
  for (const data of bookstores) await payload.create({ collection: 'bookstore-applications', data: { status: 'new' as const, ...data }, ...asAdmin })

  const advisory = [
    { name: 'Gbenga', email: 'gbenga@example.com', needs: 'Dummy text: help publishing a memoir.' },
    { name: 'Halima', organisation: 'Dummy Foundation', email: 'halima@example.com', needs: 'Dummy text: an annual report as a book.', status: 'done' as const },
  ]
  for (const data of advisory) await payload.create({ collection: 'advisory-enquiries', data: { status: 'new' as const, ...data }, ...asAdmin })

  for (const [index, writer] of ['Ifeoma Writer', 'Jide Writer'].entries()) {
    const file = await payload.create({ collection: 'manuscripts', data: {}, file: samplePdf(`sample-manuscript-${index + 1}.pdf`) })
    await payload.create({
      collection: 'manuscript-submissions',
      data: {
        status: 'new' as const,
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
