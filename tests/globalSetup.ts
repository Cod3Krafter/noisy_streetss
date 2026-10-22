import fs from 'node:fs'
import pg from 'pg'

import { applyTestEnvironment } from './env'

/** Runs once before all test files: empties the test database and test uploads. */
export default async function setup(): Promise<void> {
  applyTestEnvironment()

  const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URI })
  await client.connect()
  await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;')
  await client.end()

  fs.rmSync('.test-uploads', { recursive: true, force: true })
}
