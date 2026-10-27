import { describe, expect, it } from 'vitest'

import { isAdminUser, isAnyStaffUser, isShopUser, isStaffUser } from '@/access'

const admin = { id: 1, role: 'admin', collection: 'users' }
const editor = { id: 2, role: 'editor', collection: 'users' }
const shop = { id: 3, role: 'shop', collection: 'users' }

describe('role checks', () => {
  it('treats admins and editors from users as content staff', () => {
    expect(isStaffUser(admin)).toBe(true)
    expect(isStaffUser(editor)).toBe(true)
  })

  it('accepts a staff user passed to the Local API without a collection', () => {
    expect(isStaffUser({ id: 1, role: 'editor' })).toBe(true)
    expect(isShopUser({ id: 1, role: 'shop' })).toBe(true)
  })

  it('rejects visitors, unknown roles and other login collections', () => {
    expect(isStaffUser(null)).toBe(false)
    expect(isStaffUser(undefined)).toBe(false)
    expect(isStaffUser({ id: 1, role: 'member', collection: 'users' })).toBe(false)
    expect(isStaffUser({ id: 1, role: 'admin', collection: 'members' })).toBe(false)
  })

  it('only treats admins as admins', () => {
    expect(isAdminUser(admin)).toBe(true)
    expect(isAdminUser(editor)).toBe(false)
    expect(isAdminUser(shop)).toBe(false)
    expect(isAdminUser(null)).toBe(false)
  })

  it('keeps shop staff out of content', () => {
    expect(isStaffUser(shop)).toBe(false)
  })

  it('lets admins and shop staff work the shop, and not editors', () => {
    expect(isShopUser(admin)).toBe(true)
    expect(isShopUser(shop)).toBe(true)
    expect(isShopUser(editor)).toBe(false)
    expect(isShopUser({ id: 3, role: 'shop', collection: 'members' })).toBe(false)
    expect(isShopUser(null)).toBe(false)
  })

  it('counts all three roles as staff for opening the admin', () => {
    for (const user of [admin, editor, shop]) expect(isAnyStaffUser(user)).toBe(true)
    expect(isAnyStaffUser({ id: 9, role: 'shop', collection: 'members' })).toBe(false)
    expect(isAnyStaffUser({ id: 9, role: 'member', collection: 'users' })).toBe(false)
    expect(isAnyStaffUser(null)).toBe(false)
  })
})
