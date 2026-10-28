import { MIN_QUOTE_STAMP_SECRET_LENGTH } from '@/shop/stamp'

/** The settings production cannot work without. Locally they may all be empty. */
const REQUIRED_IN_PRODUCTION = [
  'PAYLOAD_SECRET',
  'SMTP_HOST',
  'SMTP_FROM',
  'NEXT_PUBLIC_SERVER_URL',
  'CRON_SECRET',
  'S3_BUCKET_MEDIA',
  'S3_BUCKET_MANUSCRIPTS',
  'PAYSTACK_SECRET_KEY',
  'TERMINAL_SECRET_KEY',
  'TERMINAL_BASE_URL',
  'QUOTE_STAMP_SECRET',
] as const

/** Needed as soon as either bucket is named, because the buckets cannot be reached without them. */
const STORAGE_CONNECTION = ['S3_ENDPOINT', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const

/** PAYLOAD_SECRET signs every login token, so a short one is guessable. */
export const MIN_PAYLOAD_SECRET_LENGTH = 32

/** The job endpoint refuses a CRON_SECRET shorter than this, so scheduled publishing would never run. */
export const MIN_CRON_SECRET_LENGTH = 16

/**
 * The login cookie is only accepted when the browser's Origin matches this address exactly, and a
 * browser sends the origin in its canonical form (lowercase host, internationalised names as
 * xn--, no default port, no path). So the address must equal its own parsed origin.
 */
function isExactOrigin(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.origin === value
  } catch {
    return false
  }
}

/**
 * The production settings that are missing, blank or unusable in `env`, one entry each. A blank
 * setting is its bare name; an unusable one says what is wrong, e.g. "CRON_SECRET (shorter than 16 characters)".
 */
export function productionSettingProblems(env: Record<string, string | undefined>): string[] {
  const blank = (name: string) => !env[name]?.trim()
  const problems: string[] = []
  for (const name of REQUIRED_IN_PRODUCTION) {
    if (blank(name)) {
      problems.push(name)
      continue
    }
    const value = env[name] as string
    if (name === 'PAYLOAD_SECRET' && value.length < MIN_PAYLOAD_SECRET_LENGTH) {
      problems.push(`${name} (shorter than ${MIN_PAYLOAD_SECRET_LENGTH} characters)`)
    } else if (name === 'CRON_SECRET' && value.length < MIN_CRON_SECRET_LENGTH) {
      problems.push(`${name} (shorter than ${MIN_CRON_SECRET_LENGTH} characters)`)
    } else if (name === 'NEXT_PUBLIC_SERVER_URL' && !isExactOrigin(value)) {
      problems.push(`${name} (must be exactly https://host in lowercase, with no path, trailing slash or :443)`)
    } else if (name === 'QUOTE_STAMP_SECRET' && value.length < MIN_QUOTE_STAMP_SECRET_LENGTH) {
      problems.push(`${name} (shorter than ${MIN_QUOTE_STAMP_SECRET_LENGTH} characters)`)
    } else if (name === 'PAYSTACK_SECRET_KEY' && value.trim().startsWith('sk_test_')) {
      problems.push(`${name} (a test key)`)
    } else if (name === 'TERMINAL_BASE_URL' && value.includes('sandbox')) {
      problems.push(`${name} (Terminal's sandbox address)`)
    }
  }
  if (!blank('S3_BUCKET_MEDIA') || !blank('S3_BUCKET_MANUSCRIPTS')) problems.push(...STORAGE_CONNECTION.filter(blank))
  return problems
}
