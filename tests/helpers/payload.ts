import config from '@payload-config'
import path from 'node:path'
import { type CollectionSlug, getPayload, type Payload } from 'payload'
import { expect } from 'vitest'

import type { StaffRole } from '@/access'
import type { Media, User, Writer } from '@/payload-types'

const testPhoto = path.resolve('public/images/unsplash/unsplash-1543002588-bfa74002ed7e.jpg')

/** The Payload instance for tests. On first start it builds the tables in the test database. */
export function getTestPayload(): Promise<Payload> {
  return getPayload({ config })
}

let staffCount = 0

/** Creates a staff account with a unique address. */
export async function createStaff(payload: Payload, role: StaffRole): Promise<User> {
  staffCount += 1
  return payload.create({
    collection: 'users',
    data: {
      email: `${role}-${Date.now()}-${staffCount}@noisystreetss.test`,
      password: 'test-password-123',
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

/**
 * Empties the given collections, and every collection configured after the first of them.
 * Records in later collections can point at earlier ones (a manuscript submission at a
 * submission call, a popup at a book), and the foreign key refuses to delete a call that a
 * submission still names. Test files run in any order and share one database, so rows left by
 * another file must not block this one. Deleting in reverse config order, as the seed's wipe
 * does, removes the pointing records before the ones they point at.
 */
export async function resetCollections(payload: Payload, slugs: CollectionSlug[]): Promise<void> {
  const ordered = payload.config.collections.map((collection) => collection.slug as CollectionSlug)
  const first = Math.min(...slugs.map((slug) => ordered.indexOf(slug)))
  if (!Number.isFinite(first) || first < 0) throw new Error(`resetCollections: unknown collection in ${slugs.join(', ')}`)
  const doomed = new Set<CollectionSlug>([...slugs, ...ordered.slice(first)])
  for (const collection of [...payload.config.collections].reverse()) {
    const slug = collection.slug as CollectionSlug
    if (!doomed.has(slug)) continue
    await payload.db.deleteMany({ collection: slug, where: {} })
    if (collection.versions) await payload.db.deleteVersions({ collection: slug, where: {} })
  }
}
