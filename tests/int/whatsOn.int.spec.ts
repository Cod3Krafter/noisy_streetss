import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { visibleCareersWhere } from '@/rules/careers'
import { upcomingEventsWhere } from '@/rules/events'
import { richText } from '@/seed/richText'

import { expectFieldError, getTestPayload, resetCollections } from '../helpers/payload'

const DAY = 24 * 60 * 60 * 1000
const fromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
  // Test files run in any order, and the seed test fills these collections, so start them empty.
  await resetCollections(payload, ['events', 'careers'])
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
    await expectFieldError(
      payload.create({
        collection: 'events',
        data: { title: 'Backwards', startsAt: fromNow(5), endsAt: fromNow(4), _status: 'published' },
      }),
      'endsAt',
      /after the start/,
    )
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
    await expectFieldError(
      payload.create({ collection: 'book-club-sessions', data: { startsAt: fromNow(7), _status: 'published' } }),
      'title',
      /book or a title/,
    )
    const session = await payload.create({
      collection: 'book-club-sessions',
      data: { title: 'Poetry night', startsAt: fromNow(7), _status: 'published' },
    })
    expect(session.title).toBe('Poetry night')
  })
})
