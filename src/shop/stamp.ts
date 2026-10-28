import { createHmac, timingSafeEqual } from 'node:crypto'

/** How long a delivery price can be used at checkout. */
export const STAMP_LIFE_MS = 30 * 60_000
export const MIN_QUOTE_STAMP_SECRET_LENGTH = 32
const CLOCK_SLACK_MS = 60_000
/** A real stamp is a few hundred characters; anything longer is refused before it is hashed. */
const MAX_STAMP_LENGTH = 2048

export type StampedQuote = {
  method: 'courier' | 'flat'
  carrierName: string
  carrierSlug: string
  estimate: string
  priceKobo: number
  state: string
  weightGrams: number
  area: string | null
  issuedAt: number
}

export function quoteStampSecret(): string {
  const secret = process.env.QUOTE_STAMP_SECRET ?? ''
  if (secret.length < MIN_QUOTE_STAMP_SECRET_LENGTH) {
    throw new Error(`QUOTE_STAMP_SECRET must be at least ${MIN_QUOTE_STAMP_SECRET_LENGTH} characters.`)
  }
  return secret
}

const signatureOf = (body: string, secret: string) => createHmac('sha256', secret).update(body).digest('base64url')

/** The quote, readable, followed by an HMAC of it. The browser can see the price but cannot change it. */
export function signQuote(quote: StampedQuote, secret: string): string {
  const body = Buffer.from(JSON.stringify(quote)).toString('base64url')
  return `${body}.${signatureOf(body, secret)}`
}

/** The quote inside a stamp, or null when the stamp was changed, made with another secret, or has lapsed. */
export function readQuote(stamp: unknown, secret: string, now = Date.now()): StampedQuote | null {
  if (typeof stamp !== 'string') return null
  if (stamp.length > MAX_STAMP_LENGTH) return null
  const parts = stamp.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  const [body, signature] = parts
  const expected = Buffer.from(signatureOf(body, secret))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  let quote: StampedQuote
  try {
    quote = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as StampedQuote
  } catch {
    return null
  }
  if (typeof quote.issuedAt !== 'number') return null
  if (now - quote.issuedAt > STAMP_LIFE_MS || quote.issuedAt - now > CLOCK_SLACK_MS) return null
  return quote
}
