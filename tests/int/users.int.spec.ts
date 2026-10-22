import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { createStaff, getTestPayload, resetCollections } from '../helpers/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
  // Test files run in any order; the first account created must be the admin, so start empty.
  await resetCollections(payload, ['users'])
})

describe('staff accounts', () => {
  it('makes the very first account an admin, whatever role was asked for', async () => {
    await resetCollections(payload, ['users'])
    const first = await payload.create({
      collection: 'users',
      data: { email: 'first@noisystreetss.test', password: 'test-password-123', name: 'First', role: 'editor' },
    })
    expect(first.role).toBe('admin')
  })

  it('lets an admin create an editor', async () => {
    const admin = await createStaff(payload, 'admin')
    const editor = await payload.create({
      collection: 'users',
      data: { email: 'new-editor@noisystreetss.test', password: 'test-password-123', name: 'New', role: 'editor' },
      overrideAccess: false,
      user: admin,
    })
    expect(editor.role).toBe('editor')
  })

  it('stops an editor creating accounts', async () => {
    const editor = await createStaff(payload, 'editor')
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'sneaky@noisystreetss.test', password: 'test-password-123', name: 'Sneaky', role: 'admin' },
        overrideAccess: false,
        user: editor,
      }),
    ).rejects.toThrow()
  })

  it('shows an editor only their own account', async () => {
    const editor = await createStaff(payload, 'editor')
    await createStaff(payload, 'editor')
    const result = await payload.find({ collection: 'users', overrideAccess: false, user: editor })
    expect(result.docs.map((doc) => doc.id)).toEqual([editor.id])
  })

  it('stops an editor promoting themselves', async () => {
    const editor = await createStaff(payload, 'editor')
    const updated = await payload.update({
      collection: 'users',
      id: editor.id,
      data: { role: 'admin', name: 'Renamed' },
      overrideAccess: false,
      user: editor,
    })
    expect(updated.name).toBe('Renamed')
    expect(updated.role).toBe('editor')
  })

  it('lets an admin set and change roles', async () => {
    const admin = await createStaff(payload, 'admin')
    const newAdmin = await payload.create({
      collection: 'users',
      data: { email: 'second-admin@noisystreetss.test', password: 'test-password-123', name: 'Second Admin', role: 'admin' },
      overrideAccess: false,
      user: admin,
    })
    expect(newAdmin.role).toBe('admin')

    const editor = await createStaff(payload, 'editor')
    const promoted = await payload.update({
      collection: 'users',
      id: editor.id,
      data: { role: 'admin' },
      overrideAccess: false,
      user: admin,
    })
    expect(promoted.role).toBe('admin')
  })

  it('hides staff accounts from visitors', async () => {
    await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()
  })
})
