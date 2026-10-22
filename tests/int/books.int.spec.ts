import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Media, Writer } from '@/payload-types'

import { createImage, createWriter, getTestPayload } from '../helpers/payload'

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
    await expect(
      payload.create({ collection: 'books', data: book({ sellInShop: true, formats: [], _status: 'published' }) }),
    ).rejects.toMatchObject({
      data: { errors: [{ path: 'formats', message: expect.stringMatching(/at least one format/) }] },
    })
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

  it('refuses kobo in a price', async () => {
    await expect(
      payload.create({
        collection: 'books',
        data: book({ formats: [{ ...paperback, priceNGN: 12500.5 }], _status: 'published' }),
      }),
    ).rejects.toThrow()
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

  it('makes the slug from the name', async () => {
    const doc = await createWriter(payload, 'Adéọlá Ọ̀ṣun')
    expect(doc.slug).toBe('adeola-osun')
  })
})
