import type { CollectionSlug, Payload } from 'payload'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { activeAnnouncementsWhere } from '@/rules/announcements'
import { isCareerVisible } from '@/rules/careers'
import { isUpcomingEvent } from '@/rules/events'
import { callStatus } from '@/rules/submissionCalls'
import { seed, wipe } from '@/seed'

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

describe('a fresh seed', () => {
  it('clears anything typed by hand into a page record or the settings', async () => {
    await payload.updateGlobal({ slug: 'page-home', data: { meta: { title: 'Typed by hand', description: 'Also typed by hand' } } })
    await payload.updateGlobal({ slug: 'shop-settings', data: { pickupAddress: { line1: 'Typed by hand' } } })
    await seed(payload)
    const home = await payload.findGlobal({ slug: 'page-home' })
    expect(home.meta?.title ?? null).toBeNull()
    expect(home.meta?.description ?? null).toBeNull()
    const shop = await payload.findGlobal({ slug: 'shop-settings' })
    expect(shop.pickupAddress?.line1).toBe('Dummy street')
    const site = await payload.findGlobal({ slug: 'site-settings' })
    expect(site.formAlertEmail).toBe('inbox@noisystreetss.test')
    expect((await payload.count({ collection: 'pages' })).totalDocs).toBe(5)
    expect((await payload.count({ collection: 'books' })).totalDocs).toBe(6)
  }, 300_000)
})

describe('wipe', () => {
  const saved = process.env.DATABASE_URI
  afterEach(() => {
    process.env.DATABASE_URI = saved
  })

  it('refuses when the database is not on this machine, before touching anything', async () => {
    process.env.DATABASE_URI = 'postgresql://user:pass@db.abcdefgh.supabase.co:5432/postgres'
    const before = (await payload.count({ collection: 'books' })).totalDocs
    await expect(wipe(payload)).rejects.toThrow(/local database/)
    process.env.DATABASE_URI = saved
    expect((await payload.count({ collection: 'books' })).totalDocs).toBe(before)
  })
})
