const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

/** The seed empties the database first, so it only ever runs against a local, non-production one. */
export function assertSafeToSeed(env: Record<string, string | undefined>): void {
  if (env.NODE_ENV === 'production') throw new Error('The seed never runs in production.')
  const uri = env.DATABASE_URI
  if (!uri) throw new Error('DATABASE_URI is not set.')
  let host: string
  try {
    host = new URL(uri).hostname
  } catch {
    throw new Error('DATABASE_URI is not a valid connection string.')
  }
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`The seed only runs against a local database, not ${host}.`)
  }
}
