import { describe, expect, it } from 'vitest'

import { isAdminUser, isStaffUser } from '@/access'

describe('role checks', () => {
  it('treats admins and editors from users as staff', () => {
    expect(isStaffUser({ id: 1, role: 'admin', collection: 'users' })).toBe(true)
    expect(isStaffUser({ id: 2, role: 'editor', collection: 'users' })).toBe(true)
  })

  it('accepts a staff user passed to the Local API without a collection', () => {
    expect(isStaffUser({ id: 1, role: 'editor' })).toBe(true)
  })

  it('rejects visitors, unknown roles and other login collections', () => {
    expect(isStaffUser(null)).toBe(false)
    expect(isStaffUser(undefined)).toBe(false)
    expect(isStaffUser({ id: 1, role: 'member', collection: 'users' })).toBe(false)
    expect(isStaffUser({ id: 1, role: 'admin', collection: 'members' })).toBe(false)
  })

  it('only treats admins as admins', () => {
    expect(isAdminUser({ id: 1, role: 'admin', collection: 'users' })).toBe(true)
    expect(isAdminUser({ id: 2, role: 'editor', collection: 'users' })).toBe(false)
    expect(isAdminUser(null)).toBe(false)
  })
})
