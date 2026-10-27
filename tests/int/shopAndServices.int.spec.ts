import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Media } from '@/payload-types'

import { createImage, createStaff, expectFieldError, getTestPayload } from '../helpers/payload'

let payload: Payload
let image: Media

beforeAll(async () => {
  payload = await getTestPayload()
  image = await createImage(payload)
})

describe('merch', () => {
  const tote = (overrides: Record<string, unknown> = {}) => ({
    title: 'Canvas Tote Bag',
    images: [image.id],
    priceNGN: 12000,
    weightGrams: 300,
    type: 'apparel' as const,
    _status: 'published' as const,
    ...overrides,
  })

  it('publishes an item with a picture, price and weight', async () => {
    const item = await payload.create({ collection: 'merch', data: tote() })
    expect(item.slug).toBe('canvas-tote-bag')
    expect(item.inStock).toBe(true)
  })

  it('refuses an item with no picture, or a price with kobo', async () => {
    await expectFieldError(payload.create({ collection: 'merch', data: tote({ images: [] }) }), 'images', /required/i)
    await expectFieldError(payload.create({ collection: 'merch', data: tote({ priceNGN: 99.5 }) }), 'priceNGN', /whole number/)
  })

  it('keeps sizes, each with its own In stock box', async () => {
    const item = await payload.create({
      collection: 'merch',
      data: tote({ title: 'Sized Tee', options: [{ name: 'S' }, { name: 'M', inStock: false }] }),
    })
    expect(item.options?.map((option) => [option.name, option.inStock])).toEqual([
      ['S', true],
      ['M', false],
    ])
  })

  it('refuses two sizes with the same name', async () => {
    await expectFieldError(
      payload.create({ collection: 'merch', data: tote({ title: 'Twin Tee', options: [{ name: 'M' }, { name: ' m ' }] }) }),
      'options',
      /different name/,
    )
  })
})

describe('studio services', () => {
  it('names the rate field by its label in the error message', async () => {
    await expect(
      payload.create({
        collection: 'studio-services',
        data: { name: 'Vocal booth', description: 'Treated booth.', _status: 'published' },
      }),
    ).rejects.toThrow(/The following field is invalid: Hourly rate \(₦\)$/)
  })

  it('needs a rate to publish', async () => {
    await expectFieldError(
      payload.create({
        collection: 'studio-services',
        data: { name: 'Vocal booth', description: 'Treated booth.', _status: 'published' },
      }),
      'hourlyRateNGN',
      /at least one rate/,
    )
    const service = await payload.create({
      collection: 'studio-services',
      data: { name: 'Vocal booth', description: 'Treated booth.', hourlyRateNGN: 15000, _status: 'published' },
    })
    expect(service.hourlyRateNGN).toBe(15000)
  })
})

describe('membership plans', () => {
  it('are visible to visitors and editable by editors', async () => {
    const editor = await createStaff(payload, 'editor')
    const plan = await payload.create({
      collection: 'membership-plans',
      data: { name: 'Reader', priceNGN: 5000, billing: 'monthly', perks: [{ perk: '20% off books' }] },
      overrideAccess: false,
      user: editor,
    })
    const seen = await payload.find({
      collection: 'membership-plans',
      where: { id: { equals: plan.id } },
      overrideAccess: false,
    })
    expect(seen.docs[0]?.perks?.[0]?.perk).toBe('20% off books')
  })
})
