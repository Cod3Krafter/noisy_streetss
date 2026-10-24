import type { Payload } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Category, Media, User, Writer } from '@/payload-types'
import { richText } from '@/seed/richText'

import { createImage, createStaff, createWriter, getTestPayload, resetCollections } from '../helpers/payload'

const DAY = 24 * 60 * 60 * 1000

let payload: Payload
let cover: Media
let writer: Writer
let category: Category

const article = (overrides: Record<string, unknown> = {}) => ({
  title: `Scheduled ${Math.random().toString(36).slice(2, 8)}`,
  cover: cover.id,
  summary: 'A test article.',
  body: richText('The first paragraph.'),
  writers: [writer.id],
  categories: [category.id],
  publishDate: new Date().toISOString(),
  ...overrides,
})

const queued: number[] = []

/** Queues a scheduled publish the way the admin does: ids as strings, and the account that scheduled it. */
const schedule = async (articleId: number, user: User, days = 7) => {
  const job = await payload.jobs.queue({
    task: 'schedulePublish',
    input: {
      type: 'publish',
      doc: { relationTo: 'articles', value: String(articleId) as unknown as number },
      user: { relationTo: 'users', value: user.id },
    },
    waitUntil: new Date(Date.now() + days * DAY),
  })
  queued.push(job.id)
  return job
}

