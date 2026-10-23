import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

import { createStaff, getTestPayload } from '../helpers/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('version history', () => {
  it('is refused to a logged-in account that is not staff', async () => {
    const member = { id: 999999, collection: 'members' } as unknown as User
    await expect(
      payload.findVersions({ collection: 'articles', overrideAccess: false, user: member }),
    ).rejects.toThrow()
  })

  it('is readable by staff', async () => {
    const editor = await createStaff(payload, 'editor')
    const result = await payload.findVersions({ collection: 'articles', overrideAccess: false, user: editor })
    expect(Array.isArray(result.docs)).toBe(true)
  })
})
