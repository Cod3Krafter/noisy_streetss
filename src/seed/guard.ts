const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

/**
 * Why a connection string is not a local development or test database, or null when it is one: the
 * host is this machine, the query does not override the host, and the database is `noisy_streetss`
 * or ends in `_test`. A missing or malformed string is a problem too.
 */
function localDatabaseProblem(uri: string | undefined): string | null {
  if (!uri) return 'DATABASE_URI is not set.'
  let url: URL
  try {
    url = new URL(uri)
  } catch {
    return 'DATABASE_URI is not a valid connection string.'
  }
  const host = url.hostname
  if (!LOCAL_HOSTS.has(host)) return `The seed only runs against a local database, not ${host}.`
  if (url.searchParams.has('host') || url.searchParams.has('hostaddr')) {
    return 'The seed does not accept a host override in DATABASE_URI.'
  }
  const name = url.pathname.replace('/', '')
  if (name !== 'noisy_streetss' && !name.endsWith('_test')) {
    return `The seed only runs against the local noisy_streetss database or a _test database, not "${name}".`
  }
  return null
}

/** True only for a database on this machine that is safe to empty or reshape automatically. */
export function isLocalDatabase(uri: string | undefined): boolean {
  return localDatabaseProblem(uri) === null
}

/** The seed empties the database first, so it only ever runs against a local, non-production one. */
export function assertSafeToSeed(env: Record<string, string | undefined>): void {
  if (env.NODE_ENV === 'production') throw new Error('The seed never runs in production.')
  const problem = localDatabaseProblem(env.DATABASE_URI)
  if (problem) throw new Error(problem)
  if (env.S3_BUCKET_MEDIA || env.S3_BUCKET_MANUSCRIPTS) {
    throw new Error('The seed only runs with local file storage. Empty the S3 bucket settings first.')
  }
}
