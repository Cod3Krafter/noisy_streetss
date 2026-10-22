import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

import { createStaff, getTestPayload } from '../helpers/payload'

let payload: Payload
let admin: User
let editor: User

beforeAll(async () => {
  payload = await getTestPayload()
  admin = await createStaff(payload, 'admin')
  editor = await createStaff(payload, 'editor')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { contactEmail: 'hello@noisystreetss.test', formAlertEmail: 'inbox@noisystreetss.test' },
  })
})

describe('site settings', () => {
  it('shows visitors everything except the form alert address', async () => {
    const settings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: false })
    expect(settings.contactEmail).toBe('hello@noisystreetss.test')
    expect(settings.formAlertEmail).toBeUndefined()
  })

  it('lets editors see the alert address and change the settings', async () => {
    const updated = await payload.updateGlobal({
      slug: 'site-settings',
      data: { phone: '+234 800 000 0000' },
      overrideAccess: false,
      user: editor,
    })
    expect(updated.phone).toBe('+234 800 000 0000')
    expect(updated.formAlertEmail).toBe('inbox@noisystreetss.test')
  })
})

describe('shop settings', () => {
  it('is admin-only and starts with the agreed defaults', async () => {
    await expect(payload.findGlobal({ slug: 'shop-settings', overrideAccess: false, user: editor })).rejects.toThrow()
    await expect(payload.findGlobal({ slug: 'shop-settings', overrideAccess: false })).rejects.toThrow()
    const settings = await payload.findGlobal({ slug: 'shop-settings', overrideAccess: false, user: admin })
    expect(settings.memberDiscountPercent).toBe(20)
    expect(settings.unpaidOrderExpiryMinutes).toBe(30)
  })
})

describe('page records', () => {
  it('has one record per designed page', () => {
    const slugs = payload.config.globals.map((global) => global.slug).filter((slug) => slug.startsWith('page-'))
    expect(slugs).toHaveLength(20)
  })

  it('lets visitors read and editors change a page record, with SEO fields', async () => {
    await payload.updateGlobal({
      slug: 'page-home',
      data: { heading: 'Literature from the streets of Lagos', meta: { title: 'Noisy Streetss' } },
      overrideAccess: false,
      user: editor,
    })
    const home = await payload.findGlobal({ slug: 'page-home', overrideAccess: false })
    expect(home.heading).toBe('Literature from the streets of Lagos')
    expect(home.meta?.title).toBe('Noisy Streetss')
    await expect(
      payload.updateGlobal({ slug: 'page-home', data: { heading: 'Hacked' }, overrideAccess: false }),
    ).rejects.toThrow()
  })
})
