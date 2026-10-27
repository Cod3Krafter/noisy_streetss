import { describe, expect, it } from 'vitest'

import { flatPriceFor, overlappingStatesProblem } from '@/shop/flatPrice'
import { formatNaira, toKobo, toNaira } from '@/shop/money'
import { isNigerianState, NIGERIAN_STATES, stateLabel, terminalStateName } from '@/shop/states'

describe('money', () => {
  it('works in whole kobo', () => {
    expect(toKobo(3200)).toBe(320000)
    expect(toKobo(36.555)).toBe(3656)
    expect(toNaira(320050)).toBe(3200.5)
  })

  it('writes naira for people', () => {
    expect(formatNaira(320000)).toBe('₦3,200')
    expect(formatNaira(320050)).toBe('₦3,200.50')
    expect(formatNaira(0)).toBe('₦0')
  })
})

describe('states', () => {
  it('lists the 36 states and FCT once each', () => {
    expect(NIGERIAN_STATES).toHaveLength(37)
    expect(new Set(NIGERIAN_STATES.map((state) => state.value)).size).toBe(37)
    expect(isNigerianState('lagos')).toBe(true)
    expect(isNigerianState('fct')).toBe(true)
    expect(isNigerianState('Lagos')).toBe(false)
    expect(isNigerianState(undefined)).toBe(false)
  })

  it('names a state for people and for Terminal', () => {
    expect(stateLabel('akwa-ibom')).toBe('Akwa Ibom')
    expect(stateLabel('fct')).toBe('Federal Capital Territory')
    // Pending check P4: Terminal's own names are assumed to be these labels.
    expect(terminalStateName('fct')).toBe('Federal Capital Territory')
  })
})

describe('flat delivery prices', () => {
  const areas = [
    { areaName: 'Lagos', states: ['lagos'], priceNGN: 2500 },
    { areaName: 'South West', states: ['ogun', 'oyo'], priceNGN: 4000 },
  ]

  it("uses the area that lists the customer's state", () => {
    expect(flatPriceFor(areas, 5000, 'oyo')).toEqual({ priceKobo: 400000, area: 'South West' })
  })

  it('falls back to the everywhere-else price', () => {
    expect(flatPriceFor(areas, 5000, 'kano')).toEqual({ priceKobo: 500000, area: 'Everywhere else' })
  })

  it('has no price when nothing matches and no fallback is set', () => {
    expect(flatPriceFor(areas, null, 'kano')).toBeNull()
  })

  it('names a state listed in two areas', () => {
    expect(overlappingStatesProblem(areas)).toBeNull()
    expect(overlappingStatesProblem([...areas, { areaName: 'Ogun only', states: ['ogun'] }])).toBe(
      'Ogun is in both "South West" and "Ogun only". A state can only be in one area.',
    )
  })
})
