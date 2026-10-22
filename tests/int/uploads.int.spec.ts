import path from 'node:path'
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { samplePdf } from '@/seed/samplePdf'
import type { User } from '@/payload-types'

import { createStaff, getTestPayload } from '../helpers/payload'

const photo = path.resolve('public/images/unsplash/unsplash-1543002588-bfa74002ed7e.jpg')

let payload: Payload
let admin: User
let editor: User

beforeAll(async () => {
  payload = await getTestPayload()
  admin = await createStaff(payload, 'admin')
  editor = await createStaff(payload, 'editor')
})

describe('images', () => {
  it('lets an editor upload an image and makes the smaller sizes', async () => {
    const image = await payload.create({
      collection: 'media',
      data: { alt: 'A stack of books' },
      filePath: photo,
      overrideAccess: false,
      user: editor,
    })
    expect(image.sizes?.thumbnail?.filename).toBeTruthy()
    expect(image.sizes?.card?.filename).toBeTruthy()
  })

  it('requires alt text', async () => {
    await expect(
      payload.create({ collection: 'media', data: {} as { alt: string }, filePath: photo }),
    ).rejects.toThrow()
  })

  it('lets visitors see images but not upload them', async () => {
    const result = await payload.find({ collection: 'media', overrideAccess: false })
    expect(result.totalDocs).toBeGreaterThan(0)
    await expect(
      payload.create({ collection: 'media', data: { alt: 'Spam' }, filePath: photo, overrideAccess: false }),
    ).rejects.toThrow()
  })
})

describe('manuscripts', () => {
  it('lets an admin add a PDF', async () => {
    const doc = await payload.create({
      collection: 'manuscripts',
      data: {},
      file: samplePdf(),
      overrideAccess: false,
      user: admin,
    })
    expect(doc.mimeType).toBe('application/pdf')
  })

  it('refuses files over 10 MB', async () => {
    const data = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(11 * 1024 * 1024, 0x20)])
    await expect(
      payload.create({
        collection: 'manuscripts',
        data: {},
        file: { data, mimetype: 'application/pdf', name: 'too-big.pdf', size: data.length },
        user: admin,
      }),
    ).rejects.toThrow(/10 MB/)
  })

  it('measures the file itself, not the size it claims', async () => {
    const data = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(11 * 1024 * 1024, 0x20)])
    await expect(
      payload.create({
        collection: 'manuscripts',
        data: {},
        file: { data, mimetype: 'application/pdf', name: 'claims-small.pdf', size: 10 },
        user: admin,
      }),
    ).rejects.toThrow(/10 MB/)
  })

  it('refuses anything that is not a PDF or Word file', async () => {
    await expect(
      payload.create({ collection: 'manuscripts', data: {}, filePath: photo, user: admin }),
    ).rejects.toThrow()
  })

  it('lets editors read manuscripts but not add or delete them', async () => {
    const result = await payload.find({ collection: 'manuscripts', overrideAccess: false, user: editor })
    expect(result.totalDocs).toBeGreaterThan(0)
    await expect(
      payload.create({ collection: 'manuscripts', data: {}, file: samplePdf(), overrideAccess: false, user: editor }),
    ).rejects.toThrow()
    await expect(
      payload.delete({ collection: 'manuscripts', id: result.docs[0].id, overrideAccess: false, user: editor }),
    ).rejects.toThrow()
  })

  it('hides manuscripts from visitors', async () => {
    await expect(payload.find({ collection: 'manuscripts', overrideAccess: false })).rejects.toThrow()
  })
})
