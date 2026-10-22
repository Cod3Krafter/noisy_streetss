import type { PayloadRequest } from 'payload'
import { afterEach, describe, expect, it } from 'vitest'

import { hasCronSecret } from '@/access/jobs'

const requestWith = (authorization?: string) =>
  ({ headers: new Headers(authorization ? { authorization } : {}) }) as unknown as PayloadRequest

const original = process.env.CRON_SECRET

afterEach(() => {
  process.env.CRON_SECRET = original
})

describe('hasCronSecret', () => {
  it('accepts the right secret', () => {
    process.env.CRON_SECRET = 'right-secret'
    expect(hasCronSecret({ req: requestWith('Bearer right-secret') })).toBe(true)
  })

  it('refuses a wrong or missing secret', () => {
    process.env.CRON_SECRET = 'right-secret'
    expect(hasCronSecret({ req: requestWith('Bearer wrong') })).toBe(false)
    expect(hasCronSecret({ req: requestWith() })).toBe(false)
  })

  it('refuses everything when no secret is configured', () => {
    process.env.CRON_SECRET = ''
    expect(hasCronSecret({ req: requestWith('Bearer ') })).toBe(false)
  })
})
