/** The settings production cannot work without. Locally they may all be empty. */
const REQUIRED_IN_PRODUCTION = [
  'SMTP_HOST',
  'SMTP_FROM',
  'NEXT_PUBLIC_SERVER_URL',
  'CRON_SECRET',
  'S3_BUCKET_MEDIA',
  'S3_BUCKET_MANUSCRIPTS',
] as const

/** Needed as soon as either bucket is named, because the buckets cannot be reached without them. */
const STORAGE_CONNECTION = ['S3_ENDPOINT', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const

/** Names of the production settings that are missing or blank in `env`. */
export function missingProductionSettings(env: Record<string, string | undefined>): string[] {
  const blank = (name: string) => !env[name]?.trim()
  const missing: string[] = REQUIRED_IN_PRODUCTION.filter(blank)
  if (!blank('S3_BUCKET_MEDIA') || !blank('S3_BUCKET_MANUSCRIPTS')) missing.push(...STORAGE_CONNECTION.filter(blank))
  return missing
}
