import type { PayloadRequest } from 'payload'

import { Refusal } from '@/refusal'
import { parcelWeightGrams, parseCart, type PricedLine, resolveCart } from '@/shop/cart'
import { shopClients } from '@/shop/clients'
import { flatPriceFor } from '@/shop/flatPrice'
import { toNaira } from '@/shop/money'
import { readShopSettings, type ShopSettingsData } from '@/shop/settings'
import { quoteStampSecret, signQuote, type StampedQuote } from '@/shop/stamp'
import { isNigerianState } from '@/shop/states'
import type { TerminalParcel, TerminalPlace, TerminalRate } from '@/shop/terminal'

export type QuoteOption = { carrierName: string; carrierSlug: string; estimate: string; priceNGN: number; stamp: string }
export type QuotesAnswer = { method: 'courier' | 'flat'; quotes: QuoteOption[] }

type ParcelLine = Pick<PricedLine, 'title' | 'optionName' | 'unitPriceKobo' | 'quantity' | 'weightGrams'>

/** The parcel Terminal is asked about: every line, in the shop's box. */
export function parcelFor(lines: ParcelLine[], packagingId: string): TerminalParcel {
  return {
    packagingId,
    items: lines.map((line) => ({
      name: line.optionName ? `${line.title} (${line.optionName})` : line.title,
      valueNGN: toNaira(line.unitPriceKobo),
      quantity: line.quantity,
      weightGrams: line.weightGrams,
    })),
  }
}

function parsePlace(value: unknown): TerminalPlace {
  const where = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const city = typeof where.city === 'string' ? where.city.trim() : ''
  if (!city || city.length > 100) throw new Refusal('Enter the town or city for delivery.')
  if (!isNigerianState(where.state)) throw new Refusal('Pick the state for delivery.')
  return { city, state: where.state }
}

/** Live courier prices, or none when Terminal fails, is slow or has nothing. Checkout then uses the flat price. */
async function liveRates(req: PayloadRequest, settings: ShopSettingsData, delivery: TerminalPlace, lines: PricedLine[]): Promise<TerminalRate[]> {
  try {
    return await shopClients().terminal.quotes({
      bookable: false,
      pickup: { city: settings.pickup.city, state: settings.pickup.state },
      delivery,
      parcel: parcelFor(lines, settings.packagingId),
    })
  } catch (error) {
    req.payload.logger.warn({ err: error, msg: 'Live delivery prices failed, so the flat price was offered.' })
    return []
  }
}

/** The delivery choices for a cart going to a city and state, each with its stamp. */
export async function deliveryQuotes(req: PayloadRequest, body: Record<string, unknown>): Promise<QuotesAnswer> {
  const lines = await resolveCart(req, parseCart(body.items))
  const delivery = parsePlace(body.address)
  const settings = await readShopSettings(req)
  const weightGrams = parcelWeightGrams(lines, settings.boxWeightGrams)
  const secret = quoteStampSecret()
  const issuedAt = Date.now()
  const stamped = (quote: Omit<StampedQuote, 'state' | 'weightGrams' | 'issuedAt'>): QuoteOption => ({
    carrierName: quote.carrierName,
    carrierSlug: quote.carrierSlug,
    estimate: quote.estimate,
    priceNGN: toNaira(quote.priceKobo),
    stamp: signQuote({ ...quote, state: delivery.state, weightGrams, issuedAt }, secret),
  })

  const rates = await liveRates(req, settings, delivery, lines)
  if (rates.length > 0) {
    return {
      method: 'courier',
      quotes: [...rates]
        .sort((a, b) => a.amountKobo - b.amountKobo)
        .map((rate) =>
          stamped({ method: 'courier', carrierName: rate.carrierName, carrierSlug: rate.carrierSlug, estimate: rate.estimate, priceKobo: rate.amountKobo, area: null }),
        ),
    }
  }
  const flat = flatPriceFor(settings.flatAreas, settings.elsewherePriceNGN, delivery.state)
  if (!flat) throw new Refusal('Delivery prices are not available right now. Please try again later.', 503)
  return {
    method: 'flat',
    quotes: [stamped({ method: 'flat', carrierName: 'Standard delivery', carrierSlug: 'flat', estimate: '', priceKobo: flat.priceKobo, area: flat.area })],
  }
}
