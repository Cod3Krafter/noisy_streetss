import type { Payload } from 'payload'

/** Shop settings every shop test can rely on. `overrides` replaces top-level fields. */
export async function setShopSettings(payload: Payload, overrides: Record<string, unknown> = {}): Promise<void> {
  await payload.updateGlobal({
    slug: 'shop-settings',
    data: {
      pickupAddress: {
        name: 'Test Dispatch',
        phone: '+2348000000001',
        line1: '1 Test Street',
        city: 'Ikeja',
        state: 'lagos',
        postcode: '100271',
        country: 'Nigeria',
      },
      flatDeliveryPrices: [{ areaName: 'Lagos', states: ['lagos'], priceNGN: 2500 }],
      elsewherePriceNGN: 5000,
      terminalPackagingId: 'PA-TEST-BOX',
      boxWeightGrams: 100,
      unpaidOrderExpiryMinutes: 30,
      orderAlertEmail: 'orders@noisystreetss.test',
      ...overrides,
    } as never,
  })
}
