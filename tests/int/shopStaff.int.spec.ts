import { Forbidden, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

import { createStaff, createWriter, getTestPayload, rest, tokenFor } from '../helpers/payload'

let payload: Payload
let shop: User
let editor: User

type Rule = (args: { user: unknown }) => boolean

beforeAll(async () => {
  payload = await getTestPayload()
  shop = await createStaff(payload, 'shop')
  editor = await createStaff(payload, 'editor')
})

describe('a shop staff account', () => {
  it('may open the admin', async () => {
    const rule = payload.collections.users.config.access.admin
    expect(await rule?.({ req: { user: shop } } as never)).toBe(true)
    expect(await rule?.({ req: { user: { ...shop, collection: 'members' } } } as never)).toBe(false)
  })

  it('logs in over REST', async () => {
    const res = await rest('GET', '/users/me', { token: await tokenFor(payload, shop) })
    expect(res.status).toBe(200)
    expect(((await res.json()) as { user: { role: string } }).user.role).toBe('shop')
  })

  it('renames its own account, but cannot change its role or read other accounts', async () => {
    const renamed = await payload.update({
      collection: 'users',
      id: shop.id,
      data: { name: 'Packer', role: 'admin' },
      overrideAccess: false,
      user: shop,
    })
    expect(renamed.name).toBe('Packer')
    expect(renamed.role).toBe('shop')
    await expect(payload.findByID({ collection: 'users', id: editor.id, overrideAccess: false, user: shop })).rejects.toThrow()
  })

  it('cannot change content or read drafts', async () => {
    await expect(
      payload.create({ collection: 'writers', data: { name: 'Not allowed', shortBio: 'x', _status: 'published' }, overrideAccess: false, user: shop }),
    ).rejects.toBeInstanceOf(Forbidden)
    const draft = await payload.create({ collection: 'writers', data: { name: 'Draft writer', shortBio: 'x' }, draft: true })
    const seen = await payload.find({ collection: 'writers', where: { id: { equals: draft.id } }, draft: true, overrideAccess: false, user: shop })
    expect(seen.docs).toHaveLength(0)
  })

  it('cannot read form entries or shop settings', async () => {
    await expect(payload.find({ collection: 'contact-messages', overrideAccess: false, user: shop })).rejects.toBeInstanceOf(Forbidden)
    await expect(payload.findGlobal({ slug: 'shop-settings', overrideAccess: false, user: shop })).rejects.toThrow()
  })

  it("may hold Payload's edit locks, so it can open records in the admin", async () => {
    const writer = await createWriter(payload)
    const lock = await payload.create({
      collection: 'payload-locked-documents',
      data: { document: { relationTo: 'writers', value: writer.id }, user: { relationTo: 'users', value: shop.id } } as never,
      overrideAccess: false,
      user: shop,
    })
    expect(lock.id).toBeTruthy()
  })
})

describe('the admin menu', () => {
  it('hides content lists and settings from shop staff and shows them to editors', () => {
    const books = payload.collections.books.config.admin.hidden as Rule
    const site = payload.config.globals.find((global) => global.slug === 'site-settings')?.admin?.hidden as Rule
    for (const hidden of [books, site]) {
      expect(hidden({ user: shop })).toBe(true)
      expect(hidden({ user: editor })).toBe(false)
    }
  })
})
