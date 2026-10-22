import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { createStaff, getTestPayload } from '../helpers/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('slugs', () => {
  it('makes the slug from the name when left empty', async () => {
    const category = await payload.create({ collection: 'categories', data: { name: 'Short Fiction' } })
    expect(category.slug).toBe('short-fiction')
  })

  it('adds a number when the made slug is taken', async () => {
    const second = await payload.create({ collection: 'categories', data: { name: 'Short Fiction' } })
    expect(second.slug).toBe('short-fiction-2')
  })

  it('tidies a typed slug', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { name: 'Essays', slug: 'Long Essays!' },
    })
    expect(category.slug).toBe('long-essays')
  })

  it('rejects a typed slug that is already taken', async () => {
    await expect(
      payload.create({ collection: 'categories', data: { name: 'Another', slug: 'short-fiction' } }),
    ).rejects.toThrow(/slug/)
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
