import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { getTestPayload } from '../helpers/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

/**
 * The S3 adapter adds `prefix` and `_objectKey` to the collections it serves. It is off locally,
 * so without alwaysInsertFields the migration would be generated without those columns and
 * production, where the adapter is on, would fail.
 */
describe('storage adapter fields stay in the schema when the adapter is off', () => {
  for (const slug of ['media', 'manuscripts'] as const) {
    it(`${slug} has the _objectKey field`, () => {
      const collection = payload.config.collections.find((c) => c.slug === slug)
      const names = collection?.fields.map((f) => ('name' in f ? f.name : undefined))
      expect(names).toContain('_objectKey')
    })
  }
})
