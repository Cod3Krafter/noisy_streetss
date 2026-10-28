import { describe, expect, it } from 'vitest'

import { normaliseNigerianPhone } from '@/shop/phone'

describe('normaliseNigerianPhone', () => {
  it('stores a Nigerian number as +234 and ten digits', () => {
    expect(normaliseNigerianPhone('0803 123 4567')).toBe('+2348031234567')
    expect(normaliseNigerianPhone('08031234567')).toBe('+2348031234567')
    expect(normaliseNigerianPhone('+234 803 123-4567')).toBe('+2348031234567')
    expect(normaliseNigerianPhone('(0803) 123 4567')).toBe('+2348031234567')
  })

  it('refuses anything else', () => {
    for (const value of ['803 123 4567', '0803123456', '+44 7700 900123', '+2348031234567890', '+234 0803 123 456', '+2340803123456', '', undefined, 8031234567]) {
      expect(normaliseNigerianPhone(value)).toBeNull()
    }
  })
})
