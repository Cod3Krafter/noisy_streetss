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

describe('storage adapter fields stay out of the file lists', () => {
  for (const slug of ['media', 'manuscripts'] as const) {
    for (const name of ['prefix', '_objectKey']) {
      it(`${slug}.${name} is not offered as a list column or filter`, () => {
        const collection = payload.config.collections.find((c) => c.slug === slug)
        const field = collection?.fields.find((f) => 'name' in f && f.name === name)
        expect(field?.admin).toMatchObject({ disableListColumn: true, disableListFilter: true })
      })
    }
  }

  it('manuscripts lists the file name, size and date by default', () => {
    const collection = payload.config.collections.find((c) => c.slug === 'manuscripts')
    expect(collection?.admin?.defaultColumns).toEqual(['filename', 'filesize', 'createdAt'])
  })
})
