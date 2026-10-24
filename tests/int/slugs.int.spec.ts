import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createStaff, expectFieldError, getTestPayload, resetCollections } from '../helpers/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

// Each test builds the categories it needs, so the tests pass in any order.
beforeEach(async () => {
  await resetCollections(payload, ['categories', 'tags'])
})

describe('slugs', () => {
  it('makes the slug from the name when left empty', async () => {
    const category = await payload.create({ collection: 'categories', data: { name: 'Short Fiction' } })
    expect(category.slug).toBe('short-fiction')
  })

  it('adds a number when the made slug is taken', async () => {
    await payload.create({ collection: 'categories', data: { name: 'Short Fiction' } })
    const second = await payload.create({ collection: 'categories', data: { name: 'Short Fiction' } })
    expect(second.slug).toBe('short-fiction-2')
  })

  it('refuses a badly typed slug instead of tidying it, drafts included', async () => {
    const format = /lower-case letters, numbers and single hyphens/
    await expectFieldError(
      payload.create({ collection: 'categories', data: { name: 'Essays', slug: 'Bad Slug!' } }),
      'slug',
      format,
    )
    await expectFieldError(
      payload.create({ collection: 'writers', data: { name: 'A Writer', shortBio: 'Bio.', slug: 'Bad Slug!' }, draft: true }),
      'slug',
      format,
    )
    await expectFieldError(
      payload.create({
        collection: 'writers',
        data: { name: 'A Writer', shortBio: 'Bio.', slug: 'Bad Slug!', _status: 'published' },
      }),
      'slug',
      format,
    )
    expect((await payload.count({ collection: 'categories' })).totalDocs).toBe(0)
  })

  it('saves a well-formed typed slug unchanged', async () => {
    const category = await payload.create({ collection: 'categories', data: { name: 'Essays', slug: 'long-essays' } })
    expect(category.slug).toBe('long-essays')
  })

  it('refuses a typed slug over 80 characters, drafts included, and keeps one of exactly 80', async () => {
    const tooLong = /^Keep the web address to 80 characters or fewer\.$/
    await expectFieldError(
      payload.create({ collection: 'categories', data: { name: 'Essays', slug: 'a'.repeat(81) } }),
      'slug',
      tooLong,
    )
    await expectFieldError(
      payload.create({
        collection: 'writers',
        data: { name: 'A Writer', shortBio: 'Bio.', slug: 'a'.repeat(81), _status: 'published' },
      }),
      'slug',
      tooLong,
    )
    await expectFieldError(
      payload.create({ collection: 'writers', data: { name: 'A Writer', shortBio: 'Bio.', slug: 'a'.repeat(81) }, draft: true }),
      'slug',
      tooLong,
    )
    const category = await payload.create({ collection: 'categories', data: { name: 'Essays', slug: 'a'.repeat(80) } })
    expect(category.slug).toBe('a'.repeat(80))
  })

  it('names the field by its label in the toast text', async () => {
    await expect(payload.create({ collection: 'tags', data: { name: 'Lagos', slug: 'Bad Slug!' } })).rejects.toThrow(
      /The following field is invalid: Web address$/,
    )
  })

  it('refuses a typed slug that another record in the list already uses', async () => {
    await payload.create({ collection: 'tags', data: { name: 'Short Fiction' } })
    await expectFieldError(
      payload.create({ collection: 'tags', data: { name: 'Another', slug: 'short-fiction' } }),
      'slug',
      /^Another tag already uses this web address\.$/,
    )
    await expectFieldError(
      payload.create({ collection: 'writers', data: { name: 'W1', shortBio: 'Bio.', slug: 'w' }, draft: true }).then(() =>
        payload.create({ collection: 'writers', data: { name: 'W2', shortBio: 'Bio.', slug: 'w' }, draft: true }),
      ),
      'slug',
      /^Another writer already uses this web address\.$/,
    )
  })

  it('duplicates a record with a new numbered address made from its title', async () => {
    const tag = await payload.create({ collection: 'tags', data: { name: 'Lagos' } })
    const tagCopy = await payload.duplicate({ collection: 'tags', id: tag.id })
    expect(tag.slug).toBe('lagos')
    expect(tagCopy.slug).toBe('lagos-2')

    const writer = await payload.create({ collection: 'writers', data: { name: 'Dup Writer', shortBio: 'Bio.', _status: 'published' } })
    const writerCopy = await payload.duplicate({ collection: 'writers', id: writer.id })
    expect(writerCopy.slug).toBe(`${writer.slug}-2`)
  })

  it('lets a record be saved again with its own typed slug', async () => {
    const tag = await payload.create({ collection: 'tags', data: { name: 'Lagos', slug: 'lagos-life' } })
    const updated = await payload.update({ collection: 'tags', id: tag.id, data: { name: 'Lagos 2', slug: 'lagos-life' } })
    expect(updated.slug).toBe('lagos-life')
  })

  it('keeps slugs unique per collection, not across collections', async () => {
    const tag = await payload.create({ collection: 'tags', data: { name: 'Short Fiction' } })
    expect(tag.slug).toBe('short-fiction')
  })

  it('refuses a name that leaves nothing for the slug', async () => {
    const before = await payload.count({ collection: 'categories' })
    await expect(payload.create({ collection: 'categories', data: { name: '!!!' } })).rejects.toThrow()
    const after = await payload.count({ collection: 'categories' })
    expect(after.totalDocs).toBe(before.totalDocs)
  })

  it('saves two untitled drafts with no web address instead of failing on the unique index', async () => {
    await resetCollections(payload, ['writers'])
    const first = await payload.create({ collection: 'writers', data: { name: '', slug: '' }, draft: true })
    const second = await payload.create({ collection: 'writers', data: { name: '', slug: '' }, draft: true })
    expect(first.slug).toBeFalsy()
    expect(second.slug).toBeFalsy()
    expect(second.id).not.toBe(first.id)
    await resetCollections(payload, ['writers'])
  })

  it('keeps the slug when only another field is updated', async () => {
    const created = await payload.create({
      collection: 'categories',
      data: { name: 'Memoir', description: 'First draft.' },
    })
    expect(created.slug).toBe('memoir')
    const updated = await payload.update({
      collection: 'categories',
      id: created.id,
      data: { description: 'Second draft.' },
    })
    expect(updated.slug).toBe('memoir')
  })

  it('keeps numbered slugs within 80 characters, and stable on the next save', async () => {
    const name = 'Long Category Name '.repeat(6)
    const first = await payload.create({ collection: 'categories', data: { name } })
    const second = await payload.create({ collection: 'categories', data: { name } })
    expect(first.slug?.length).toBeLessThanOrEqual(80)
    expect(second.slug?.length).toBeLessThanOrEqual(80)
    expect(second.slug).not.toBe(first.slug)
    expect(second.slug?.endsWith('-2')).toBe(true)

    const updated = await payload.update({
      collection: 'categories',
      id: second.id,
      data: { description: 'Edited after creation.' },
    })
    expect(updated.slug).toBe(second.slug)
  })
})

describe('categories and tags access', () => {
  it('lets visitors read but not create', async () => {
    await payload.create({ collection: 'categories', data: { name: 'Readable' } })
    const result = await payload.find({ collection: 'categories', overrideAccess: false })
    expect(result.totalDocs).toBeGreaterThan(0)
    await expect(
      payload.create({ collection: 'tags', data: { name: 'Spam' }, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('lets an editor create and delete', async () => {
    const editor = await createStaff(payload, 'editor')
    const tag = await payload.create({
      collection: 'tags',
      data: { name: 'Lagos' },
      overrideAccess: false,
      user: editor,
    })
    await payload.delete({ collection: 'tags', id: tag.id, overrideAccess: false, user: editor })
    const left = await payload.find({ collection: 'tags', where: { id: { equals: tag.id } } })
    expect(left.totalDocs).toBe(0)
  })
})
