import type { PayloadRequest } from 'payload'

import type { Book, Merch } from '@/payload-types'
import { Refusal } from '@/refusal'
import { withRowLock } from '@/shop/claims'

export type StockRow = {
  key: string
  collection: 'books' | 'merch'
  id: number
  title: string
  optionId: string | null
  optionName: string | null
  inStock: boolean
}

export type StockChange = { collection: 'books' | 'merch'; id: number; optionId: string | null; inStock: boolean }

/** Every format and size on sale on the live site, with its In stock value. */
export async function stockRows(req: PayloadRequest): Promise<StockRow[]> {
  const live = { draft: false, depth: 0, limit: 0, pagination: false, sort: 'title', overrideAccess: true, showHiddenFields: true, req } as const
  const books = await req.payload.find({ collection: 'books', where: { and: [{ sellInShop: { equals: true } }, { _status: { equals: 'published' } }] }, ...live })
  const merch = await req.payload.find({ collection: 'merch', where: { _status: { equals: 'published' } }, ...live })
  const rows: StockRow[] = []
  for (const book of books.docs) {
    for (const format of book.formats ?? []) {
      rows.push({ key: `books:${book.id}:${format.id}`, collection: 'books', id: book.id, title: book.title, optionId: format.id ?? null, optionName: format.formatName, inStock: Boolean(format.inStock) })
    }
  }
  for (const item of merch.docs) {
    const options = item.options ?? []
    if (options.length === 0) {
      rows.push({ key: `merch:${item.id}`, collection: 'merch', id: item.id, title: item.title, optionId: null, optionName: null, inStock: Boolean(item.inStock) })
    }
    for (const option of options) {
      rows.push({ key: `merch:${item.id}:${option.id}`, collection: 'merch', id: item.id, title: item.title, optionId: option.id ?? null, optionName: option.name, inStock: Boolean(option.inStock) })
    }
  }
  return rows
}

/** The fields to change for one In stock value, or null when the option is no longer on the record. */
function withStock(doc: Book | Merch, change: StockChange): Record<string, unknown> | null {
  if (change.collection === 'books') {
    const formats = (doc as Book).formats ?? []
    if (!formats.some((format) => format.id === change.optionId)) return null
    return { formats: formats.map((format) => (format.id === change.optionId ? { ...format, inStock: change.inStock } : format)) }
  }
  const options = (doc as Merch).options ?? []
  if (options.length === 0) return change.optionId ? null : { inStock: change.inStock }
  if (!options.some((option) => option.id === change.optionId)) return null
  return { options: options.map((option) => (option.id === change.optionId ? { ...option, inStock: change.inStock } : option)) }
}

/** The whole record as save data, without what Payload sets itself. Publishing the whole record relies on the read having returned every field, hidden ones included. */
function asData(doc: Book | Merch): Record<string, unknown> {
  const data = { ...(doc as unknown as Record<string, unknown>) }
  delete data.id
  delete data.createdAt
  delete data.updatedAt
  return data
}

function find(req: PayloadRequest, change: StockChange, draft: boolean): Promise<Book | Merch | null> {
  const options = { id: change.id, draft, depth: 0, overrideAccess: true, showHiddenFields: true, disableErrors: true, req } as const
  return change.collection === 'books' ? req.payload.findByID({ collection: 'books', ...options }) : req.payload.findByID({ collection: 'merch', ...options })
}

/**
 * Changes one In stock value on the live site. In Payload 3.90.2, publishing by id builds on the
 * newest version, draft included, so the whole published record is sent (nothing from a draft is
 * merged in). If an editor's draft was newer, it is then saved again as a draft with the same value,
 * so it stays the newest version and can't undo the switch when it's published.
 */
export async function setStock(req: PayloadRequest, change: StockChange): Promise<void> {
  // The item's row is locked for both reads and both writes, so two switches on one item made at
  // the same moment each build on what the other saved, and neither change is lost.
  await withRowLock(req, change.collection, change.id, async () => {
    const published = await find(req, change, false)
    if (!published || published._status !== 'published') throw new Refusal('Only items on the live site can have their stock changed here.')
    const liveChange = withStock(published, change)
    if (!liveChange) throw new Refusal('That option no longer exists. Reload the page.')
    const latest = await find(req, change, true)
    const save = { collection: change.collection, id: change.id, overrideAccess: true, depth: 0, req }
    await req.payload.update({ ...save, draft: false, data: { ...asData(published), ...liveChange, _status: 'published' } as never })
    if (latest?._status === 'draft') {
      await req.payload.update({ ...save, draft: true, data: { ...asData(latest), ...(withStock(latest, change) ?? {}), _status: 'draft' } as never })
    }
  })
}

/** The largest id the database's integer column holds. */
const MAX_ID = 2147483647

/** A switch from the Stock page, checked for shape. */
export function parseStockChange(body: Record<string, unknown>): StockChange {
  const id = typeof body.id === 'number' ? body.id : typeof body.id === 'string' && /^\d+$/.test(body.id) ? Number(body.id) : NaN
  const optionId = body.optionId === undefined || body.optionId === null || body.optionId === '' ? null : body.optionId
  if ((body.collection !== 'books' && body.collection !== 'merch') || !Number.isInteger(id) || id < 1 || id > MAX_ID || typeof body.inStock !== 'boolean' || (optionId !== null && typeof optionId !== 'string')) {
    throw new Refusal('The change could not be read. Reload the page.')
  }
  return { collection: body.collection, id, optionId, inStock: body.inStock }
}
