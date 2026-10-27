import { createHmac, timingSafeEqual } from 'node:crypto'

export function hmacSha512Hex(body: string, secret: string): string {
  return createHmac('sha512', secret).update(body).digest('hex')
}

/**
 * Paystack (and, assumed until the sandbox shows otherwise, Terminal) sign each webhook with the
 * HMAC-SHA512 of the raw body, made with the account's secret key, in hex. Compared in constant time.
 */
export function signatureMatches(body: string, sent: string | null, secret: string | undefined): boolean {
  if (!sent || !secret) return false
  const expected = Buffer.from(hmacSha512Hex(body, secret))
  const given = Buffer.from(sent.trim().toLowerCase())
  return expected.length === given.length && timingSafeEqual(expected, given)
}
