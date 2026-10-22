import { describe, expect, it } from 'vitest'

import { ratesProblem } from '@/rules/studio'

describe('ratesProblem', () => {
  it('accepts any one rate', () => {
    expect(ratesProblem(15000, null, undefined)).toBeNull()
    expect(ratesProblem(null, 50000, null)).toBeNull()
    expect(ratesProblem(undefined, undefined, 90000)).toBeNull()
  })

  it('needs at least one', () => {
    expect(ratesProblem(null, undefined, null)).toMatch(/at least one rate/)
  })
})
