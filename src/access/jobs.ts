import type { PayloadRequest } from 'payload'

/** The job endpoint only runs for Vercel Cron, which sends `Authorization: Bearer <CRON_SECRET>`. */
export function hasCronSecret({ req }: { req: PayloadRequest }): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}
