import type { CollectionConfig, GlobalConfig } from 'payload'
import { describe, expect, it } from 'vitest'

import { hideContentFromShopStaff } from '@/access/hideContent'

const admin = { id: 1, role: 'admin', collection: 'users' }
const editor = { id: 2, role: 'editor', collection: 'users' }
const shop = { id: 3, role: 'shop', collection: 'users' }

type Rule = (args: { user: unknown }) => boolean
const ruleOf = (entity: { admin?: { hidden?: unknown } }) => entity.admin?.hidden as Rule

describe('hideContentFromShopStaff', () => {
  it('hides a content list from shop staff and shows it to admins and editors', () => {
    const [books] = hideContentFromShopStaff([{ slug: 'books', fields: [] } as CollectionConfig])
    expect(ruleOf(books)({ user: shop })).toBe(true)
    expect(ruleOf(books)({ user: editor })).toBe(false)
    expect(ruleOf(books)({ user: admin })).toBe(false)
  })

  it("keeps a list's own rule for content staff", () => {
    const adminOnly: Rule = ({ user }) => (user as { role?: string }).role !== 'admin'
    const [secret] = hideContentFromShopStaff([{ slug: 'secret', fields: [], admin: { hidden: adminOnly } } as unknown as CollectionConfig])
    expect(ruleOf(secret)({ user: editor })).toBe(true)
    expect(ruleOf(secret)({ user: admin })).toBe(false)
    expect(ruleOf(secret)({ user: shop })).toBe(true)
    const [always] = hideContentFromShopStaff([{ slug: 'always', fields: [], admin: { hidden: true } } as CollectionConfig])
    expect(ruleOf(always)({ user: admin })).toBe(true)
  })

  it('leaves the shop side alone', () => {
    const entities = [{ slug: 'orders', fields: [] }, { slug: 'users', fields: [] }] as CollectionConfig[]
    expect(hideContentFromShopStaff(entities)).toEqual(entities)
    const [settings] = hideContentFromShopStaff([{ slug: 'shop-settings', fields: [] } as GlobalConfig])
    expect(settings.admin?.hidden).toBeUndefined()
  })

  it('works on globals', () => {
    const [site] = hideContentFromShopStaff([{ slug: 'site-settings', fields: [] } as GlobalConfig])
    expect(ruleOf(site)({ user: shop })).toBe(true)
    expect(ruleOf(site)({ user: editor })).toBe(false)
  })
})
