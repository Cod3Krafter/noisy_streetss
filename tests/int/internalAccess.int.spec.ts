import config from '@payload-config'
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

import { createStaff, createWriter, getTestPayload } from '../helpers/payload'

let payload: Payload
let staff: User
let documentId: number | string

// A logged-in account that is not staff, as a member will be once member logins exist.
const member = { id: 999999, collection: 'members' } as unknown as User

beforeAll(async () => {
  payload = await getTestPayload()
  staff = await createStaff(payload, 'editor')
  const writer = await createWriter(payload)
  documentId = writer.id
})

const lockData = () => ({ document: { relationTo: 'writers', value: documentId }, user: { relationTo: 'users', value: staff.id } }) as never

describe('automatic schema push', () => {
  it('is on for the local test database', () => {
    expect((payload.db as unknown as { push?: boolean }).push).toBe(true)
  })
})

describe("Payload's edit locks", () => {
  it('refuse a member for every operation', async () => {
    const lock = await payload.create({ collection: 'payload-locked-documents', data: lockData(), overrideAccess: true })
    await expect(payload.find({ collection: 'payload-locked-documents', overrideAccess: false, user: member })).rejects.toThrow()
    await expect(
      payload.create({ collection: 'payload-locked-documents', data: lockData(), overrideAccess: false, user: member }),
    ).rejects.toThrow()
    await expect(
      payload.update({ collection: 'payload-locked-documents', id: lock.id, data: {}, overrideAccess: false, user: member }),
    ).rejects.toThrow()
    await expect(
      payload.delete({ collection: 'payload-locked-documents', id: lock.id, overrideAccess: false, user: member }),
    ).rejects.toThrow()
  })

  it('let staff create and read one', async () => {
    const lock = await payload.create({
      collection: 'payload-locked-documents',
      data: lockData(),
      overrideAccess: false,
      user: staff,
    })
    const found = await payload.find({ collection: 'payload-locked-documents', overrideAccess: false, user: staff })
    expect(found.docs.some((doc) => doc.id === lock.id)).toBe(true)
  })

  it('are not readable by a visitor', async () => {
    await expect(payload.find({ collection: 'payload-locked-documents', overrideAccess: false })).rejects.toThrow()
  })

  it('have access functions that refuse a member directly', async () => {
    const sanitised = await config
    const locks = sanitised.collections.find((collection) => collection.slug === 'payload-locked-documents')
    expect(locks).toBeDefined()
    const args = (user: unknown) => ({ req: { user } }) as never
    for (const operation of ['read', 'create', 'update', 'delete'] as const) {
      const rule = locks?.access?.[operation]
      expect(rule, operation).toBeTypeOf('function')
      expect(await rule?.(args(member)), operation).toBe(false)
      expect(await rule?.(args(null)), operation).toBe(false)
      expect(await rule?.(args(staff)), operation).toBe(true)
    }
  })

  it('also protect the scheduled jobs stats when that global exists', async () => {
    const sanitised = await config
    const stats = sanitised.globals.find((global) => (global.slug as string) === 'payload-jobs-stats')
    if (!stats) return
    for (const operation of ['read', 'update'] as const) {
      const rule = stats.access?.[operation]
      expect(await rule?.({ req: { user: member } } as never), operation).toBe(false)
    }
  })
})
