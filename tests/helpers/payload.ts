import config from '@payload-config'
import path from 'node:path'
import { type CollectionSlug, getPayload, handleEndpoints, type Payload } from 'payload'
import { expect } from 'vitest'

import type { StaffRole } from '@/access'
import type { Media, User, Writer } from '@/payload-types'
import { deleteInOrder } from '@/seed/deleteOrder'

const testPhoto = path.resolve('public/images/unsplash/unsplash-1543002588-bfa74002ed7e.jpg')

/** The Payload instance for tests. On first start it builds the tables in the test database. */
export function getTestPayload(): Promise<Payload> {
  return getPayload({ config })
}

/** The password every createStaff account gets. */
export const STAFF_PASSWORD = 'test-password-123'

let staffCount = 0

/**
 * Creates a staff account with a unique address and the role asked for. The first account ever
 * created is forced to admin, so on an empty users table a placeholder admin is made first;
 * otherwise a requested editor would quietly be an admin and the test would check nothing.
 */
export async function createStaff(payload: Payload, role: StaffRole): Promise<User> {
  if (role !== 'admin') {
    const { totalDocs } = await payload.count({ collection: 'users' })
    if (totalDocs === 0) await createStaff(payload, 'admin')
  }
  staffCount += 1
  const user = await payload.create({
    collection: 'users',
    data: {
      email: `${role}-${Date.now()}-${staffCount}@noisystreetss.test`,
      password: STAFF_PASSWORD,
      name: `Test ${role} ${staffCount}`,
      role,
    },
  })
  if (user.role !== role) {
    throw new Error(`createStaff asked for a "${role}" but the account came back as "${user.role}".`)
  }
  return user
}

/** An uploaded test image (the 1200 px prototype photo). */
export function createImage(payload: Payload): Promise<Media> {
  return payload.create({ collection: 'media', data: { alt: 'Test image' }, filePath: testPhoto })
}

let writerCount = 0

/** A published writer. */
export function createWriter(payload: Payload, name?: string): Promise<Writer> {
  writerCount += 1
  return payload.create({
    collection: 'writers',
    data: {
      name: name ?? `Test Writer ${writerCount}`,
      shortBio: 'Writes for the tests.',
      _status: 'published',
    },
  })
}

/**
 * Payload's ValidationError message only names the field ("The following field is invalid: formats").
 * The reason shown in the admin is in error.data.errors, so field rules are tested there.
 */
export async function expectFieldError(promise: Promise<unknown>, fieldPath: string, message: RegExp): Promise<void> {
  await expect(promise).rejects.toMatchObject({
    data: { errors: expect.arrayContaining([expect.objectContaining({ path: fieldPath, message: expect.stringMatching(message) })]) },
  })
}

/**
 * Empties the given collections, and every collection that points at one of them (a manuscript
 * submission at a submission call, a popup at a book), however far along. Test files run in any
 * order and share one database, so rows left by another file must not block this one. The order
 * is a dependency order (see deleteOrder), so a record that points at another goes first.
 */
export async function resetCollections(payload: Payload, slugs: CollectionSlug[]): Promise<void> {
  await deleteInOrder(payload, slugs)
}

/** A login token for an account made by createStaff, for REST requests. */
export async function tokenFor(payload: Payload, user: User): Promise<string> {
  const { token } = await payload.login({ collection: 'users', data: { email: user.email, password: STAFF_PASSWORD } })
  if (!token) throw new Error(`No login token for ${user.email}`)
  return token
}

/**
 * Sends a request through Payload's REST API: the same code that answers /api in the app,
 * so access rules, endpoints and error responses are all the real ones. `path` is relative
 * to /api, for example `/books/12`. Without a token the request comes from a visitor.
 */
export function rest(method: string, path: string, { body, token }: { body?: unknown; token?: string } = {}): Promise<Response> {
  const headers = new Headers()
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `JWT ${token}`)
  return handleEndpoints({
    config,
    request: new Request(`http://localhost:3000/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  })
}
