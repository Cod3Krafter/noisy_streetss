import { createHash, timingSafeEqual } from 'node:crypto'
import type { PayloadRequest } from 'payload'

const digest = (value: string) => createHash('sha256').update(value).digest()

/** The job endpoint only runs for Vercel Cron, which sends `Authorization: Bearer <CRON_SECRET>`. */
export function hasCronSecret({ req }: { req: PayloadRequest }): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 16) return false
  const sent = req.headers.get('authorization') ?? ''
  return timingSafeEqual(digest(sent), digest(`Bearer ${secret}`))
}
