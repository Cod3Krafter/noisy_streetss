import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { User, Writer } from '@/payload-types'
import { skippedByGuard } from '@/rules/references'
import { richText } from '@/seed/richText'
import { samplePdf } from '@/seed/samplePdf'

import { createImage, createStaff, createWriter, getTestPayload, rest, tokenFor } from '../helpers/payload'

const DAY = 24 * 60 * 60 * 1000
const fromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()
const unique = () => Math.random().toString(36).slice(2, 8)
const inUse = /is still used by .+\. Remove it from there first, then delete it\./

let payload: Payload
let admin: User
let writer: Writer
let categoryId: number
let popupDays = 400

beforeAll(async () => {
  payload = await getTestPayload()
  admin = await createStaff(payload, 'admin')
  writer = await createWriter(payload)
  categoryId = (await payload.create({ collection: 'categories', data: { name: `Guard ${unique()}` } })).id
})

afterAll(async () => {
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { contactEmail: 'hello@noisystreetss.test', formAlertEmail: 'inbox@noisystreetss.test', defaultShareImage: null },
  })
})

const newBook = async () =>
  payload.create({
    collection: 'books',
    data: {
      title: `Guard Book ${unique()}`,
      cover: (await createImage(payload)).id,
      writers: [writer.id],
      category: 'fiction',
      summary: 'A test book.',
      _status: 'published',
    },
  })

// Switched off, and far in the future, so it never clashes with another test's popup.
const newPopup = (bookId: number) => {
  popupDays += 10
  return payload.create({
    collection: 'popup-campaigns',
    data: { book: bookId, headline: `Guard popup ${unique()}`, startsAt: fromNow(popupDays), endsAt: fromNow(popupDays + 1), enabled: false },
  })
}

const newArticle = (overrides: Record<string, unknown> = {}) =>
  payload.create({
    collection: 'articles',
    data: {
      title: `Guard Article ${unique()}`,
      summary: 'A test article.',
      body: richText('Some text.'),
      writers: [writer.id],
      categories: [categoryId],
      publishDate: fromNow(0),
      _status: 'published',
      ...overrides,
    },
  })

/** Rich text with one extra node after a paragraph. */
const bodyWith = (node: Record<string, unknown>) => {
  const body = richText('Before the extra node.')
  return { root: { ...body.root, children: [...body.root.children, node] } }
}

