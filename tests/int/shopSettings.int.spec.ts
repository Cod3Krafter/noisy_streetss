import { createLocalReq, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { readShopSettings, TERMINAL_DEFAULT_BOX } from '@/shop/settings'

import { expectFieldError, getTestPayload } from '../helpers/payload'
import { setShopSettings } from '../helpers/shop'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
  await setShopSettings(payload)
})

describe('shop settings', () => {
  it('refuses a state listed in two areas', async () => {
    await expectFieldError(
      payload.updateGlobal({
        slug: 'shop-settings',
        data: {
          flatDeliveryPrices: [
            { areaName: 'Lagos', states: ['lagos'], priceNGN: 2500 },
            { areaName: 'Lagos again', states: ['lagos', 'ogun'], priceNGN: 3000 },
          ],
        },
      }),
      'flatDeliveryPrices',
      /Lagos is in both "Lagos" and "Lagos again"/,
    )
  })

  it('needs an everywhere-else price', async () => {
    await expectFieldError(payload.updateGlobal({ slug: 'shop-settings', data: { elsewherePriceNGN: null as never } }), 'elsewherePriceNGN', /required/i)
  })

  it('is read by the shop with its defaults filled in', async () => {
    const req = await createLocalReq({}, payload)
    const settings = await readShopSettings(req)
    expect(settings.pickup.postcode).toBe('100271')
    expect(settings.flatAreas).toEqual([{ areaName: 'Lagos', states: ['lagos'], priceNGN: 2500 }])
    expect(settings.elsewherePriceNGN).toBe(5000)
    expect(settings.boxWeightGrams).toBe(100)
    expect(settings.expiryMinutes).toBe(30)

    await setShopSettings(payload, { terminalPackagingId: '' })
    expect((await readShopSettings(req)).packagingId).toBe(TERMINAL_DEFAULT_BOX)
    await setShopSettings(payload)
  })

  it('keeps the member discount out of the admin until B3', () => {
    const shop = payload.config.globals.find((global) => global.slug === 'shop-settings')
    const discount = shop?.fields.find((field) => 'name' in field && field.name === 'memberDiscountPercent')
    expect((discount as { admin?: { hidden?: unknown } } | undefined)?.admin?.hidden).toBe(true)
  })
})
