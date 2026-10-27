import type { PayloadRequest } from 'payload'

import type { Book, Merch } from '@/payload-types'
import { Refusal } from '@/refusal'
import { toKobo } from '@/shop/money'

export const MAX_LINES = 20
export const MAX_QUANTITY = 10

export type CartLine = { collection: 'books' | 'merch'; id: number; option: string | null; quantity: number }

export type PricedLine = {
  collection: 'books' | 'merch'
  id: number
  optionId: string | null
  optionName: string | null
  title: string
  unitPriceKobo: number
  weightGrams: number
  quantity: number
}

export type Totals = { itemsKobo: number; deliveryKobo: number; totalKobo: number }

const UNREADABLE = 'The cart could not be read. Refresh the page and try again.'

/** The cart as the browser sent it, checked for shape only. Prices and stock come from resolveCart. */
export function parseCart(value: unknown): CartLine[] {
  if (!Array.isArray(value) || value.length === 0) throw new Refusal('The cart is empty.')
  if (value.length > MAX_LINES) throw new Refusal(`A cart can hold up to ${MAX_LINES} different items.`)
  const seen = new Set<string>()
  return value.map((raw) => {
    const entry = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const collection = entry.collection
    const id = Number(entry.id)
    const option = entry.option === undefined || entry.option === null || entry.option === '' ? null : entry.option
    if ((collection !== 'books' && collection !== 'merch') || !Number.isInteger(id) || id < 1) throw new Refusal(UNREADABLE)
    if (option !== null && (typeof option !== 'string' || option.length > 64)) throw new Refusal(UNREADABLE)
    const quantity = Number(entry.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new Refusal(`You can buy up to ${MAX_QUANTITY} of each item.`)
    }
    const key = `${collection}:${id}:${option ?? ''}`
    if (seen.has(key)) throw new Refusal(UNREADABLE)
    seen.add(key)
    return { collection, id, option, quantity }
  })
}

const GONE = 'An item in the cart is no longer available. Remove it and try again.'

/** The published version of a book: a newer draft an editor is working on never changes the price. */
async function publishedBook(req: PayloadRequest, id: number): Promise<Book> {
  const book = await req.payload.findByID({ collection: 'books', id, depth: 0, draft: false, overrideAccess: true, disableErrors: true, req })
  if (!book || book._status !== 'published') throw new Refusal(GONE)
  return book
}

async function publishedMerch(req: PayloadRequest, id: number): Promise<Merch> {
  const item = await req.payload.findByID({ collection: 'merch', id, depth: 0, draft: false, overrideAccess: true, disableErrors: true, req })
  if (!item || item._status !== 'published') throw new Refusal(GONE)
  return item
}

/** Every line looked up in the database: refused by name if it is not for sale or sold out, priced if it is. */
export async function resolveCart(req: PayloadRequest, lines: CartLine[]): Promise<PricedLine[]> {
  const priced: PricedLine[] = []
  for (const line of lines) {
    if (line.collection === 'books') {
      const book = await publishedBook(req, line.id)
      if (!book.sellInShop) throw new Refusal(`"${book.title}" is not for sale.`)
      const format = (book.formats ?? []).find((candidate) => candidate.id === line.option)
      if (!format) throw new Refusal(`Pick a format for "${book.title}".`)
      if (!format.inStock) throw new Refusal(`"${book.title}" (${format.formatName}) is sold out.`)
      priced.push({
        collection: 'books',
        id: book.id,
        optionId: format.id ?? null,
        optionName: format.formatName,
        title: book.title,
        unitPriceKobo: toKobo(format.priceNGN),
        weightGrams: format.weightGrams,
        quantity: line.quantity,
      })
      continue
    }
    const item = await publishedMerch(req, line.id)
    const options = item.options ?? []
    let optionId: string | null = null
    let optionName: string | null = null
    if (options.length > 0) {
      const option = options.find((candidate) => candidate.id === line.option)
      if (!option) throw new Refusal(`Pick an option for "${item.title}".`)
      if (!option.inStock) throw new Refusal(`"${item.title}" (${option.name}) is sold out.`)
      optionId = option.id ?? null
      optionName = option.name
    } else if (!item.inStock) {
      throw new Refusal(`"${item.title}" is sold out.`)
    }
    priced.push({
      collection: 'merch',
      id: item.id,
      optionId,
      optionName,
      title: item.title,
      unitPriceKobo: toKobo(item.priceNGN),
      weightGrams: item.weightGrams,
      quantity: line.quantity,
    })
  }
  return priced
}

/** The order's sums in kobo. `booksDiscountPercent` is B3's member discount on books; nothing passes it yet. */
export function priceOrder(lines: PricedLine[], deliveryKobo: number, { booksDiscountPercent = 0 }: { booksDiscountPercent?: number } = {}): Totals {
  const itemsKobo = lines.reduce((sum, line) => {
    const unit = line.collection === 'books' ? Math.round((line.unitPriceKobo * (100 - booksDiscountPercent)) / 100) : line.unitPriceKobo
    return sum + unit * line.quantity
  }, 0)
  return { itemsKobo, deliveryKobo, totalKobo: itemsKobo + deliveryKobo }
}

/** Every copy's weight plus the box. */
export function parcelWeightGrams(lines: { weightGrams: number; quantity: number }[], boxWeightGrams: number): number {
  return lines.reduce((sum, line) => sum + line.weightGrams * line.quantity, boxWeightGrams)
}
