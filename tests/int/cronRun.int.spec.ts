import fs from 'node:fs'
import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Category, Media, Writer } from '@/payload-types'
import { richText } from '@/seed/richText'

import { createImage, createStaff, createWriter, getTestPayload, rest } from '../helpers/payload'

const CRON_SECRET = 'c'.repeat(32)
const RUN_PATH = '/payload-jobs/run'

let payload: Payload
let cover: Media
let writer: Writer
let category: Category
let previousSecret: string | undefined
const queued: number[] = []

beforeAll(async () => {
  previousSecret = process.env.CRON_SECRET
  process.env.CRON_SECRET = CRON_SECRET
  payload = await getTestPayload()
  await createStaff(payload, 'admin')
  cover = await createImage(payload)
  writer = await createWriter(payload)
  category = await payload.create({ collection: 'categories', data: { name: 'Cron run' } })
})

afterAll(async () => {
  if (previousSecret === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = previousSecret
  await payload.db.deleteMany({ collection: 'payload-jobs', where: { id: { in: queued } } })
})

describe("Vercel Cron's call to the job runner", () => {
  it('is pointed at the endpoint Payload serves', () => {
    const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8')) as { crons: { path: string }[] }
    expect(vercel.crons.map((cron) => cron.path)).toEqual([`/api${RUN_PATH}`])
  })

  it('is refused without the secret or with a wrong one, and publishes a due article with the right one', async () => {
    const admin = await createStaff(payload, 'admin')
    const draft = await payload.create({
      collection: 'articles',
      data: {
        title: 'Published by the cron call',
        cover: cover.id,
        summary: 'A test article.',
        body: richText('The first paragraph.'),
        writers: [writer.id],
        categories: [category.id],
        publishDate: new Date().toISOString(),
      },
      draft: true,
    })
    const job = await payload.jobs.queue({
      task: 'schedulePublish',
      input: {
        type: 'publish',
        doc: { relationTo: 'articles', value: String(draft.id) as unknown as number },
        user: { relationTo: 'users', value: admin.id },
      },
      waitUntil: new Date(Date.now() - 60_000),
    })
    queued.push(job.id)

    const visible = async () => (await rest('GET', `/articles/${draft.id}`)).status
    expect(await visible()).not.toBe(200)

    const none = await rest('GET', RUN_PATH)
    expect(none.status).toBe(401)
    const wrong = await rest('GET', RUN_PATH, { headers: { Authorization: `Bearer ${'x'.repeat(32)}` } })
    expect(wrong.status).toBe(401)
    expect((await payload.findByID({ collection: 'articles', id: draft.id, draft: true }))._status).toBe('draft')
    expect(await visible()).not.toBe(200)

    const right = await rest('GET', RUN_PATH, { headers: { Authorization: `Bearer ${CRON_SECRET}` } })
    expect(right.status).toBe(200)
    const after = await rest('GET', `/articles/${draft.id}`)
    expect(after.status).toBe(200)
    expect(((await after.json()) as { _status: string })._status).toBe('published')
  })
})
