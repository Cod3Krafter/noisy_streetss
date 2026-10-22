import { describe, expect, it } from 'vitest'

import { callStatus, closesAfterOpens, openCallsWhere } from '@/rules/submissionCalls'
import { endsAfterField } from '@/rules/time'

const opens = '2026-11-01T09:00:00.000Z'
const closes = '2026-11-30T23:00:00.000Z'

describe('callStatus', () => {
  it('is upcoming before it opens', () => {
    expect(callStatus(opens, closes, new Date('2026-10-31T09:00:00.000Z'))).toBe('upcoming')
  })

  it('is open from the opening moment until just before closing', () => {
    expect(callStatus(opens, closes, new Date(opens))).toBe('open')
    expect(callStatus(opens, closes, new Date('2026-11-30T22:59:59.999Z'))).toBe('open')
  })

  it('is closed from the closing moment', () => {
    expect(callStatus(opens, closes, new Date(closes))).toBe('closed')
  })

  it('has no status while a date is missing', () => {
    expect(callStatus(undefined, closes)).toBeNull()
    expect(callStatus(opens, null)).toBeNull()
  })
})

describe('closesAfterOpens', () => {
  it('needs the closing moment to be later', () => {
    expect(closesAfterOpens(opens, closes)).toBe(true)
    expect(closesAfterOpens(closes, opens)).toBe(false)
    expect(closesAfterOpens(opens, opens)).toBe(false)
  })

  it('passes while the opening date is still empty', () => {
    expect(closesAfterOpens(undefined, closes)).toBe(true)
  })
})

describe('endsAfterField', () => {
  const noSibling = { siblingData: {} }
  const withStart = { siblingData: { opensAt: opens } }

  it('refuses an empty value when it is required', () => {
    expect(endsAfterField('opensAt', 'Too early.', true)(undefined, noSibling)).toBe('This field is required.')
  })

  it('accepts an empty value when it is optional', () => {
    expect(endsAfterField('opensAt', 'Too early.')(null, noSibling)).toBe(true)
  })

  it('refuses a value that is not a date', () => {
    expect(endsAfterField('opensAt', 'Too early.', true)('not a date', withStart)).toBe('Enter a valid date and time.')
  })

  it('refuses an end before the sibling start', () => {
    expect(endsAfterField('opensAt', 'Too early.', true)('2026-10-31T09:00:00.000Z', withStart)).toBe('Too early.')
  })

  it('accepts a later end', () => {
    expect(endsAfterField('opensAt', 'Too early.', true)(closes, withStart)).toBe(true)
  })
})

describe('openCallsWhere', () => {
  it('builds the open-now query', () => {
    const now = new Date('2026-11-10T12:00:00.000Z')
    expect(openCallsWhere(now)).toEqual({
      and: [
        { opensAt: { less_than_equal: now.toISOString() } },
        { closesAt: { greater_than: now.toISOString() } },
      ],
    })
  })
})
