import { describe, expect, it } from 'vitest'

import { assertSafeToSeed } from '@/seed/guard'

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

  it('refuses a missing or broken connection string', () => {
    expect(() => assertSafeToSeed({})).toThrow(/DATABASE_URI/)
    expect(() => assertSafeToSeed({ DATABASE_URI: 'not a url' })).toThrow(/DATABASE_URI/)
  })
})
