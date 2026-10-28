import { createLocalReq, type Payload, type PayloadRequest } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'
import { setStock, stockRows } from '@/shop/stock'

import { createStaff, getTestPayload, rest, tokenFor } from '../helpers/payload'
import { createShopBook, createShopMerch } from '../helpers/shop'

let payload: Payload
let req: PayloadRequest
let shop: User
let editor: User

beforeAll(async () => {
  payload = await getTestPayload()
  req = await createLocalReq({}, payload)
  shop = await createStaff(payload, 'shop')
  editor = await createStaff(payload, 'editor')
})

describe('the Stock page', () => {
  it('lists each format and size on sale, and one-size merch once', async () => {
    const book = await createShopBook(payload, {
      formats: [
        { formatName: 'Paperback', priceNGN: 9000, inStock: true, weightGrams: 300 },
        { formatName: 'Hardback', priceNGN: 14000, inStock: false, weightGrams: 500 },
      ],
    })
    const tote = await createShopMerch(payload)
    const shirt = await createShopMerch(payload, { options: [{ name: 'S' }, { name: 'M', inStock: false }] })
    const notForSale = await createShopBook(payload, { sellInShop: false })
    const rows = await stockRows(req)
    // Books and merch can share an id, so match on both.
    const mine = (collection: string, id: number) =>
      rows.filter((row) => row.collection === collection && row.id === id).map((row) => [row.optionName, row.inStock])
    expect(mine('books', book.id)).toEqual([
      ['Paperback', true],
      ['Hardback', false],
    ])
    expect(mine('merch', tote.id)).toEqual([[null, true]])
    expect(mine('merch', shirt.id)).toEqual([
      ['S', true],
      ['M', false],
    ])
    expect(rows.some((row) => row.collection === 'books' && row.id === notForSale.id)).toBe(false)
  })

  it('changes the live record without publishing an editor draft, and the draft keeps the change', async () => {
    const book = await createShopBook(payload)
    await payload.update({ collection: 'books', id: book.id, draft: true, data: { title: 'Half-edited title' } })

    await setStock(req, { collection: 'books', id: book.id, optionId: book.formats?.[0]?.id ?? null, inStock: false })

    const live = await payload.findByID({ collection: 'books', id: book.id, draft: false })
    expect(live.title).toBe(book.title)
    expect(live.formats?.[0]?.inStock).toBe(false)
    const latest = await payload.findByID({ collection: 'books', id: book.id, draft: true })
    expect(latest._status).toBe('draft')
    expect(latest.title).toBe('Half-edited title')
    expect(latest.formats?.[0]?.inStock).toBe(false)

    // The editor publishes later: the switch survives.
    await payload.update({ collection: 'books', id: book.id, data: { _status: 'published' } })
    const published = await payload.findByID({ collection: 'books', id: book.id, draft: false })
    expect(published.title).toBe('Half-edited title')
    expect(published.formats?.[0]?.inStock).toBe(false)
  })

  it('changes a size, and one-size merch', async () => {
    const shirt = await createShopMerch(payload, { options: [{ name: 'S' }, { name: 'M' }] })
    await setStock(req, { collection: 'merch', id: shirt.id, optionId: shirt.options?.[1]?.id ?? null, inStock: false })
    expect((await payload.findByID({ collection: 'merch', id: shirt.id })).options?.map((option) => option.inStock)).toEqual([true, false])
    const tote = await createShopMerch(payload)
    await setStock(req, { collection: 'merch', id: tote.id, optionId: null, inStock: false })
    expect((await payload.findByID({ collection: 'merch', id: tote.id })).inStock).toBe(false)
  })

  it('refuses an option that no longer exists', async () => {
    const book = await createShopBook(payload)
    await expect(setStock(req, { collection: 'books', id: book.id, optionId: 'gone', inStock: false })).rejects.toThrow('no longer exists')
  })

  it('is open to shop staff over REST, and not to editors', async () => {
    const book = await createShopBook(payload)
    const body = { collection: 'books', id: book.id, optionId: book.formats?.[0]?.id, inStock: false }
    expect((await rest('POST', '/shop/stock', { body, token: await tokenFor(payload, editor) })).status).toBe(403)
    expect((await rest('POST', '/shop/stock', { body })).status).toBe(403)
    expect((await rest('POST', '/shop/stock', { body, token: await tokenFor(payload, shop) })).status).toBe(200)
    expect((await payload.findByID({ collection: 'books', id: book.id })).formats?.[0]?.inStock).toBe(false)
  })
})
