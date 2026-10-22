import fs from 'node:fs'
import path from 'node:path'

/**
 * Loads .env, then points the database and upload folders at their test copies.
 * Throws if the test database name does not end in "_test", so a mistyped
 * setting can never empty the development database.
 */
export function applyTestEnvironment(): void {
  if (fs.existsSync('.env')) process.loadEnvFile('.env')

  const testUri = process.env.TEST_DATABASE_URI
  if (!testUri) {
    throw new Error('TEST_DATABASE_URI is missing. Copy it from .env.example into .env.')
  }
  if (!new URL(testUri).pathname.endsWith('_test')) {
    throw new Error('TEST_DATABASE_URI must name a database ending in "_test".')
  }

  process.env.DATABASE_URI = testUri
  process.env.MEDIA_DIR = path.resolve('.test-uploads/media')
  process.env.MANUSCRIPTS_DIR = path.resolve('.test-uploads/manuscripts')
  // No mail server in tests. Alert emails are checked with a spy on payload.sendEmail.
  process.env.SMTP_HOST = ''
  // Never upload test files to real storage, even once .env has bucket names.
  process.env.S3_BUCKET_MEDIA = ''
  process.env.S3_BUCKET_MANUSCRIPTS = ''
}
