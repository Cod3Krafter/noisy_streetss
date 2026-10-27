import type { Payload } from 'payload'

import type { Book, Media, Merch, Order } from '@/payload-types'
import { SHOP_SERVER } from '@/shop/context'

import { createImage, createWriter } from './payload'

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

let shopImage: Media | undefined
let productCount = 0

type FormatInput = { formatName: string; priceNGN: number; inStock?: boolean; weightGrams: number }

/** A book for sale. Pass `publish: false` for one that has never been published. */
export async function createShopBook(
  payload: Payload,
  { formats, sellInShop = true, publish = true }: { formats?: FormatInput[]; sellInShop?: boolean; publish?: boolean } = {},
): Promise<Book> {
  productCount += 1
  shopImage ??= await createImage(payload)
  const writer = await createWriter(payload)
  return payload.create({
    collection: 'books',
    draft: !publish,
    data: {
      title: `Shop Book ${productCount}`,
      cover: shopImage.id,
      writers: [writer.id],
      category: 'fiction',
      summary: 'A book for the shop tests.',
      formats: formats ?? [{ formatName: 'Paperback', priceNGN: 10000, inStock: true, weightGrams: 400 }],
      sellInShop,
      _status: publish ? 'published' : 'draft',
    },
  })
}

/** A merch item, one-size unless `options` are given. */
export async function createShopMerch(
  payload: Payload,
  { inStock = true, options }: { inStock?: boolean; options?: { name: string; inStock?: boolean }[] } = {},
): Promise<Merch> {
  productCount += 1
  shopImage ??= await createImage(payload)
  return payload.create({
    collection: 'merch',
    data: {
      title: `Shop Merch ${productCount}`,
      images: [shopImage.id],
      priceNGN: 15000,
      weightGrams: 250,
      type: 'apparel',
      inStock,
      options,
      _status: 'published',
    },
  })
}
