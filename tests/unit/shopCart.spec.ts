import { describe, expect, it } from 'vitest'

import { parcelWeightGrams, parseCart, type PricedLine, priceOrder } from '@/shop/cart'

const line = (overrides: Record<string, unknown> = {}) => ({ collection: 'books', id: 1, option: 'fmt-1', quantity: 2, ...overrides })

describe('parseCart', () => {
  it('reads a well-formed cart, numbers and all', () => {
    expect(parseCart([line(), line({ collection: 'merch', id: '7', option: null, quantity: '1' })])).toEqual([
      { collection: 'books', id: 1, option: 'fmt-1', quantity: 2 },
      { collection: 'merch', id: 7, option: null, quantity: 1 },
    ])
  })

  it('refuses an empty or oversized cart', () => {
    expect(() => parseCart([])).toThrow('The cart is empty.')
    expect(() => parseCart('nope')).toThrow('The cart is empty.')
    expect(() => parseCart(Array.from({ length: 21 }, (_, index) => line({ id: index + 1 })))).toThrow('up to 20 different items')
  })

  it('refuses quantities outside 1 to 10', () => {
    for (const quantity of [0, 11, 1.5, 'two']) {
      expect(() => parseCart([line({ quantity })])).toThrow('up to 10 of each item')
    }
  })

  it('refuses lines it cannot read, and the same line twice', () => {
    expect(() => parseCart([line({ collection: 'users' })])).toThrow('could not be read')
    expect(() => parseCart([line({ id: -1 })])).toThrow('could not be read')
    expect(() => parseCart([line({ option: 'x'.repeat(65) })])).toThrow('could not be read')
    expect(() => parseCart([line(), line()])).toThrow('could not be read')
  })
})

describe('priceOrder', () => {
  const book: PricedLine = { collection: 'books', id: 1, optionId: 'a', optionName: 'Paperback', title: 'Book', unitPriceKobo: 1_250_000, weightGrams: 420, quantity: 2 }
  const shirt: PricedLine = { collection: 'merch', id: 2, optionId: 'b', optionName: 'M', title: 'Shirt', unitPriceKobo: 1_500_000, weightGrams: 250, quantity: 1 }

  it('adds items and delivery in kobo', () => {
    expect(priceOrder([book, shirt], 320_000)).toEqual({ itemsKobo: 4_000_000, deliveryKobo: 320_000, totalKobo: 4_320_000 })
  })

  it("takes B3's member discount off books only", () => {
    expect(priceOrder([book, shirt], 0, { booksDiscountPercent: 20 }).itemsKobo).toBe(2 * 1_000_000 + 1_500_000)
  })
})

describe('parcelWeightGrams', () => {
  it('adds every copy and the box', () => {
    expect(parcelWeightGrams([{ weightGrams: 420, quantity: 2 }, { weightGrams: 250, quantity: 1 }], 100)).toBe(1190)
  })
})
