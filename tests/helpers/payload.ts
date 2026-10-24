import config from '@payload-config'
import path from 'node:path'
import { type CollectionSlug, getPayload, handleEndpoints, type Payload } from 'payload'
import { expect } from 'vitest'

import type { StaffRole } from '@/access'
import type { Media, User, Writer } from '@/payload-types'

const testPhoto = path.resolve('public/images/unsplash/unsplash-1543002588-bfa74002ed7e.jpg')

/** The Payload instance for tests. On first start it builds the tables in the test database. */
export function getTestPayload(): Promise<Payload> {
  return getPayload({ config })
}

/** The password every createStaff account gets. */
export const STAFF_PASSWORD = 'test-password-123'

let staffCount = 0

/** Creates a staff account with a unique address. */
export async function createStaff(payload: Payload, role: StaffRole): Promise<User> {
  staffCount += 1
  return payload.create({
    collection: 'users',
    data: {
      email: `${role}-${Date.now()}-${staffCount}@noisystreetss.test`,
      password: STAFF_PASSWORD,
      name: `Test ${role} ${staffCount}`,
      role,
    },
  })
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

type FieldNode = { type?: string; relationTo?: string | string[]; flattenedFields?: FieldNode[]; blocks?: { flattenedFields?: FieldNode[] }[] }

/** Every collection slug the given fields point at, looking inside groups, arrays and blocks. */
function pointedAt(fields: FieldNode[] | undefined, into: Set<string>): void {
  for (const field of fields ?? []) {
    if ((field.type === 'relationship' || field.type === 'upload') && field.relationTo) {
      for (const slug of [field.relationTo].flat()) into.add(slug)
    }
    pointedAt(field.flattenedFields, into)
    for (const block of field.blocks ?? []) pointedAt(block.flattenedFields, into)
  }
}

/**
 * Empties the given collections, and every collection that points at one of them (a manuscript
 * submission at a submission call, a popup at a book), however far along. Test files run in any
 * order and share one database, so rows left by another file must not block this one. The
 * dependents come from the relationship fields themselves, not from the order of the config, so
 * the admin menu order does not matter here. They are deleted before the records they point at.
 */
export async function resetCollections(payload: Payload, slugs: CollectionSlug[]): Promise<void> {
  const known = new Set<string>(payload.config.collections.map((collection) => collection.slug))
  const unknown = slugs.filter((slug) => !known.has(slug))
  if (unknown.length > 0) throw new Error(`resetCollections: unknown collection in ${unknown.join(', ')}`)

  const targets = new Map<string, Set<string>>()
  for (const collection of payload.config.collections) {
    const into = new Set<string>()
    pointedAt(collection.flattenedFields as FieldNode[], into)
    targets.set(collection.slug, into)
  }

  const doomed = new Set<string>(slugs)
  for (let grew = true; grew; ) {
    grew = false
    for (const [slug, pointsAt] of targets) {
      if (doomed.has(slug)) continue
      if ([...pointsAt].some((target) => doomed.has(target))) {
        doomed.add(slug)
        grew = true
      }
    }
  }

  // Dependents first: repeatedly take a doomed collection that no other doomed one still points at.
  const remaining = new Set(doomed)
  while (remaining.size > 0) {
    const next =
      [...remaining].find((slug) => ![...remaining].some((other) => other !== slug && targets.get(other)?.has(slug))) ??
      [...remaining][0]
    remaining.delete(next)
    const collection = payload.config.collections.find((candidate) => candidate.slug === next)
    await payload.db.deleteMany({ collection: next as CollectionSlug, where: {} })
    if (collection?.versions) await payload.db.deleteVersions({ collection: next as CollectionSlug, where: {} })
  }
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
