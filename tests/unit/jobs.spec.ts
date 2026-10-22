import type { PayloadRequest } from 'payload'
import { afterEach, describe, expect, it } from 'vitest'

import { hasCronSecret } from '@/access/jobs'

const requestWith = (authorization?: string) =>
  ({ headers: new Headers(authorization ? { authorization } : {}) }) as unknown as PayloadRequest

const original = process.env.CRON_SECRET

afterEach(() => {
  if (original === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = original
})

describe('hasCronSecret', () => {
  it('accepts the right secret', () => {
    process.env.CRON_SECRET = 'right-secret-long-enough'
    expect(hasCronSecret({ req: requestWith('Bearer right-secret-long-enough') })).toBe(true)
  })

  it('refuses a wrong or missing secret', () => {
    process.env.CRON_SECRET = 'right-secret-long-enough'
    expect(hasCronSecret({ req: requestWith('Bearer wrong') })).toBe(false)
    expect(hasCronSecret({ req: requestWith() })).toBe(false)
  })

  it('refuses everything when no secret is configured', () => {
    process.env.CRON_SECRET = ''
    expect(hasCronSecret({ req: requestWith('Bearer ') })).toBe(false)
  })

  it('refuses a secret shorter than 16 characters', () => {
    process.env.CRON_SECRET = 'short'
    expect(hasCronSecret({ req: requestWith('Bearer short') })).toBe(false)
  })
})
