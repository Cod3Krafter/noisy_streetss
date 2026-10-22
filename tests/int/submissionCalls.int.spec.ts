import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { openCallsWhere } from '@/rules/submissionCalls'
import { richText } from '@/seed/richText'

import { expectFieldError, getTestPayload } from '../helpers/payload'

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
    await expectFieldError(
      payload.create({ collection: 'submission-calls', data: call('Backwards call', 10, 5) }),
      'closesAt',
      /after the opening/,
    )
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
