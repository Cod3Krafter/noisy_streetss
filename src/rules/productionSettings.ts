/** The settings production cannot work without. Locally they may all be empty. */
const REQUIRED_IN_PRODUCTION = [
  'SMTP_HOST',
  'NEXT_PUBLIC_SERVER_URL',
  'CRON_SECRET',
  'S3_BUCKET_MEDIA',
  'S3_BUCKET_MANUSCRIPTS',
] as const

/** Names of the production settings that are missing or blank in `env`. */
export function missingProductionSettings(env: Record<string, string | undefined>): string[] {
  return REQUIRED_IN_PRODUCTION.filter((name) => !env[name]?.trim())
}
