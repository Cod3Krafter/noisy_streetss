import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Book } from '@/payload-types'
import { findActiveAnnouncements } from '@/rules/announcements'
import { richText } from '@/seed/richText'

import { createImage, createWriter, expectFieldError, getTestPayload } from '../helpers/payload'

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
    await expectFieldError(
      payload.create({ collection: 'popup-campaigns', data: campaign('Clashing launch', 5, 15) }),
      'startsAt',
      /November launch/,
    )
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
    await expectFieldError(
      payload.create({ collection: 'popup-campaigns', data: campaign('Backwards', 60, 50) }),
      'endsAt',
      /after the start/,
    )
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
