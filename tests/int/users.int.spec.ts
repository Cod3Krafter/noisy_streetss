import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { createStaff, expectFieldError, getTestPayload, resetCollections, rest, tokenFor } from '../helpers/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
  // Test files run in any order; the first account created must be the admin, so start empty.
  await resetCollections(payload, ['users'])
  // The first account is always an admin. Seeding one here means a test that makes an editor
  // gets an editor whatever order the tests run in.
  await createStaff(payload, 'admin')
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

describe('the last admin', () => {
  const message = /at least one admin/

  it('cannot be deleted, demoted, and demoting works once another admin exists', async () => {
    await resetCollections(payload, ['users'])
    const admin = await createStaff(payload, 'admin')
    const editor = await createStaff(payload, 'editor')

    await expect(payload.delete({ collection: 'users', id: admin.id })).rejects.toThrow(message)
    await expectFieldError(payload.update({ collection: 'users', id: admin.id, data: { role: 'editor' } }), 'role', message)

    await payload.update({ collection: 'users', id: editor.id, data: { role: 'admin' } })
    const demoted = await payload.update({ collection: 'users', id: admin.id, data: { role: 'editor' } })
    expect(demoted.role).toBe('editor')
  })

  it('still lets an editor be deleted, and an admin change other fields', async () => {
    await resetCollections(payload, ['users'])
    const admin = await createStaff(payload, 'admin')
    const editor = await createStaff(payload, 'editor')
    await payload.delete({ collection: 'users', id: editor.id })
    const renamed = await payload.update({ collection: 'users', id: admin.id, data: { name: 'Renamed' } })
    expect(renamed.name).toBe('Renamed')
  })
})

describe('the last admin under bulk actions', () => {
  const message = /at least one admin/

  async function twoAdminsAndAnEditor() {
    await resetCollections(payload, ['users'])
    await createStaff(payload, 'admin')
    await createStaff(payload, 'admin')
    await createStaff(payload, 'editor')
  }

  const adminCount = async () => (await payload.count({ collection: 'users', where: { role: { equals: 'admin' } } })).totalDocs

  it('refuses each admin when a bulk delete targets every admin, and deletes none of them', async () => {
    await twoAdminsAndAnEditor()
    const result = await payload.delete({ collection: 'users', where: { role: { equals: 'admin' } } })
    expect(result.docs).toHaveLength(0)
    expect(result.errors).toHaveLength(2)
    for (const error of result.errors) expect(error.message).toMatch(message)
    expect(await adminCount()).toBe(2)
  })

  it('deletes the editor and refuses the admin when the only admin is selected with an editor', async () => {
    await resetCollections(payload, ['users'])
    const admin = await createStaff(payload, 'admin')
    const editor = await createStaff(payload, 'editor')
    const result = await payload.delete({ collection: 'users', where: { id: { in: [admin.id, editor.id] } } })
    expect(result.docs.map((doc) => doc.id)).toEqual([editor.id])
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].id).toBe(admin.id)
    expect(result.errors[0].message).toMatch(message)
    expect(await adminCount()).toBe(1)
  })

  it('answers a REST bulk delete of the only admin with docs and errors, the shape the list view reads', async () => {
    await resetCollections(payload, ['users'])
    const admin = await createStaff(payload, 'admin')
    const token = await tokenFor(payload, admin)
    const response = await rest('DELETE', `/users?where[id][in]=${admin.id}`, { token })
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.docs).toEqual([])
    expect(json.errors[0].message).toMatch(message)
    expect(await adminCount()).toBe(1)
  })

  it('refuses deleting the only admin by a string id', async () => {
    await resetCollections(payload, ['users'])
    const admin = await createStaff(payload, 'admin')
    await expect(payload.delete({ collection: 'users', id: String(admin.id) })).rejects.toThrow(message)
    expect(await adminCount()).toBe(1)
  })

  it('refuses deleting the only admin by an oddly written id', async () => {
    await resetCollections(payload, ['users'])
    const admin = await createStaff(payload, 'admin')
    for (const id of [`0${admin.id}`, `${admin.id}.0`, ` ${admin.id}`]) {
      await expect(payload.delete({ collection: 'users', id })).rejects.toThrow(message)
    }
    expect(await adminCount()).toBe(1)
  })

  it('still refuses a single delete by id, over REST as well', async () => {
    await resetCollections(payload, ['users'])
    const admin = await createStaff(payload, 'admin')
    const token = await tokenFor(payload, admin)
    await expect(payload.delete({ collection: 'users', id: admin.id })).rejects.toThrow(message)
    const response = await rest('DELETE', `/users/${admin.id}`, { token })
    expect(response.status).toBe(400)
    expect(JSON.stringify(await response.json())).toMatch(message)
    expect(await adminCount()).toBe(1)
  })

  it('refuses a bulk demotion of every admin', async () => {
    await twoAdminsAndAnEditor()
    await expectFieldError(
      payload.update({ collection: 'users', where: { role: { equals: 'admin' } }, data: { role: 'editor' } }),
      'role',
      message,
    )
    expect(await adminCount()).toBe(2)
  })

  it('allows a bulk delete that leaves an admin', async () => {
    await twoAdminsAndAnEditor()
    await payload.delete({ collection: 'users', where: { role: { equals: 'editor' } } })
    expect(await adminCount()).toBe(2)
  })
})
