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
