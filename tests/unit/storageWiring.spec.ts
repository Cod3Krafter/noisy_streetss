import type { CollectionConfig, Config, Plugin } from 'payload'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { Manuscripts } from '@/collections/Manuscripts'
import { Media } from '@/collections/Media'
import { storagePlugins } from '@/storage'

const SETTINGS = {
  S3_BUCKET_MEDIA: 'dummy-media-bucket',
  S3_BUCKET_MANUSCRIPTS: 'dummy-manuscripts-bucket',
  S3_ENDPOINT: 'https://storage.example.test/storage/v1/s3',
  S3_REGION: 'dummy-region',
  S3_ACCESS_KEY_ID: 'dummy-key-id',
  S3_SECRET_ACCESS_KEY: 'dummy-secret',
}
const OFF = Object.fromEntries(Object.keys(SETTINGS).map((name) => [name, ''])) as Record<keyof typeof SETTINGS, string>

const saved = new Map<string, string | undefined>()

function useSettings(values: Record<string, string>): void {
  for (const [name, value] of Object.entries(values)) process.env[name] = value
}

beforeEach(() => {
  for (const name of Object.keys(SETTINGS)) saved.set(name, process.env[name])
})

afterEach(() => {
  for (const [name, value] of saved) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

/** Runs the real storage plugins over the real upload lists. Nothing connects to a bucket. */
async function withStorage(settings: Record<string, string>): Promise<{ media: CollectionConfig; manuscripts: CollectionConfig }> {
  useSettings(settings)
  let config = { collections: [Media, Manuscripts] } as Config
  for (const plugin of storagePlugins() as Plugin[]) config = await plugin(config)
  const find = (slug: string) => {
    const found = config.collections?.find((collection) => collection.slug === slug)
    if (!found) throw new Error(`No ${slug} collection after the storage plugins.`)
    return found
  }
  return { media: find('media'), manuscripts: find('manuscripts') }
}

const fieldNames = (collection: CollectionConfig) => collection.fields.map((field) => ('name' in field ? field.name : field.type))
const upload = (collection: CollectionConfig) => (typeof collection.upload === 'object' ? collection.upload : {})
const hookCount = (list: unknown) => (Array.isArray(list) ? list.length : 0)

describe('with the bucket settings present', () => {
  for (const slug of ['media', 'manuscripts'] as const) {
    it(`${slug} is wired to the adapter, off local disk`, async () => {
      const on = (await withStorage(SETTINGS))[slug]
      const off = (await withStorage(OFF))[slug]

      expect(upload(on).adapter).toBe('s3')
      expect(upload(on).disableLocalStorage).toBe(true)
      expect(upload(off).adapter).toBeUndefined()
      expect(upload(off).disableLocalStorage).toBeUndefined()

      // The adapter's static handler serves files through Payload, after the access check.
      expect(hookCount(upload(on).handlers)).toBe(hookCount(upload(off).handlers) + 1)
      expect(hookCount(on.hooks?.afterChange)).toBe(hookCount(off.hooks?.afterChange) + 1)
      expect(hookCount(on.hooks?.afterDelete)).toBe(hookCount(off.hooks?.afterDelete) + 1)
      expect(hookCount(on.hooks?.beforeChange)).toBeGreaterThan(hookCount(off.hooks?.beforeChange))
    })

    it(`${slug} keeps the same fields as with storage off, so switching it on needs no migration`, async () => {
      const on = (await withStorage(SETTINGS))[slug]
      const off = (await withStorage(OFF))[slug]
      expect(fieldNames(on)).toEqual(fieldNames(off))
      expect(fieldNames(on)).toEqual(expect.arrayContaining(['prefix', '_objectKey']))
    })
  }

  it('media keeps the same image sizes', async () => {
    const on = (await withStorage(SETTINGS)).media
    const off = (await withStorage(OFF)).media
    const names = (collection: CollectionConfig) => upload(collection).imageSizes?.map((size) => size.name)
    expect(names(on)).toEqual(names(off))
    expect(names(on)).toEqual(expect.arrayContaining(['thumbnail', 'card']))
  })

  it('switches each list on by its own bucket', async () => {
    const mediaOnly = await withStorage({ ...OFF, S3_BUCKET_MEDIA: SETTINGS.S3_BUCKET_MEDIA })
    expect(upload(mediaOnly.media).adapter).toBe('s3')
    expect(upload(mediaOnly.manuscripts).adapter).toBeUndefined()
  })
})
