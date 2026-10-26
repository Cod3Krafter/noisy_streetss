import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { Book } from '@/payload-types'
import { findActiveAnnouncements } from '@/rules/announcements'
import { richText } from '@/seed/richText'

import { createImage, createWriter, expectFieldError, getTestPayload, resetCollections } from '../helpers/payload'

const DAY = 24 * 60 * 60 * 1000
const fromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()

let payload: Payload
let book: Book

beforeAll(async () => {
  payload = await getTestPayload()
  // Test files run in any order, and the seed test adds both of these, so start them empty.
  await resetCollections(payload, ['announcements', 'popup-campaigns'])
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
  // Campaigns may not overlap, so each test starts with none.
  beforeEach(async () => {
    await resetCollections(payload, ['popup-campaigns'])
  })

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

  it('names the field by its label in the error message', async () => {
    await payload.create({ collection: 'popup-campaigns', data: campaign('November launch', 1, 10) })
    await expect(payload.create({ collection: 'popup-campaigns', data: campaign('Clashing launch', 5, 15) })).rejects.toThrow(
      /The following field is invalid: Show from$/,
    )
  })

  it('allows a disabled overlapping campaign', async () => {
    await payload.create({ collection: 'popup-campaigns', data: campaign('November launch', 1, 10) })
    const disabled = await payload.create({ collection: 'popup-campaigns', data: campaign('Draft idea', 5, 15, false) })
    expect(disabled.enabled).toBe(false)
  })

  it('allows campaigns that only touch at an edge, and refuses one a second inside', async () => {
    // Fixed moments, so the edges are exactly equal. The real save runs the real overlap check.
    const fixed = (headline: string, startsAt: string, endsAt: string) => ({ book: book.id, headline, startsAt, endsAt, enabled: true })
    const start = '2031-03-10T09:00:00.000Z'
    const end = '2031-03-20T09:00:00.000Z'
    await payload.create({ collection: 'popup-campaigns', data: fixed('Edge A', start, end) })

    // Ends exactly as A starts, and starts exactly as A ends: both allowed.
    const before = await payload.create({ collection: 'popup-campaigns', data: fixed('Edge before', '2031-03-01T09:00:00.000Z', start) })
    const after = await payload.create({ collection: 'popup-campaigns', data: fixed('Edge after', end, '2031-03-30T09:00:00.000Z') })
    expect(before.headline).toBe('Edge before')
    expect(after.headline).toBe('Edge after')

    // One second inside at either edge: refused, naming a campaign it overlaps.
    await expectFieldError(
      payload.create({ collection: 'popup-campaigns', data: fixed('Starts early', '2031-03-20T08:59:59.000Z', '2031-03-21T09:00:00.000Z') }),
      'startsAt',
      /Edge/,
    )
    await expectFieldError(
      payload.create({ collection: 'popup-campaigns', data: fixed('Ends late', '2031-03-09T09:00:00.000Z', '2031-03-10T09:00:01.000Z') }),
      'startsAt',
      /Edge/,
    )
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

  it('refuses an edit that moves a campaign into another one', async () => {
    await payload.create({ collection: 'popup-campaigns', data: campaign('Fixed slot', 100, 110) })
    const mover = await payload.create({ collection: 'popup-campaigns', data: campaign('Mover', 120, 130) })
    await expectFieldError(
      payload.update({ collection: 'popup-campaigns', id: mover.id, data: { startsAt: fromNow(105), endsAt: fromNow(125) } }),
      'startsAt',
      /Fixed slot/,
    )
  })

  it('refuses switching a campaign back on when it would clash', async () => {
    await payload.create({ collection: 'popup-campaigns', data: campaign('Live one', 200, 210) })
    const off = await payload.create({ collection: 'popup-campaigns', data: campaign('Switched off', 205, 215, false) })
    await expectFieldError(
      payload.update({ collection: 'popup-campaigns', id: off.id, data: { enabled: true } }),
      'startsAt',
      /Live one/,
    )
  })

  it('does not let a bulk switch-on put two overlapping campaigns live', async () => {
    const a = await payload.create({ collection: 'popup-campaigns', data: campaign('Bulk A', 400, 410, false) })
    const b = await payload.create({ collection: 'popup-campaigns', data: campaign('Bulk B', 405, 415, false) })
    const result = await payload.update({
      collection: 'popup-campaigns',
      where: { id: { in: [a.id, b.id] } },
      data: { enabled: true },
    })
    expect(result.docs).toHaveLength(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toMatch(/These dates overlap with "Bulk [AB]"/)
    const live = await payload.find({ collection: 'popup-campaigns', where: { enabled: { equals: true } }, pagination: false })
    expect(live.docs).toHaveLength(1)
    // The refused campaign's message names the one that went live.
    expect(result.errors[0].message).toContain(`"${live.docs[0].headline}"`)
  })

  it('lets a bulk switch-on of campaigns that do not overlap succeed for both', async () => {
    const a = await payload.create({ collection: 'popup-campaigns', data: campaign('Apart A', 500, 510, false) })
    const b = await payload.create({ collection: 'popup-campaigns', data: campaign('Apart B', 510, 520, false) })
    const result = await payload.update({
      collection: 'popup-campaigns',
      where: { id: { in: [a.id, b.id] } },
      data: { enabled: true },
    })
    expect(result.errors).toHaveLength(0)
    expect(result.docs).toHaveLength(2)
  })

  it('reports a backwards range as a date error, not a clash', async () => {
    await payload.create({ collection: 'popup-campaigns', data: campaign('Neighbour', 300, 310) })
    await expectFieldError(
      payload.create({ collection: 'popup-campaigns', data: campaign('Backwards clash', 309, 301) }),
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
