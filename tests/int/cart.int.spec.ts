import { createLocalReq, type Payload, type PayloadRequest } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { resolveCart } from '@/shop/cart'

import { getTestPayload } from '../helpers/payload'
import { createShopBook, createShopMerch } from '../helpers/shop'

let payload: Payload
let req: PayloadRequest

beforeAll(async () => {
  payload = await getTestPayload()
  req = await createLocalReq({}, payload)
})

describe('resolveCart', () => {
  it('prices a book format and a size from the database', async () => {
    const book = await createShopBook(payload, {
      formats: [
        { formatName: 'Paperback', priceNGN: 12500, inStock: true, weightGrams: 420 },
        { formatName: 'Hardback', priceNGN: 15000, inStock: true, weightGrams: 610 },
      ],
    })
    const shirt = await createShopMerch(payload, { options: [{ name: 'S' }, { name: 'M' }] })
    const lines = await resolveCart(req, [
      { collection: 'books', id: book.id, option: book.formats?.[1]?.id ?? null, quantity: 2 },
      { collection: 'merch', id: shirt.id, option: shirt.options?.[1]?.id ?? null, quantity: 1 },
    ])
    expect(lines).toEqual([
      { collection: 'books', id: book.id, optionId: book.formats?.[1]?.id, optionName: 'Hardback', title: book.title, unitPriceKobo: 1_500_000, weightGrams: 610, quantity: 2 },
      { collection: 'merch', id: shirt.id, optionId: shirt.options?.[1]?.id, optionName: 'M', title: shirt.title, unitPriceKobo: 1_500_000, weightGrams: 250, quantity: 1 },
    ])
  })

  it('prices one-size merch without an option', async () => {
    const tote = await createShopMerch(payload)
    const [line] = await resolveCart(req, [{ collection: 'merch', id: tote.id, option: null, quantity: 1 }])
    expect(line).toMatchObject({ optionId: null, optionName: null, unitPriceKobo: 1_500_000 })
  })

  it('refuses what is sold out, not for sale, unpublished, gone or missing its option', async () => {
    const soldOut = await createShopBook(payload, { formats: [{ formatName: 'Paperback', priceNGN: 9000, inStock: false, weightGrams: 300 }] })
    await expect(resolveCart(req, [{ collection: 'books', id: soldOut.id, option: soldOut.formats?.[0]?.id ?? null, quantity: 1 }])).rejects.toThrow(
      `"${soldOut.title}" (Paperback) is sold out.`,
    )
    const notForSale = await createShopBook(payload, { sellInShop: false })
    await expect(resolveCart(req, [{ collection: 'books', id: notForSale.id, option: notForSale.formats?.[0]?.id ?? null, quantity: 1 }])).rejects.toThrow(
      'is not for sale',
    )
    const draft = await createShopBook(payload, { publish: false })
    await expect(resolveCart(req, [{ collection: 'books', id: draft.id, option: draft.formats?.[0]?.id ?? null, quantity: 1 }])).rejects.toThrow(
      'no longer available',
    )
    await expect(resolveCart(req, [{ collection: 'books', id: 999999, option: null, quantity: 1 }])).rejects.toThrow('no longer available')
    const book = await createShopBook(payload)
    await expect(resolveCart(req, [{ collection: 'books', id: book.id, option: null, quantity: 1 }])).rejects.toThrow('Pick a format')
    const shirt = await createShopMerch(payload, { options: [{ name: 'L', inStock: false }] })
    await expect(resolveCart(req, [{ collection: 'merch', id: shirt.id, option: null, quantity: 1 }])).rejects.toThrow('Pick an option')
    await expect(resolveCart(req, [{ collection: 'merch', id: shirt.id, option: shirt.options?.[0]?.id ?? null, quantity: 1 }])).rejects.toThrow(
      '(L) is sold out',
    )
    const cap = await createShopMerch(payload, { inStock: false })
    await expect(resolveCart(req, [{ collection: 'merch', id: cap.id, option: null, quantity: 1 }])).rejects.toThrow('is sold out')
  })

  it('uses the published price while an editor has a newer draft', async () => {
    const book = await createShopBook(payload)
    await payload.update({
      collection: 'books',
      id: book.id,
      draft: true,
      data: { formats: [{ ...book.formats?.[0], priceNGN: 1 }] as never },
    })
    const [line] = await resolveCart(req, [{ collection: 'books', id: book.id, option: book.formats?.[0]?.id ?? null, quantity: 1 }])
    expect(line.unitPriceKobo).toBe(1_000_000)
  })
})
