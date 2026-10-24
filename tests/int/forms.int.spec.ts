import type { Payload } from 'payload'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import type { Manuscript, User } from '@/payload-types'
import { richText } from '@/seed/richText'
import { samplePdf } from '@/seed/samplePdf'

import { createStaff, expectFieldError, getTestPayload, rest } from '../helpers/payload'

const DAY = 24 * 60 * 60 * 1000
const fromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()

let payload: Payload
let admin: User
let editor: User
let file: Manuscript

const contact = (overrides: Record<string, unknown> = {}) => ({
  name: 'Ada Visitor',
  email: 'ada@example.com',
  message: 'Hello from the contact form.',
  status: 'new' as const,
  ...overrides,
})

beforeAll(async () => {
  payload = await getTestPayload()
  admin = await createStaff(payload, 'admin')
  editor = await createStaff(payload, 'editor')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { contactEmail: 'hello@noisystreetss.test', formAlertEmail: 'inbox@noisystreetss.test' },
  })
  file = await payload.create({ collection: 'manuscripts', data: {}, file: samplePdf() })
})

describe('visitors sending forms', () => {
  it('accepts an entry on each of the four simple forms', async () => {
    const entries = [
      { collection: 'contact-messages' as const, data: contact() },
      {
        collection: 'partnership-enquiries' as const,
        data: { name: 'Bola', organisation: 'Lagos Book Fair', email: 'bola@example.com', partnershipType: 'events', message: 'A stall?' },
      },
      {
        collection: 'bookstore-applications' as const,
        data: {
          storeName: 'Rovingheights',
          contactName: 'Tolu',
          email: 'tolu@example.com',
          phone: '+234 800 000 0001',
          address: { line1: '1 Admiralty Way', city: 'Lagos', state: 'Lagos' },
          storeType: 'independent',
        },
      },
      {
        collection: 'advisory-enquiries' as const,
        data: { name: 'Kemi', email: 'kemi@example.com', needs: 'Help planning a memoir.' },
      },
    ]
    for (const entry of entries) {
      const doc = await payload.create({ ...entry, overrideAccess: false } as Parameters<Payload['create']>[0])
      expect(doc.id).toBeTruthy()
    }
  })

  it('starts a visitor entry as New and drops any staff notes', async () => {
    const doc = await payload.create({
      collection: 'contact-messages',
      data: contact({ status: 'done', staffNotes: 'Planted note' }),
      overrideAccess: false,
    })
    const stored = await payload.findByID({ collection: 'contact-messages', id: doc.id })
    expect(stored.status).toBe('new')
    expect(stored.staffNotes ?? null).toBeNull()
  })

  it('sets the dates itself when a visitor sends their own, in the Local API and over REST', async () => {
    const fake = '2099-01-01T00:00:00.000Z'
    const local = await payload.create({
      collection: 'contact-messages',
      data: contact({ createdAt: fake, updatedAt: fake }),
      overrideAccess: false,
    })
    const res = await rest('POST', '/contact-messages', { body: contact({ createdAt: fake, updatedAt: fake }) })
    expect(res.status).toBe(201)
    const over = (await res.json()).doc
    for (const id of [local.id, over.id]) {
      const stored = await payload.findByID({ collection: 'contact-messages', id })
      expect(new Date(stored.createdAt).getFullYear()).toBeLessThan(2090)
      expect(new Date(stored.updatedAt).getFullYear()).toBeLessThan(2090)
    }
  })

  it('lets staff keep creating entries', async () => {
    const doc = await payload.create({ collection: 'contact-messages', data: contact({ status: 'done' }), user: admin, overrideAccess: false })
    expect(doc.status).toBe('done')
  })

  it('refuses an email address longer than 254 characters, and accepts exactly 254', async () => {
    const address = (length: number) => `${'a'.repeat(length - '@example.com'.length)}@example.com`
    await expectFieldError(
      payload.create({ collection: 'contact-messages', data: contact({ email: address(255) }), overrideAccess: false }),
      'email',
      /Keep the email address to 254 characters or fewer\./,
    )
    await expect(
      payload.create({ collection: 'contact-messages', data: contact({ email: address(254) }), overrideAccess: false }),
    ).resolves.toBeTruthy()
    await expectFieldError(
      payload.create({ collection: 'contact-messages', data: contact({ email: 'nope' }), overrideAccess: false }),
      'email',
      /valid email/i,
    )
  })

  it('never stores an entry with the hidden field filled in when server code saves it directly', async () => {
    const before = await payload.count({ collection: 'contact-messages' })
    await expect(
      payload.create({ collection: 'contact-messages', data: contact({ website: 'http://spam.example' }), overrideAccess: false }),
    ).rejects.toThrow()
    const after = await payload.count({ collection: 'contact-messages' })
    expect(after.totalDocs).toBe(before.totalDocs)
  })

  it('treats a non-string hidden field value as spam when server code saves it directly', async () => {
    await expect(
      payload.create({ collection: 'contact-messages', data: contact({ website: 1 as unknown as string }), overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('refuses an over-long contact message', async () => {
    await expectFieldError(
      payload.create({ collection: 'contact-messages', data: contact({ message: 'a'.repeat(5001) }), overrideAccess: false }),
      'message',
      /.+/,
    )
  })

  it('never lets visitors read entries', async () => {
    await expect(payload.find({ collection: 'contact-messages', overrideAccess: false })).rejects.toThrow()
  })
})

describe('the hidden spam field, for forms sent over the website', () => {
  const post = (slug: string, data: Record<string, unknown>) => rest('POST', `/${slug}`, { body: data })

  it('answers a bot with the usual success, but saves nothing and sends no alert', async () => {
    const send = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    const before = await payload.count({ collection: 'contact-messages' })
    const res = await post('contact-messages', contact({ website: 'http://spam.example' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.message).toBe('Contact message successfully created.')
    expect(body.doc).toMatchObject({ name: 'Ada Visitor', email: 'ada@example.com', status: 'new' })
    expect(body.doc).not.toHaveProperty('website')
    const after = await payload.count({ collection: 'contact-messages' })
    expect(after.totalDocs).toBe(before.totalDocs)
    expect(send).not.toHaveBeenCalled()
    send.mockRestore()
  })

  it('treats any value in the hidden field as spam, not only text', async () => {
    const before = await payload.count({ collection: 'contact-messages' })
    const res = await post('contact-messages', contact({ website: 1 }))
    expect(res.status).toBe(201)
    expect((await payload.count({ collection: 'contact-messages' })).totalDocs).toBe(before.totalDocs)
  })

  it('saves a real entry sent to the same address, and alerts staff', async () => {
    const send = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    const res = await post('contact-messages', contact({ message: 'A real visitor.', website: '' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.message).toBe('Contact message successfully created.')
    const stored = await payload.findByID({ collection: 'contact-messages', id: body.doc.id })
    expect(stored.message).toBe('A real visitor.')
    expect(send).toHaveBeenCalledTimes(1)
    send.mockRestore()
  })

  it('keeps the visitor rules for real entries: status starts New, staff notes are dropped', async () => {
    const res = await post('contact-messages', contact({ status: 'done', staffNotes: 'Planted note' }))
    const body = await res.json()
    const stored = await payload.findByID({ collection: 'contact-messages', id: body.doc.id })
    expect(stored.status).toBe('new')
    expect(stored.staffNotes ?? null).toBeNull()
  })

  it('still sends back field errors for a real entry', async () => {
    const res = await post('contact-messages', contact({ message: 'a'.repeat(5001) }))
    expect(res.status).toBe(400)
  })

  it('does the same on the other public forms', async () => {
    const before = await payload.count({ collection: 'partnership-enquiries' })
    const res = await post('partnership-enquiries', {
      name: 'Bot',
      organisation: 'Spam Ltd',
      email: 'bot@example.com',
      partnershipType: 'events',
      message: 'Buy now',
      website: 'http://spam.example',
    })
    expect(res.status).toBe(201)
    expect((await res.json()).message).toBe('Partnership enquiry successfully created.')
    expect((await payload.count({ collection: 'partnership-enquiries' })).totalDocs).toBe(before.totalDocs)
  })

  it('gives no pretend success where visitors may not post at all', async () => {
    const res = await post('manuscript-submissions', { name: 'Bot', website: 'http://spam.example' })
    expect(res.status).toBe(403)
  })
})

describe('staff alerts', () => {
  it('emails the alert address, naming the form and linking to the entry', async () => {
    const send = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    const doc = await payload.create({ collection: 'contact-messages', data: contact(), overrideAccess: false })
    expect(send).toHaveBeenCalledTimes(1)
    const message = send.mock.calls[0][0]
    expect(message.to).toBe('inbox@noisystreetss.test')
    expect(message.subject).toBe('New contact message on the website')
    expect(String(message.text)).toContain(`/admin/collections/contact-messages/${doc.id}`)
    send.mockRestore()
  })

  it('still saves the entry when the email fails', async () => {
    const send = vi.spyOn(payload, 'sendEmail').mockRejectedValue(new Error('SMTP down'))
    const doc = await payload.create({ collection: 'contact-messages', data: contact(), overrideAccess: false })
    expect(doc.id).toBeTruthy()
    send.mockRestore()
  })
})

describe('staff handling entries', () => {
  it('lets editors read and update entries but not delete them; admins can delete', async () => {
    const doc = await payload.create({ collection: 'contact-messages', data: contact() })
    const updated = await payload.update({
      collection: 'contact-messages',
      id: doc.id,
      data: { status: 'in-progress', staffNotes: 'Replying today.' },
      overrideAccess: false,
      user: editor,
    })
    expect(updated.status).toBe('in-progress')
    await expect(
      payload.delete({ collection: 'contact-messages', id: doc.id, overrideAccess: false, user: editor }),
    ).rejects.toThrow()
    await payload.delete({ collection: 'contact-messages', id: doc.id, overrideAccess: false, user: admin })
  })
})

describe('manuscript submissions', () => {
  const call = (title: string, opensInDays: number, closesInDays: number) =>
    payload.create({
      collection: 'submission-calls',
      data: {
        title,
        themeSummary: 'A theme.',
        guidelines: richText('Up to 5,000 words.'),
        opensAt: fromNow(opensInDays),
        closesAt: fromNow(closesInDays),
        _status: 'published',
      },
    })

  const submission = (callId: number) => ({
    call: callId,
    name: 'Chidi Writer',
    email: 'chidi@example.com',
    workTitle: 'Harmattan Letters',
    shortBio: 'Writes from Enugu.',
    file: file.id,
    status: 'new' as const,
  })

  it('accepts a manuscript for an open call', async () => {
    const open = await call('Open for forms', -2, 10)
    const doc = await payload.create({ collection: 'manuscript-submissions', data: submission(open.id) })
    expect(doc.status).toBe('new')
  })

  it('refuses closed and upcoming calls', async () => {
    const closed = await call('Closed for forms', -20, -1)
    const upcoming = await call('Upcoming for forms', 5, 20)
    await expectFieldError(
      payload.create({ collection: 'manuscript-submissions', data: submission(closed.id) }),
      'call',
      /not open/,
    )
    await expectFieldError(
      payload.create({ collection: 'manuscript-submissions', data: submission(upcoming.id) }),
      'call',
      /not open/,
    )
  })

  it('refuses a manuscript submission posted directly by a visitor', async () => {
    const open = await call('Open for direct post', -2, 10)
    await expect(
      payload.create({ collection: 'manuscript-submissions', data: submission(open.id), overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('attaches one file to one submission only', async () => {
    const open = await call('Open for one file', -2, 10)
    const own = await payload.create({ collection: 'manuscripts', data: {}, file: samplePdf() })
    await payload.create({ collection: 'manuscript-submissions', data: { ...submission(open.id), file: own.id } })
    await expectFieldError(
      payload.create({ collection: 'manuscript-submissions', data: { ...submission(open.id), file: own.id } }),
      'file',
      /already attached/,
    )
  })

  it('refuses an odd call value', async () => {
    await expectFieldError(
      payload.create({ collection: 'manuscript-submissions', data: submission('abc' as unknown as number) }),
      'call',
      /Choose a submission call/,
    )
  })

  it('accepts a call id sent as a numeric string', async () => {
    const open = await call('Open for string ids', -2, 10)
    const ownFile = await payload.create({ collection: 'manuscripts', data: {}, file: samplePdf('string-id.pdf') })
    const doc = await payload.create({
      collection: 'manuscript-submissions',
      data: { ...submission(open.id), call: String(open.id) as unknown as number, file: ownFile.id },
    })
    expect(doc.id).toBeTruthy()
  })
})
