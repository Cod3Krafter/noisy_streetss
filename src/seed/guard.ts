const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

/** The seed empties the database first, so it only ever runs against a local, non-production one. */
export function assertSafeToSeed(env: Record<string, string | undefined>): void {
  if (env.NODE_ENV === 'production') throw new Error('The seed never runs in production.')
  const uri = env.DATABASE_URI
  if (!uri) throw new Error('DATABASE_URI is not set.')
  let url: URL
  try {
    url = new URL(uri)
  } catch {
    throw new Error('DATABASE_URI is not a valid connection string.')
  }
  const host = url.hostname
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`The seed only runs against a local database, not ${host}.`)
  }
  if (url.searchParams.has('host') || url.searchParams.has('hostaddr')) {
    throw new Error('The seed does not accept a host override in DATABASE_URI.')
  }
  const name = url.pathname.replace('/', '')
  if (name !== 'noisy_streetss' && !name.endsWith('_test')) {
    throw new Error(`The seed only runs against the local noisy_streetss database or a _test database, not "${name}".`)
  }
  if (env.S3_BUCKET_MEDIA || env.S3_BUCKET_MANUSCRIPTS) {
    throw new Error('The seed only runs with local file storage. Empty the S3 bucket settings first.')
  }
}
