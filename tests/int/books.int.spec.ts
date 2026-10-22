import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Media, Writer } from '@/payload-types'

import { createImage, createWriter, expectFieldError, getTestPayload } from '../helpers/payload'

let payload: Payload
let cover: Media
let writer: Writer

const book = (overrides: Record<string, unknown> = {}) => ({
  title: `Test Book ${Math.random().toString(36).slice(2, 8)}`,
  cover: cover.id,
  writers: [writer.id],
  category: 'fiction' as const,
  summary: 'A test book.',
  ...overrides,
})

const paperback = { formatName: 'Paperback', priceNGN: 12500, inStock: true, weightGrams: 450 }

beforeAll(async () => {
  payload = await getTestPayload()
  cover = await createImage(payload)
  writer = await createWriter(payload, 'Modupe Daramola')
})

describe('books', () => {
  it('refuses to publish a book for sale with no formats', async () => {
    await expectFieldError(
      payload.create({ collection: 'books', data: book({ sellInShop: true, formats: [], _status: 'published' }) }),
      'formats',
      /at least one format/,
    )
  })

  it('publishes a book for sale once it has a format', async () => {
    const doc = await payload.create({
      collection: 'books',
      data: book({ sellInShop: true, formats: [paperback], _status: 'published' }),
    })
    expect(doc._status).toBe('published')
  })

  it('lets a draft for sale have no formats yet', async () => {
    const doc = await payload.create({
      collection: 'books',
      data: book({ sellInShop: true, formats: [] }),
      draft: true,
    })
    expect(doc._status).toBe('draft')
  })

  it('refuses to remove every format from a published book that is for sale', async () => {
    const doc = await payload.create({
      collection: 'books',
      data: book({ sellInShop: true, formats: [paperback], _status: 'published' }),
    })
    await expectFieldError(
      payload.update({ collection: 'books', id: doc.id, data: { formats: [] } }),
      'formats',
      /at least one format/,
    )
  })

  it('refuses to publish a draft for sale that has no formats', async () => {
    const doc = await payload.create({
      collection: 'books',
      data: book({ sellInShop: true, formats: [] }),
      draft: true,
    })
    await expectFieldError(
      payload.update({ collection: 'books', id: doc.id, data: { _status: 'published' } }),
      'formats',
      /at least one format/,
    )
  })

  it('lets a book for sale with no formats be unpublished', async () => {
    const doc = await payload.create({
      collection: 'books',
      data: book({ sellInShop: true, formats: [paperback], _status: 'published' }),
    })
    await payload.update({ collection: 'books', id: doc.id, data: { formats: [] }, draft: true })
    const unpublished = await payload.update({ collection: 'books', id: doc.id, data: { _status: 'draft' } })
    expect(unpublished._status).toBe('draft')
  })

  it('refuses kobo in a price', async () => {
    await expectFieldError(
      payload.create({
        collection: 'books',
        data: book({ formats: [{ ...paperback, priceNGN: 12500.5 }], _status: 'published' }),
      }),
      'formats.0.priceNGN',
      /whole number/,
    )
  })

  it('shows visitors published books only', async () => {
    const published = await payload.create({ collection: 'books', data: book({ _status: 'published' }) })
    const draft = await payload.create({ collection: 'books', data: book(), draft: true })
    const seen = await payload.find({
      collection: 'books',
      where: { id: { in: [published.id, draft.id] } },
      overrideAccess: false,
    })
    expect(seen.docs.map((doc) => doc.id)).toEqual([published.id])
  })

  it("lists a writer's books on the writer", async () => {
    const doc = await payload.create({ collection: 'books', data: book({ _status: 'published' }) })
    const found = await payload.findByID({ collection: 'writers', id: writer.id })
    const ids = (found.books?.docs ?? []).map((entry) => (typeof entry === 'object' ? entry.id : entry))
    expect(ids).toContain(doc.id)
  })
})

describe('writers', () => {
  it('hides draft writers from visitors', async () => {
    const draft = await payload.create({
      collection: 'writers',
      data: { name: 'Draft Writer', shortBio: 'Not ready.' },
      draft: true,
    })
    const seen = await payload.find({
      collection: 'writers',
      where: { id: { equals: draft.id } },
      overrideAccess: false,
    })
    expect(seen.totalDocs).toBe(0)
  })

  it('shows visitors only published books on a writer', async () => {
    const author = await createWriter(payload)
    const published = await payload.create({
      collection: 'books',
      data: book({ writers: [author.id], _status: 'published' }),
    })
    await payload.create({ collection: 'books', data: book({ writers: [author.id] }), draft: true })
    const found = await payload.findByID({ collection: 'writers', id: author.id, overrideAccess: false })
    const ids = (found.books?.docs ?? []).map((entry) => (typeof entry === 'object' ? entry.id : entry))
    expect(ids).toEqual([published.id])
  })

  it('makes the slug from the name', async () => {
    const doc = await createWriter(payload, 'Adéọlá Ọ̀ṣun')
    expect(doc.slug).toBe('adeola-osun')
  })
})
