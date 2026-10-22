import config from '@payload-config'
import path from 'node:path'
import { getPayload, type Payload } from 'payload'

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