/** A paragraph holding an internal link to a record. */
const linkTo = (relationTo: string, value: number) => {
  const paragraph = richText('x').root.children[0]
  return {
    ...paragraph,
    children: [
      {
        type: 'link',
        version: 3,
        direction: 'ltr',
        format: '',
        indent: 0,
        fields: { linkType: 'internal', newTab: false, doc: { relationTo, value } },
        children: [{ type: 'text', text: 'a link', format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
      },
    ],
  }
}

const placedImage = (value: number) => ({ type: 'upload', version: 3, format: '', id: `guard-${unique()}`, fields: null, relationTo: 'media', value })

const stillThere = async (collection: 'books' | 'media' | 'writers' | 'submission-calls' | 'manuscripts', id: number) =>
  (await payload.count({ collection, where: { id: { equals: id } } })).totalDocs === 1

describe('deleting a record that is still in use', () => {
  it('refuses a book that a book popup uses, and names the popup (list without drafts)', async () => {
    const book = await newBook()
    const popup = await newPopup(book.id)
    await expect(payload.delete({ collection: 'books', id: book.id })).rejects.toThrow(
      `"${book.title}" is still used by Book popup "${popup.headline}" (Book). Remove it from there first, then delete it.`,
    )
    expect(await stillThere('books', book.id)).toBe(true)
  })

  it('refuses a submission call that has submissions, and the file a submission holds', async () => {
    const call = await payload.create({
      collection: 'submission-calls',
      data: {
        title: `Guard call ${unique()}`,
        themeSummary: 'A theme.',
        guidelines: richText('Up to 5,000 words.'),
        opensAt: fromNow(-2),
        closesAt: fromNow(10),
        _status: 'published',
      },
    })
    const file = await payload.create({ collection: 'manuscripts', data: {}, file: samplePdf(`guard-${unique()}.pdf`) })
    const submission = await payload.create({
      collection: 'manuscript-submissions',
      data: { call: call.id, name: 'Chidi Writer', email: 'chidi@example.com', workTitle: `Guard work ${unique()}`, shortBio: 'Writes.', file: file.id, status: 'new' },
    })
    await expect(payload.delete({ collection: 'submission-calls', id: call.id })).rejects.toThrow(
      `Manuscript submission "${submission.workTitle}" (Submission call)`,
    )
    await expect(payload.delete({ collection: 'manuscripts', id: file.id })).rejects.toThrow(
      `Manuscript submission "${submission.workTitle}" (Manuscript file)`,
    )
    expect(await stillThere('submission-calls', call.id)).toBe(true)
    expect(await stillThere('manuscripts', file.id)).toBe(true)
  })

  it('refuses a writer named on a published article, and the article keeps the writer (list with drafts)', async () => {
    const solo = await createWriter(payload)
    const article = await newArticle({ writers: [solo.id] })
    await expect(payload.delete({ collection: 'writers', id: solo.id })).rejects.toThrow(`Article "${article.title}" (Writers)`)
    const kept = await payload.findByID({ collection: 'articles', id: article.id, depth: 0 })
    expect(kept.writers).toEqual([solo.id])
  })

  it('refuses a writer named only in an article draft that is not published yet', async () => {
    const solo = await createWriter(payload)
    const article = await newArticle()
    await payload.update({ collection: 'articles', id: article.id, data: { writers: [writer.id, solo.id] }, draft: true })
    await expect(payload.delete({ collection: 'writers', id: solo.id })).rejects.toThrow(`Article "${article.title}" (Writers)`)
  })

  it('refuses an image placed in an article body', async () => {
    const image = await createImage(payload)
    const article = await newArticle({ body: bodyWith(placedImage(image.id)) })
    await expect(payload.delete({ collection: 'media', id: image.id })).rejects.toThrow(`Article "${article.title}" (Body)`)
    expect(await stillThere('media', image.id)).toBe(true)
  })

  it('refuses a book linked from rich text', async () => {
    const book = await newBook()
    const article = await newArticle({ body: bodyWith(linkTo('books', book.id)) })
    await expect(payload.delete({ collection: 'books', id: book.id })).rejects.toThrow(`Article "${article.title}" (Body)`)
  })

  it('refuses an image a page or setting still uses', async () => {
    const image = await createImage(payload)
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { contactEmail: 'hello@noisystreetss.test', formAlertEmail: 'inbox@noisystreetss.test', defaultShareImage: image.id },
    })
    await expect(payload.delete({ collection: 'media', id: image.id })).rejects.toThrow('Site settings (Default sharing image)')
  })

  it('refuses an image used as an article sharing image (SEO, inside a group)', async () => {
    const image = await createImage(payload)
    const article = await newArticle({ meta: { image: image.id } })
    await expect(payload.delete({ collection: 'media', id: image.id })).rejects.toThrow(`Article "${article.title}" (`)
  })

  it('deletes a record nothing uses, and one that only links to itself', async () => {
    const image = await createImage(payload)
    await payload.delete({ collection: 'media', id: image.id })
    expect(await stillThere('media', image.id)).toBe(false)

    const article = await newArticle()
    await payload.update({ collection: 'articles', id: article.id, data: { body: bodyWith(linkTo('articles', article.id)) } })
    await payload.delete({ collection: 'articles', id: article.id })
    expect((await payload.count({ collection: 'articles', where: { id: { equals: article.id } } })).totalDocs).toBe(0)
  })
})

describe('bulk deletes', () => {
  it('deletes the records nothing uses and refuses the rest, each with its own message', async () => {
    const used = await newBook()
    await newPopup(used.id)
    const unused = await newBook()
    const result = await payload.delete({ collection: 'books', where: { id: { in: [used.id, unused.id] } } })
    expect(result.docs.map((doc) => doc.id)).toEqual([unused.id])
    expect(result.errors).toEqual([expect.objectContaining({ id: used.id, message: expect.stringMatching(inUse) })])
    expect(await stillThere('books', used.id)).toBe(true)
    expect(await stillThere('books', unused.id)).toBe(false)
  })
})

describe('over the REST API, as the admin uses it', () => {
  it('answers a single delete with the plain message, not a database error', async () => {
    const token = await tokenFor(payload, admin)
    const book = await newBook()
    await newPopup(book.id)
    const res = await rest('DELETE', `/books/${book.id}`, { token })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.errors[0].message).toMatch(inUse)
  })

  it('answers a bulk delete with each refused record and its message', async () => {
    const token = await tokenFor(payload, admin)
    const used = await newBook()
    await newPopup(used.id)
    const unused = await newBook()
    const res = await rest('DELETE', `/books?where[id][in]=${used.id},${unused.id}`, { token })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.docs.map((doc: { id: number }) => doc.id)).toEqual([unused.id])
    expect(body.errors).toEqual([expect.objectContaining({ id: used.id, message: expect.stringMatching(inUse) })])
  })
})

