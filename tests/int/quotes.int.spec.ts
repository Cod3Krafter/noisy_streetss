import type { Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { Book } from '@/payload-types'
import { setShopClients } from '@/shop/clients'
import { readQuote } from '@/shop/stamp'

import { getTestPayload, rest } from '../helpers/payload'
import { createShopBook, setShopSettings } from '../helpers/shop'
import { type FakeTerminal, useFakeShopClients } from '../helpers/shopFakes'

let payload: Payload
let book: Book
let terminal: FakeTerminal

const cart = (quantity = 2) => [{ collection: 'books', id: book.id, option: book.formats?.[0]?.id, quantity }]
const ask = (body: unknown) => rest('POST', '/shop/quotes', { body })
const secret = () => process.env.QUOTE_STAMP_SECRET as string

beforeAll(async () => {
  payload = await getTestPayload()
  await setShopSettings(payload)
  book = await createShopBook(payload)
})

beforeEach(() => {
  terminal = useFakeShopClients().terminal
})

afterAll(() => setShopClients(null))

describe('POST /api/shop/quotes', () => {
  it('stamps live courier prices, cheapest first', async () => {
    const res = await ask({ items: cart(), address: { city: 'Wuse', state: 'fct' } })
    expect(res.status).toBe(200)
    const answer = (await res.json()) as { method: string; quotes: { carrierName: string; priceNGN: number; stamp: string }[] }
    expect(answer.method).toBe('courier')
    expect(answer.quotes.map((quote) => [quote.carrierName, quote.priceNGN])).toEqual([
      ['GIG Logistics', 3350],
      ['DHL', 7900],
    ])
    expect(readQuote(answer.quotes[0].stamp, secret())).toMatchObject({
      method: 'courier',
      carrierSlug: 'gig',
      priceKobo: 335_000,
      state: 'fct',
      weightGrams: 2 * 400 + 100,
    })
  })

  it('asks Terminal about the whole parcel, in the shop box, without a postcode', async () => {
    await ask({ items: cart(), address: { city: 'Wuse', state: 'fct' } })
    expect(terminal.quoteCalls[0]).toEqual({
      bookable: false,
      pickup: { city: 'Ikeja', state: 'lagos' },
      delivery: { city: 'Wuse', state: 'fct' },
      parcel: { packagingId: 'PA-TEST-BOX', items: [{ name: `${book.title} (Paperback)`, valueNGN: 10000, quantity: 2, weightGrams: 400 }] },
    })
  })

  it("falls back to the state's flat price when Terminal fails or has nothing", async () => {
    terminal.failQuotes = true
    const lagos = (await (await ask({ items: cart(), address: { city: 'Ikeja', state: 'lagos' } })).json()) as {
      method: string
      quotes: { carrierName: string; priceNGN: number; stamp: string }[]
    }
    expect(lagos.method).toBe('flat')
    expect(lagos.quotes).toHaveLength(1)
    expect(lagos.quotes[0]).toMatchObject({ carrierName: 'Standard delivery', priceNGN: 2500 })
    expect(readQuote(lagos.quotes[0].stamp, secret())).toMatchObject({ method: 'flat', area: 'Lagos', state: 'lagos' })

    terminal.failQuotes = false
    terminal.rates = []
    const kano = (await (await ask({ items: cart(), address: { city: 'Kano', state: 'kano' } })).json()) as { quotes: { priceNGN: number }[] }
    expect(kano.quotes[0].priceNGN).toBe(5000)
  })

  it('refuses a missing state, a missing city and a sold-out item', async () => {
    const noState = await ask({ items: cart(), address: { city: 'Ikeja' } })
    expect(noState.status).toBe(400)
    expect(JSON.stringify(await noState.json())).toContain('Pick the state for delivery.')
    expect((await ask({ items: cart(), address: { state: 'lagos' } })).status).toBe(400)
    const soldOut = await createShopBook(payload, { formats: [{ formatName: 'Paperback', priceNGN: 9000, inStock: false, weightGrams: 300 }] })
    const res = await ask({ items: [{ collection: 'books', id: soldOut.id, option: soldOut.formats?.[0]?.id, quantity: 1 }], address: { city: 'Ikeja', state: 'lagos' } })
    expect(res.status).toBe(400)
    expect(JSON.stringify(await res.json())).toContain('is sold out')
  })
})
