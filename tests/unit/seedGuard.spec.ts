import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { assertSafeToSeed, isLocalDatabase, schemaPushOffWarning } from '@/seed/guard'
import { emptyFieldData, mergeSeeded } from '@/seed/resetGlobals'

describe('assertSafeToSeed', () => {
  it('allows a database on this machine', () => {
    expect(() => assertSafeToSeed({ DATABASE_URI: 'postgresql://postgres:postgres@127.0.0.1:5432/noisy_streetss' })).not.toThrow()
    expect(() => assertSafeToSeed({ DATABASE_URI: 'postgresql://postgres:postgres@localhost:5432/noisy_streetss' })).not.toThrow()
  })

  it('refuses production', () => {
    expect(() =>
      assertSafeToSeed({ NODE_ENV: 'production', DATABASE_URI: 'postgresql://postgres:postgres@127.0.0.1:5432/x' }),
    ).toThrow(/production/)
  })

  it('refuses any other host', () => {
    expect(() =>
      assertSafeToSeed({ DATABASE_URI: 'postgresql://user:pass@db.abcdefgh.supabase.co:5432/postgres' }),
    ).toThrow(/local database/)
  })

  it('refuses a database that is not the local or a test one', () => {
    expect(() => assertSafeToSeed({ DATABASE_URI: 'postgresql://u:p@localhost:6543/postgres' })).toThrow(/noisy_streetss/)
  })

  it('refuses a host override in the query', () => {
    expect(() =>
      assertSafeToSeed({ DATABASE_URI: 'postgresql://u:p@localhost/noisy_streetss?host=remote.example' }),
    ).toThrow(/host override/)
  })

  it('refuses real file storage', () => {
    expect(() =>
      assertSafeToSeed({ DATABASE_URI: 'postgresql://u:p@localhost/noisy_streetss', S3_BUCKET_MEDIA: 'media' }),
    ).toThrow(/local file storage/)
  })

  it('allows the test database', () => {
    expect(() =>
      assertSafeToSeed({ DATABASE_URI: 'postgresql://postgres:postgres@127.0.0.1:5432/noisy_streetss_test' }),
    ).not.toThrow()
  })

  it('refuses a missing or broken connection string', () => {
    expect(() => assertSafeToSeed({})).toThrow(/DATABASE_URI/)
    expect(() => assertSafeToSeed({ DATABASE_URI: 'not a url' })).toThrow(/DATABASE_URI/)
  })
})

describe('isLocalDatabase', () => {
  it('is true for the local development and test databases', () => {
    expect(isLocalDatabase('postgresql://postgres:postgres@localhost:5432/noisy_streetss')).toBe(true)
    expect(isLocalDatabase('postgresql://postgres:postgres@127.0.0.1:5432/noisy_streetss')).toBe(true)
    expect(isLocalDatabase('postgresql://postgres:postgres@127.0.0.1:5432/noisy_streetss_test')).toBe(true)
  })

  it('is false for a Supabase-style host', () => {
    expect(isLocalDatabase('postgresql://user:pass@db.abcdefgh.supabase.co:5432/postgres')).toBe(false)
    expect(isLocalDatabase('postgresql://user:pass@aws-0-eu-west-1.pooler.supabase.com:6543/noisy_streetss')).toBe(false)
  })

  it('is false when the query overrides the host', () => {
    expect(isLocalDatabase('postgresql://u:p@localhost/noisy_streetss?host=remote.example')).toBe(false)
    expect(isLocalDatabase('postgresql://u:p@localhost/noisy_streetss?hostaddr=10.0.0.5')).toBe(false)
  })

  it('is false for another database name', () => {
    expect(isLocalDatabase('postgresql://u:p@localhost:5432/postgres')).toBe(false)
  })

  it('is false for a missing or malformed address', () => {
    expect(isLocalDatabase(undefined)).toBe(false)
    expect(isLocalDatabase('')).toBe(false)
    expect(isLocalDatabase('not a url')).toBe(false)
  })
})

describe('schemaPushOffWarning', () => {
  it('warns in development for a database that is not local, without naming the address', () => {
    const uri = 'postgresql://user:s3cret@db.abcdefgh.supabase.co:5432/postgres'
    const warning = schemaPushOffWarning({ NODE_ENV: 'development', DATABASE_URI: uri })
    expect(warning).toMatch(/not recognised as a local one/)
    expect(warning).not.toMatch(/s3cret|supabase/)
  })

  it('is silent for a local database and in production', () => {
    expect(schemaPushOffWarning({ DATABASE_URI: 'postgresql://u:p@localhost:5432/noisy_streetss' })).toBeNull()
    expect(schemaPushOffWarning({ NODE_ENV: 'production', DATABASE_URI: 'postgresql://u:p@db.x.supabase.co/postgres' })).toBeNull()
  })
})

describe('emptyFieldData', () => {
  it('empties plain fields, lists and groups, and sees through layout-only fields', () => {
    const fields: Field[] = [
      { name: 'heading', type: 'text' },
      { name: 'links', type: 'array', fields: [{ name: 'url', type: 'text' }] },
      { name: 'writers', type: 'relationship', relationTo: 'writers', hasMany: true },
      { name: 'image', type: 'upload', relationTo: 'media' },
      { name: 'meta', type: 'group', fields: [{ name: 'title', type: 'text' }, { name: 'image', type: 'upload', relationTo: 'media' }] },
      { type: 'row', fields: [{ name: 'phone', type: 'text' }] },
      { type: 'ui', name: 'note', admin: { components: {} } },
    ]
    expect(emptyFieldData(fields)).toEqual({
      heading: null,
      links: [],
      writers: [],
      image: null,
      meta: { title: null, image: null },
      phone: null,
    })
  })
})

describe('mergeSeeded', () => {
  it('empties the subfields of a group that the seed sets only partly', () => {
    const empty = { heading: null, meta: { title: null, description: null, image: null }, tags: [] }
    expect(mergeSeeded(empty, { heading: 'Home', meta: { title: 'Seeded' } })).toEqual({
      heading: 'Home',
      meta: { title: 'Seeded', description: null, image: null },
      tags: [],
    })
  })

  it('keeps lists and values whole, and ignores undefined', () => {
    expect(mergeSeeded({ links: [], image: null }, { links: [{ url: 'x' }], image: undefined })).toEqual({ links: [{ url: 'x' }], image: null })
  })
})
