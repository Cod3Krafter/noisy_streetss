import type { Payload } from 'payload'

import type { Order } from '@/payload-types'
import { SHOP_SERVER } from '@/shop/context'

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

let orderCount = 0

/** An order as checkout would leave it (Awaiting payment), with anything in `overrides` replaced. */
export async function createOrder(payload: Payload, overrides: Record<string, unknown> = {}): Promise<Order> {
  orderCount += 1
  return payload.create({
    collection: 'orders',
    context: { [SHOP_SERVER]: true },
    data: {
      status: 'awaiting-payment',
      customerName: 'Ada Obi',
      customerEmail: 'ada@example.com',
      customerPhone: '+2348031234567',
      address: { line1: '5 Allen Avenue', city: 'Ikeja', state: 'lagos', postcode: '100271' },
      items: [{ title: 'Test Book', optionName: 'Paperback', unitPriceNGN: 10000, quantity: 1, weightGrams: 400 }],
      delivery: { method: 'courier', carrierName: 'GIG Logistics', carrierSlug: 'gig', estimate: '2 to 3 days', priceNGN: 3200 },
      itemsNGN: 10000,
      deliveryNGN: 3200,
      totalNGN: 13200,
      payment: { reference: `test-ref-${Date.now()}-${orderCount}` },
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      history: [{ at: new Date().toISOString(), to: 'awaiting-payment', by: 'Checkout' }],
      ...overrides,
    } as never,
  })
}
