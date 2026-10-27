import type { PayloadRequest } from 'payload'

import type { FlatArea } from '@/shop/flatPrice'

/** Terminal's own default box, 20 x 20 x 10 cm, 0.1 kg (pending check P3). */
export const TERMINAL_DEFAULT_BOX = 'PA-PT95DUJGH8FRKSO0'
export const DEFAULT_BOX_WEIGHT_GRAMS = 100

export type ShopSettingsData = {
  pickup: { name: string; phone: string; line1: string; city: string; state: string; postcode: string }
  flatAreas: FlatArea[]
  elsewherePriceNGN: number | null
  packagingId: string
  boxWeightGrams: number
  expiryMinutes: number
  orderAlertEmail: string | null
}

/** Shop settings as the shop's server code needs them, with defaults for anything left blank. */
export async function readShopSettings(req: PayloadRequest): Promise<ShopSettingsData> {
  const settings = await req.payload.findGlobal({ slug: 'shop-settings', depth: 0, overrideAccess: true, req })
  const pickup = settings.pickupAddress
  return {
    pickup: {
      name: pickup?.name ?? '',
      phone: pickup?.phone ?? '',
      line1: pickup?.line1 ?? '',
      city: pickup?.city ?? '',
      state: pickup?.state ?? '',
      postcode: pickup?.postcode ?? '',
    },
    flatAreas: (settings.flatDeliveryPrices ?? []).map((area) => ({
      areaName: area.areaName,
      states: area.states ?? [],
      priceNGN: area.priceNGN,
    })),
    elsewherePriceNGN: settings.elsewherePriceNGN ?? null,
    packagingId: settings.terminalPackagingId || TERMINAL_DEFAULT_BOX,
    boxWeightGrams: settings.boxWeightGrams ?? DEFAULT_BOX_WEIGHT_GRAMS,
    expiryMinutes: settings.unpaidOrderExpiryMinutes ?? 30,
    orderAlertEmail: settings.orderAlertEmail ?? null,
  }
}
