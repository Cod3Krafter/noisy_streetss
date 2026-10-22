import { describe, expect, it } from 'vitest'

import { datesOverlap } from '@/rules/popups'

const d = (day: number) => `2026-11-${String(day).padStart(2, '0')}T00:00:00.000Z`

describe('datesOverlap', () => {
  it('spots overlapping ranges', () => {
    expect(datesOverlap(d(1), d(10), d(5), d(15))).toBe(true)
    expect(datesOverlap(d(5), d(15), d(1), d(10))).toBe(true)
    expect(datesOverlap(d(1), d(30), d(5), d(6))).toBe(true)
  })

  it('lets ranges touch end to start', () => {
    expect(datesOverlap(d(1), d(10), d(10), d(20))).toBe(false)
  })

  it('ignores separate ranges', () => {
    expect(datesOverlap(d(1), d(5), d(6), d(9))).toBe(false)
  })
})