beforeAll(async () => {
  payload = await getTestPayload()
  await resetCollections(payload, ['users'])
  await createStaff(payload, 'admin')
  cover = await createImage(payload)
  writer = await createWriter(payload)
  category = await payload.create({ collection: 'categories', data: { name: 'Scheduling' } })
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { contactEmail: 'hello@noisystreetss.test', formAlertEmail: 'inbox@noisystreetss.test' },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// The jobs these tests queue are due in days. Left in the shared test database, a later
// payload.jobs.run() in another file would run them once due, and the failing ones would email.
afterAll(async () => {
  await payload.db.deleteMany({ collection: 'payload-jobs', where: { id: { in: queued } } })
})

describe('deleting a staff account with publishes waiting', () => {
  it('is refused with the article named, and works once the job is gone', async () => {
    const editor = await createStaff(payload, 'editor')
    const draft = await payload.create({ collection: 'articles', data: article({ title: 'The Waiting Piece' }), draft: true })
    const job = await schedule(draft.id, editor)

    await expect(payload.delete({ collection: 'users', id: editor.id })).rejects.toThrow(
      /has 1 scheduled publish waiting: "The Waiting Piece" \(\d{1,2} \w+ \d{4}, \d\d:\d\d\)\. Cancel it from the article's Schedule Publish, or ask another staff member to schedule it again/,
    )
    expect((await payload.count({ collection: 'users', where: { id: { equals: editor.id } } })).totalDocs).toBe(1)

    await payload.delete({ collection: 'payload-jobs', id: job.id })
    await payload.delete({ collection: 'users', id: editor.id })
    expect((await payload.count({ collection: 'users', where: { id: { equals: editor.id } } })).totalDocs).toBe(0)
  })

  it('lists up to five publishes, then how many more', async () => {
    const editor = await createStaff(payload, 'editor')
    for (let n = 1; n <= 7; n += 1) {
      const draft = await payload.create({ collection: 'articles', data: article({ title: `Queued piece ${n}` }), draft: true })
      await schedule(draft.id, editor, n)
    }
    const error = await payload.delete({ collection: 'users', id: editor.id }).catch((caught: Error) => caught)
    expect(error).toBeInstanceOf(Error)
    const message = (error as Error).message
    expect(message).toMatch(/has 7 scheduled publishes waiting/)
    expect(message).toMatch(/Cancel them from the article's Schedule Publish, or ask another staff member to schedule them again/)
    expect(message).toContain('"Queued piece 5"')
    expect(message).not.toContain('"Queued piece 6"')
    expect(message).toMatch(/, and 2 more\./)
  })

  it('does not count publishes scheduled by someone else, or ones that already failed', async () => {
    const scheduler = await createStaff(payload, 'editor')
    const bystander = await createStaff(payload, 'editor')
    const draft = await payload.create({ collection: 'articles', data: article(), draft: true })
    await schedule(draft.id, scheduler)
    await payload.delete({ collection: 'users', id: bystander.id })
    expect((await payload.count({ collection: 'users', where: { id: { equals: bystander.id } } })).totalDocs).toBe(0)

    const failed = await createStaff(payload, 'editor')
    const other = await payload.create({ collection: 'articles', data: article(), draft: true })
    const failedJob = await schedule(other.id, failed)
    await payload.update({ collection: 'payload-jobs', id: failedJob.id, data: { hasError: true } })
    await payload.delete({ collection: 'users', id: failed.id })
    expect((await payload.count({ collection: 'users', where: { id: { equals: failed.id } } })).totalDocs).toBe(0)
  })

  it('refuses per record in a bulk delete, and deletes the rest', async () => {
    const busy = await createStaff(payload, 'editor')
    const idle = await createStaff(payload, 'editor')
    const draft = await payload.create({ collection: 'articles', data: article({ title: 'Bulk piece' }), draft: true })
    await schedule(draft.id, busy)

    const result = await payload.delete({ collection: 'users', where: { id: { in: [busy.id, idle.id] } } })
    expect(result.docs.map((doc) => doc.id)).toEqual([idle.id])
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].id).toBe(busy.id)
    expect(result.errors[0].message).toMatch(/"Bulk piece"/)
  })
})

describe('a scheduled publish that fails', () => {
  it('emails the alert address with the article and the reason, and still ends in an error', async () => {
    const admin = await createStaff(payload, 'admin')
    const first = await payload.create({
      collection: 'articles',
      data: article({ title: 'Original Title', slug: 'original-address', _status: 'published' }),
    })
    // The draft moves the article to a new address; another article then takes it.
    await payload.update({ collection: 'articles', id: first.id, data: { slug: 'contested-address' }, draft: true })
    await payload.create({ collection: 'articles', data: article({ title: 'The Other One', slug: 'contested-address', _status: 'published' }) })
    const job = await schedule(first.id, admin)

    const send = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    await payload.jobs.runByID({ id: job.id })

    expect(send).toHaveBeenCalledTimes(1)
    const mail = send.mock.calls[0][0] as { to: string; subject: string; text: string; html: string }
    expect(mail.to).toBe('inbox@noisystreetss.test')
    expect(mail.subject).toContain('Original Title')
    expect(mail.text).toContain('"Original Title"')
    expect(mail.text).toMatch(/Reason: .*Another article already uses this web address\./)
    expect(mail.text).toContain(`/admin/collections/articles/${first.id}`)

    const after = await payload.findByID({ collection: 'payload-jobs', id: job.id })
    expect(after.hasError).toBe(true)
  })

  it('says so when the article no longer exists', async () => {
    const admin = await createStaff(payload, 'admin')
    const send = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    const job = await payload.jobs.queue({
      task: 'schedulePublish',
      input: { type: 'publish', doc: { relationTo: 'articles', value: '99999999' as unknown as number }, user: { relationTo: 'users', value: admin.id } },
      waitUntil: new Date(Date.now() + DAY),
    })
    queued.push(job.id)
    await payload.jobs.runByID({ id: job.id })
    expect(send).toHaveBeenCalledTimes(1)
    expect((send.mock.calls[0][0] as { text: string }).text).toContain('no longer exists')
  })

  it('sends nothing when the scheduled publish works', async () => {
    const admin = await createStaff(payload, 'admin')
    const draft = await payload.create({ collection: 'articles', data: article(), draft: true })
    const job = await schedule(draft.id, admin)
    const send = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    await payload.jobs.runByID({ id: job.id })
    expect(send).not.toHaveBeenCalled()
    const published = await payload.findByID({ collection: 'articles', id: draft.id })
    expect(published._status).toBe('published')
  })
})
