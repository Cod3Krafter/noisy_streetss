import { describe, expect, it } from 'vitest'

import { appendHistory, keepsHistory } from '@/shop/history'
import { isForwardMove, ORDER_STATUSES, orderNumberFor, statusLabel } from '@/shop/statuses'

describe('order statuses', () => {
  it('are the eight agreed ones', () => {
    expect(ORDER_STATUSES.map((status) => status.value)).toEqual([
      'awaiting-payment',
      'expired',
      'paid',
      'courier-booked',
      'in-transit',
      'delivered',
      'returned',
      'refunded',
    ])
    expect(statusLabel('courier-booked')).toBe('Courier booked')
  })

  it('only let delivery updates move an order forward', () => {
    expect(isForwardMove('courier-booked', 'in-transit')).toBe(true)
    expect(isForwardMove('courier-booked', 'delivered')).toBe(true)
    expect(isForwardMove('in-transit', 'returned')).toBe(true)
    expect(isForwardMove('delivered', 'in-transit')).toBe(false)
    expect(isForwardMove('delivered', 'returned')).toBe(false)
    expect(isForwardMove('in-transit', 'in-transit')).toBe(false)
    expect(isForwardMove('paid', 'in-transit')).toBe(false)
    expect(isForwardMove('refunded', 'delivered')).toBe(false)
  })

  it('numbers orders from 1001', () => {
    expect(orderNumberFor(1)).toBe('NS-1001')
    expect(orderNumberFor(42)).toBe('NS-1042')
  })
})

describe('order history', () => {
  const first = { id: 'a', at: '2026-10-27T10:00:00.000Z', from: null, to: 'awaiting-payment', by: 'Checkout', note: null }

  it('adds an entry at the end, stamped with the time', () => {
    const rows = appendHistory([first], { from: 'awaiting-payment', to: 'paid', by: 'Payment' })
    expect(rows).toHaveLength(2)
    expect(rows[0]).toBe(first)
    expect(rows[1]).toMatchObject({ from: 'awaiting-payment', to: 'paid', by: 'Payment', note: null })
    expect(Number.isNaN(Date.parse(rows[1].at))).toBe(false)
  })

  it('accepts additions and refuses edits and removals', () => {
    const later = appendHistory([first], { to: 'paid', by: 'Payment' })
    expect(keepsHistory([first], later)).toBe(true)
    expect(keepsHistory([first], [first])).toBe(true)
    expect(keepsHistory([first], [])).toBe(false)
    expect(keepsHistory([first], [{ ...first, by: 'Someone else' }])).toBe(false)
    expect(keepsHistory([first], [{ ...first, at: '2026-10-27T10:00:00Z' }])).toBe(true)
  })
})
