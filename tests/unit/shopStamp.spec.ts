import { describe, expect, it } from 'vitest'

import { readQuote, signQuote, STAMP_LIFE_MS, type StampedQuote } from '@/shop/stamp'

const secret = 's'.repeat(40)
const quote: StampedQuote = {
  method: 'courier',
  carrierName: 'GIG Logistics',
  carrierSlug: 'gig',
  estimate: '2 to 3 days',
  priceKobo: 335_000,
  state: 'lagos',
  weightGrams: 1190,
  area: null,
  issuedAt: 1_000_000,
}

describe('quote stamps', () => {
  it('give back the quote they were made from', () => {
    expect(readQuote(signQuote(quote, secret), secret, quote.issuedAt + 1000)).toEqual(quote)
  })

  it('refuse a changed quote, another secret or junk', () => {
    const stamp = signQuote(quote, secret)
    const [, signature] = stamp.split('.')
    const cheaper = Buffer.from(JSON.stringify({ ...quote, priceKobo: 1 })).toString('base64url')
    expect(readQuote(`${cheaper}.${signature}`, secret, quote.issuedAt)).toBeNull()
    expect(readQuote(stamp, 't'.repeat(40), quote.issuedAt)).toBeNull()
    expect(readQuote('not-a-stamp', secret, quote.issuedAt)).toBeNull()
    expect(readQuote(`${stamp}.extra`, secret, quote.issuedAt)).toBeNull()
    expect(readQuote(undefined, secret, quote.issuedAt)).toBeNull()
  })

  it('lapse after 30 minutes', () => {
    const stamp = signQuote(quote, secret)
    expect(readQuote(stamp, secret, quote.issuedAt + STAMP_LIFE_MS)).toEqual(quote)
    expect(readQuote(stamp, secret, quote.issuedAt + STAMP_LIFE_MS + 1)).toBeNull()
  })

  it('refuse a stamp longer than any real one, before any hashing', () => {
    const long = signQuote({ ...quote, carrierName: 'x'.repeat(2100) }, secret)
    expect(readQuote(long, secret, quote.issuedAt)).toBeNull()
  })

  it('refuse one dated well in the future', () => {
    expect(readQuote(signQuote(quote, secret), secret, quote.issuedAt - 120_000)).toBeNull()
  })
})
