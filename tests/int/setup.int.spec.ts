import pg from 'pg'
import { describe, expect, it } from 'vitest'

import { getTestPayload } from '../helpers/payload'

describe('test setup', () => {
  it('uses the test database', () => {
    expect(new URL(process.env.DATABASE_URI ?? '').pathname).toBe('/noisy_streetss_test')
  })

  it('builds the tables in the test database when Payload starts', async () => {
    await getTestPayload()
    const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URI })
    await client.connect()
    const { rows } = await client.query("SELECT to_regclass('public.users') AS name")
    await client.end()
    expect(rows[0].name).toBe('users')
  })
})