describe('how a refusal is logged', () => {
  const messageOf = (call: unknown[]) => {
    const first = call[0] as { msg?: string } | string
    return typeof first === 'string' ? first : (first.msg ?? '')
  }

  it('logs a refused delete as one info line and nothing at error', async () => {
    const token = await tokenFor(payload, admin)
    const book = await newBook()
    await newPopup(book.id)
    const info = vi.spyOn(payload.logger, 'info')
    const error = vi.spyOn(payload.logger, 'error')
    try {
      const res = await rest('DELETE', `/books/${book.id}`, { token })
      expect(res.status).toBe(400)
      expect(error.mock.calls.map(messageOf)).toEqual([])
      expect(info.mock.calls.map(messageOf).filter((message) => inUse.test(message))).toHaveLength(1)
    } finally {
      info.mockRestore()
      error.mockRestore()
    }
  })

  it("has Refusal at info, keeps Payload's own levels, and leaves APIError at error", () => {
    const levels = payload.config.loggingLevels as Record<string, string>
    expect(levels.Refusal).toBe('info')
    expect(levels.NotFound).toBe('info')
    expect(levels.APIError).toBeUndefined()
  })
})

describe('reading only what can hold the record', () => {
  it('reads no page or setting to delete a tag, and still names the article using it', async () => {
    const tag = await payload.create({ collection: 'tags', data: { name: `Guard tag ${unique()}` } })
    const article = await newArticle({ tags: [tag.id] })
    const findGlobal = vi.spyOn(payload, 'findGlobal')
    try {
      await expect(payload.delete({ collection: 'tags', id: tag.id })).rejects.toThrow(
        `"${tag.name}" is still used by Article "${article.title}" (Tags). Remove it from there first, then delete it.`,
      )
      expect(findGlobal).not.toHaveBeenCalled()
    } finally {
      findGlobal.mockRestore()
    }
  })

  it('reads nothing to delete a contact message, which nothing can point at', async () => {
    const message = await payload.create({
      collection: 'contact-messages',
      data: { name: 'Guard Sender', email: 'guard@example.com', message: `Guard message ${unique()}`, status: 'new' },
    })
    const findGlobal = vi.spyOn(payload, 'findGlobal')
    const find = vi.spyOn(payload, 'find')
    try {
      await payload.delete({ collection: 'contact-messages', id: message.id })
      expect(findGlobal).not.toHaveBeenCalled()
      expect(find).not.toHaveBeenCalled()
    } finally {
      findGlobal.mockRestore()
      find.mockRestore()
    }
    expect((await payload.count({ collection: 'contact-messages', where: { id: { equals: message.id } } })).totalDocs).toBe(0)
  })

  it('names an article once, with both fields, when its cover is also its sharing image', async () => {
    const image = await createImage(payload)
    const article = await newArticle({ cover: image.id, meta: { image: image.id } })
    await expect(payload.delete({ collection: 'media', id: image.id })).rejects.toThrow(
      `is still used by Article "${article.title}" (Cover, SEO › Meta Image). Remove it from there first, then delete it.`,
    )
  })

  it('asks each list once per pass for an image, however many of its fields hold images', async () => {
    const image = await createImage(payload)
    const find = vi.spyOn(payload, 'find')
    let calls: string[] = []
    try {
      await payload.delete({ collection: 'media', id: image.id })
      // Queries with a where look for the image in fields; those without read rich text.
      calls = find.mock.calls.map(([options]) => `${options.collection}, ${options.draft ? 'draft' : 'published'}, ${options.where ? 'fields' : 'rich text'}`)
    } finally {
      find.mockRestore()
    }
    const repeated = calls.filter((call, index) => calls.indexOf(call) !== index)
    expect(repeated).toEqual([])
    expect(await stillThere('media', image.id)).toBe(false)
  })
})

describe('what the guard can see', () => {
  // The guard follows relationship and upload fields that point at one list. A field that can
  // point at several lists would need a different query, so this fails if one is ever added
  // (unless it is marked to be skipped by the guard, as an order line's product is).
  it('finds no relationship or upload field that points at several lists', () => {
    const several: string[] = []
    const walk = (fields: Array<Record<string, unknown>>, where: string) => {
      for (const field of fields) {
        const path = `${where}.${String(field.name)}`
        const skipped = skippedByGuard(field as never)
        if (!skipped && (field.type === 'relationship' || field.type === 'upload') && Array.isArray(field.relationTo)) several.push(path)
        if (Array.isArray(field.flattenedFields)) walk(field.flattenedFields as Array<Record<string, unknown>>, path)
        if (Array.isArray(field.blocks)) {
          for (const block of field.blocks as Array<{ flattenedFields: Array<Record<string, unknown>> }>) walk(block.flattenedFields, path)
        }
      }
    }
    for (const collection of payload.config.collections) {
      if (!collection.slug.startsWith('payload-')) walk(collection.flattenedFields as unknown as Array<Record<string, unknown>>, collection.slug)
    }
    for (const global of payload.config.globals) walk(global.flattenedFields as unknown as Array<Record<string, unknown>>, global.slug)
    expect(several).toEqual([])
  })
})
