import { describe, expect, it } from 'vitest'

import { parseFrom } from '@/email'
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
