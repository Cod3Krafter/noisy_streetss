import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { assertSafeToSeed } from '@/seed/guard'
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
