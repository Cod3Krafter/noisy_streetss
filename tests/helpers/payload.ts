import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import type { StaffRole } from '@/access'
import type { User } from '@/payload-types'

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
