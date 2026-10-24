import { describe, expect, it } from 'vitest'

import { parseFrom, transportOptions } from '@/email'
import { adminEntryUrl } from '@/hooks/formAlert'

describe('parseFrom', () => {
  it('splits a name and address', () => {
    expect(parseFrom('Noisy Streetss <website@noisystreetss.test>')).toEqual({
      name: 'Noisy Streetss',
      address: 'website@noisystreetss.test',
    })
  })

  it('accepts a bare address', () => {
    expect(parseFrom(' website@noisystreetss.test ')).toEqual({
      name: 'Noisy Streetss',
      address: 'website@noisystreetss.test',
    })
  })
})

describe('adminEntryUrl', () => {
  it('links to the entry in the admin', () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://noisystreetss.test/'
    expect(adminEntryUrl('contact-messages', 7)).toBe('https://noisystreetss.test/admin/collections/contact-messages/7')
  })
})

describe('transportOptions', () => {
  const base = { SMTP_HOST: 'smtp.example.com' }

  it('requires encryption in production on a port that starts unencrypted', () => {
    const options = transportOptions({ ...base, NODE_ENV: 'production', SMTP_PORT: '587' })
    expect(options.requireTLS).toBe(true)
    expect(options.secure).toBe(false)
  })

  it('uses an encrypted connection from the start on port 465, without requireTLS', () => {
    const options = transportOptions({ ...base, NODE_ENV: 'production', SMTP_PORT: '465' })
    expect(options.secure).toBe(true)
    expect(options.requireTLS).toBeFalsy()
  })

  it('leaves encryption optional outside production, because Mailpit offers none', () => {
    expect(transportOptions({ ...base, NODE_ENV: 'development', SMTP_PORT: '21025' }).requireTLS).toBeFalsy()
    expect(transportOptions({ ...base, SMTP_PORT: '587' }).requireTLS).toBeFalsy()
  })

  it('times out a server that greets and then stalls', () => {
    expect(transportOptions({ ...base }).socketTimeout).toBe(10_000)
    expect(transportOptions({ ...base, NODE_ENV: 'production' }).socketTimeout).toBe(10_000)
  })
})
