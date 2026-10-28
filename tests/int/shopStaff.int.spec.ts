import { Forbidden, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { StockNavLink } from '@/components/admin/StockNavLink'
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
  /** Every collection and global in the finished config, Payload's own included, with its menu rule. */
  const everything = () => [...payload.config.collections, ...payload.config.globals].map((entity) => ({ slug: entity.slug as string, hidden: entity.admin?.hidden }))
  const hiddenFrom = (hidden: unknown, user: User) => (typeof hidden === 'function' ? Boolean((hidden as Rule)({ user })) : Boolean(hidden))

  /** Shown to nobody but admins, or to nobody at all: the shop side's own lists and Payload's internals. */
  const NOT_FOR_EDITORS = new Set(['orders', 'users', 'shop-settings', 'webhook-events'])

  it('shows shop staff only the Orders list, of every collection and global', () => {
    // Staff accounts and Shop settings are admin-only by their own rules, so shop staff do not see them either.
    expect(everything().filter(({ hidden }) => !hiddenFrom(hidden, shop)).map(({ slug }) => slug)).toEqual(['orders'])
  })

  it('shows editors every content list and setting, and none of the shop side', () => {
    const shown = everything().filter(({ hidden }) => !hiddenFrom(hidden, editor)).map(({ slug }) => slug)
    const content = everything()
      .map(({ slug }) => slug)
      .filter((slug) => !NOT_FOR_EDITORS.has(slug) && !slug.startsWith('payload-'))
    expect(content.length).toBeGreaterThan(20)
    expect(shown).toEqual(content)
  })

  it('gives shop staff and admins the Stock link, and editors none', () => {
    expect(StockNavLink({ user: shop } as never)).not.toBeNull()
    expect(StockNavLink({ user: { ...shop, role: 'admin' } } as never)).not.toBeNull()
    expect(StockNavLink({ user: editor } as never)).toBeNull()
  })
})
