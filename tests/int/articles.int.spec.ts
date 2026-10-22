import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Category, Media, Writer } from '@/payload-types'
import { richText } from '@/seed/richText'

import { createImage, createWriter, getTestPayload } from '../helpers/payload'

const WEEK = 7 * 24 * 60 * 60 * 1000

let payload: Payload
let cover: Media
let writer: Writer
let category: Category

const article = (overrides: Record<string, unknown> = {}) => ({
  title: `Article ${Math.random().toString(36).slice(2, 8)}`,
  cover: cover.id,
  summary: 'A test article.',
  body: richText('The first paragraph.'),
  writers: [writer.id],
  categories: [category.id],
  publishDate: new Date().toISOString(),
  ...overrides,
})

const visitorCanSee = async (id: number) => {
  const result = await payload.find({ collection: 'articles', where: { id: { equals: id } }, overrideAccess: false })
  return result.totalDocs === 1
}

beforeAll(async () => {
  payload = await getTestPayload()
  cover = await createImage(payload)
  writer = await createWriter(payload)
  category = await payload.create({ collection: 'categories', data: { name: 'Essays' } })
})

describe('articles', () => {
  it('hides drafts from visitors and shows published articles', async () => {
    const draft = await payload.create({ collection: 'articles', data: article(), draft: true })
    const published = await payload.create({ collection: 'articles', data: article({ _status: 'published' }) })
    expect(await visitorCanSee(draft.id)).toBe(false)
    expect(await visitorCanSee(published.id)).toBe(true)
  })

  it('publishes a scheduled article when its job runs, not before', async () => {
    const draft = await payload.create({
      collection: 'articles',
      data: article({ publishDate: new Date(Date.now() + WEEK).toISOString() }),
      draft: true,
    })
    // The admin queues the id as a string (Payload turns it back into a number when the job runs),
    // but the generated type says number, hence the cast.
    const job = await payload.jobs.queue({
      task: 'schedulePublish',
      input: { type: 'publish', doc: { relationTo: 'articles', value: String(draft.id) as unknown as number } },
      waitUntil: new Date(Date.now() + WEEK),
    })

    // Not due yet: a normal run leaves it alone.
    await payload.jobs.run()
    expect(await visitorCanSee(draft.id)).toBe(false)

    // Running this one job directly ignores its due time, standing in for a week passing.
    await payload.jobs.runByID({ id: job.id })
    expect(await visitorCanSee(draft.id)).toBe(true)
  })

  it("lists a writer's articles on the writer", async () => {
    const doc = await payload.create({ collection: 'articles', data: article({ _status: 'published' }) })
    const found = await payload.findByID({ collection: 'writers', id: writer.id })
    const ids = (found.articles?.docs ?? []).map((entry) => (typeof entry === 'object' ? entry.id : entry))
    expect(ids).toContain(doc.id)
  })

  it('needs a writer and a category to publish', async () => {
    await expect(
      payload.create({ collection: 'articles', data: article({ writers: [], _status: 'published' }) }),
    ).rejects.toThrow()
    await expect(
      payload.create({ collection: 'articles', data: article({ categories: [], _status: 'published' }) }),
    ).rejects.toThrow()
  })
})
