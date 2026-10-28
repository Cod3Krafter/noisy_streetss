import { createHash } from 'node:crypto'

import type { PayloadRequest } from 'payload'

import type { Order } from '@/payload-types'
import { Refusal } from '@/refusal'
import { BOOKING_CLAIM_LAPSES_MS, claimBooking, releaseBooking, withOrderLock } from '@/shop/claims'
import { shopClients } from '@/shop/clients'
import { queueShopEmail } from '@/shop/emails'
import { appendHistory } from '@/shop/history'
import { formatNaira, toKobo, toNaira } from '@/shop/money'
import { findOrder, serverUpdate } from '@/shop/orders'
import { parcelFor } from '@/shop/quotes'
import { readShopSettings, type ShopSettingsData } from '@/shop/settings'
import { type QuoteRequest, TerminalError, TerminalOutcomeUnknown, TerminalUnreachable } from '@/shop/terminal'

export type CourierOption = { rateId: string; carrierName: string; carrierSlug: string; estimate: string; priceKobo: number; isCustomerChoice: boolean }

export type CourierOptions = {
  status: string
  booked: { carrierName: string | null; trackingNumber: string | null; trackingUrl: string | null; labelUrl: string | null } | null
  customerChoice: { carrierName: string; carrierSlug: string } | null
  paidDeliveryKobo: number
  walletKobo: number | null
  missingPostcode: boolean
  /** A booking started and has neither finished nor lapsed: Book stays off. */
  claimHeld: boolean
  staleClaim: boolean
  /** Identifies the order details the prices were fetched for. A booking must send it back unchanged. */
  fingerprint: string
  options: CourierOption[]
  terminalError: string | null
}

/** A bookable quote: full addresses for both ends, and every line of the order in the shop's box. */
function bookableRequest(order: Order, settings: ShopSettingsData): Extract<QuoteRequest, { bookable: true }> {
  return {
    bookable: true,
    pickup: {
      name: settings.pickup.name || 'Noisy Streetss',
      email: settings.orderAlertEmail ?? '',
      phone: settings.pickup.phone,
      line1: settings.pickup.line1,
      city: settings.pickup.city,
      state: settings.pickup.state,
      postcode: settings.pickup.postcode,
    },
    delivery: {
      name: order.customerName ?? '',
      email: order.customerEmail ?? '',
      phone: order.customerPhone ?? '',
      line1: order.address?.line1 ?? '',
      line2: order.address?.line2,
      city: order.address?.city ?? '',
      state: order.address?.state ?? '',
      postcode: order.address?.postcode ?? '',
    },
    parcel: parcelFor(
      (order.items ?? []).map((item) => ({
        title: item.title ?? 'Item',
        optionName: item.optionName ?? null,
        unitPriceKobo: toKobo(item.unitPriceNGN ?? 0),
        quantity: item.quantity ?? 1,
        weightGrams: item.weightGrams ?? 0,
      })),
      settings.packagingId,
    ),
  }
}

/** A short hash of what the quoted prices depend on, so a booking made from stale prices can be refused. */
export function orderFingerprint(order: Order): string {
  const address = order.address
  const details = [
    order.customerName,
    order.customerPhone,
    address?.line1,
    address?.line2,
    address?.city,
    address?.state,
    address?.postcode,
    (order.items ?? []).map((item) => [item.title, item.optionName, item.quantity, item.weightGrams]),
  ]
  return createHash('sha256').update(JSON.stringify(details)).digest('hex').slice(0, 24)
}

/** What staff are shown when Terminal could not be reached. The error's name and code go to the log only. */
export const TERMINAL_UNREACHABLE = "Couldn't reach Terminal. Try again in a minute."

/** Terminal's own words when it answered with them, otherwise the error's plain message. */
const terminalWords = (error: TerminalError) => error.terminalMessage ?? error.message

/**
 * What the Book courier panel shows. Terminal doesn't say how long a quote stays bookable, so
 * today's bookable quotes are fetched each time the panel opens. Nothing is asked of Terminal for
 * an order that can't be booked yet.
 */
export async function courierOptions(req: PayloadRequest, orderId: number): Promise<CourierOptions> {
  const order = await findOrder(req, orderId)
  if (!order) throw new Refusal('That order no longer exists.', 404)
  const shipment = order.shipment
  const startedAt = shipment?.bookingStartedAt
  const lapsed = Boolean(startedAt) && Date.now() - Date.parse(startedAt as string) > BOOKING_CLAIM_LAPSES_MS
  const customerChoice =
    order.delivery?.method === 'courier' && order.delivery.carrierSlug ? { carrierName: order.delivery.carrierName ?? '', carrierSlug: order.delivery.carrierSlug } : null
  const base: CourierOptions = {
    status: order.status,
    booked: shipment?.terminalShipmentId
      ? { carrierName: shipment.carrierName ?? null, trackingNumber: shipment.trackingNumber ?? null, trackingUrl: shipment.trackingUrl ?? null, labelUrl: shipment.labelUrl ?? null }
      : null,
    customerChoice,
    paidDeliveryKobo: toKobo(order.deliveryNGN ?? 0),
    walletKobo: null,
    missingPostcode: !order.address?.postcode,
    claimHeld: Boolean(startedAt) && !lapsed,
    staleClaim: lapsed,
    fingerprint: orderFingerprint(order),
    options: [],
    terminalError: null,
  }
  if (order.status !== 'paid' || base.missingPostcode) return base
  try {
    const { terminal } = shopClients()
    const settings = await readShopSettings(req)
    const [rates, wallet] = await Promise.all([terminal.quotes(bookableRequest(order, settings)), terminal.walletBalance()])
    const options = [...rates]
      .sort((a, b) => a.amountKobo - b.amountKobo)
      .map((rate) => ({ rateId: rate.rateId, carrierName: rate.carrierName, carrierSlug: rate.carrierSlug, estimate: rate.estimate, priceKobo: rate.amountKobo, isCustomerChoice: rate.carrierSlug === customerChoice?.carrierSlug }))
      // The customer's courier first; the rest stay cheapest first.
      .sort((a, b) => Number(b.isCustomerChoice) - Number(a.isCustomerChoice))
    return { ...base, walletKobo: wallet.amountKobo, options }
  } catch (error) {
    if (error instanceof TerminalError) {
      req.payload.logger.warn({ err: error, msg: `Courier prices for ${order.orderNumber} could not be fetched.` })
      return {
        ...base,
        terminalError: error instanceof TerminalUnreachable ? TERMINAL_UNREACHABLE : `Terminal couldn't give prices for this order: ${terminalWords(error)}`,
      }
    }
    // A missing key, bad settings or a database fault: the details are for the log, not the panel.
    req.payload.logger.error({ err: error, msg: `Courier prices for ${order.orderNumber} could not be fetched: courier booking is not set up.` })
    return { ...base, terminalError: 'Courier booking is not set up on this server. The details are in the server log.' }
  }
}

/**
 * Books a Paid order with Terminal. The order is claimed first in a single statement, so a double
 * click or a second staff member can't book it twice. On a refusal the claim is released. If
 * Terminal may have booked (no confirmation, or recording the booking failed), the claim is kept
 * and lapses after five minutes, when the panel warns staff to check Terminal's dashboard first.
 *
 * The claim and its release run on the connection pool, so neither is ever called inside the row
 * lock below (they would wait on the lock's own caller forever).
 */
export async function bookCourier(req: PayloadRequest, orderId: number, rateId: string, bookedBy: string, fingerprint: string): Promise<Order> {
  const order = await findOrder(req, orderId)
  if (!order) throw new Refusal('That order no longer exists.', 404)
  if (order.status !== 'paid') throw new Refusal('Only a Paid order can be booked.')
  if (order.shipment?.terminalShipmentId) throw new Refusal('A courier is already booked for this order.', 409)
  if (!order.address?.postcode) throw new Refusal("Add the customer's postcode to the address first. Couriers need it.")
  if (fingerprint !== orderFingerprint(order)) throw new Refusal('The order changed since these prices were fetched. Reload the panel and pick again.', 409)
  if (!(await claimBooking(req, order.id))) throw new Refusal('This order is held by another booking for up to 5 minutes. Reload the panel to see why.', 409)

  let booking: Awaited<ReturnType<ReturnType<typeof shopClients>['terminal']['book']>>
  let stage: 'preparing' | 'booking' = 'preparing'
  let rate: Awaited<ReturnType<ReturnType<typeof shopClients>['terminal']['getRate']>>
  try {
    const { terminal } = shopClients()
    rate = await terminal.getRate(rateId)
    const wallet = await terminal.walletBalance()
    if (wallet.amountKobo < rate.amountKobo) {
      throw new Refusal(
        `The Terminal wallet holds ${formatNaira(wallet.amountKobo)} and this booking costs ${formatNaira(rate.amountKobo)}. Top it up by at least ${formatNaira(rate.amountKobo - wallet.amountKobo)} in Terminal's dashboard.`,
      )
    }
    stage = 'booking'
    booking = await terminal.book(rate.rateId)
  } catch (error) {
    if (error instanceof TerminalOutcomeUnknown) {
      // The parcel may be booked. Keep the claim so nobody books it again before checking.
      req.payload.logger.error({ err: error, msg: `Terminal did not confirm the booking for ${order.orderNumber}. It may have gone through. Check Terminal's dashboard.` })
      throw new Refusal(
        "Terminal did not confirm the booking. It may have gone through: check Terminal's dashboard for this order before booking again. The order stays held for 5 minutes.",
        502,
      )
    }
    await releaseBooking(req, order.id)
    if (error instanceof TerminalError) {
      // The error's name and cause code are for the log; staff get plain words.
      req.payload.logger.warn({ err: error, msg: `Courier booking for ${order.orderNumber} stopped before anything was booked.` })
      throw new Refusal(
        error instanceof TerminalUnreachable
          ? TERMINAL_UNREACHABLE
          : stage === 'booking'
            ? `Terminal refused the booking. ${terminalWords(error)}`
            : `Couldn't get Terminal's price or wallet: ${terminalWords(error)}`,
        502,
      )
    }
    throw error
  }

  try {
    // Under the order's lock, from a fresh read, so a Terminal webhook arriving now loses no history entry.
    return await withOrderLock(req, order.id, async () => {
      const fresh = (await findOrder(req, order.id)) ?? order
      if (fresh.status !== 'paid') req.payload.logger.warn(`${order.orderNumber} was ${fresh.status}, not Paid, when its courier booking was recorded.`)
      const updated = await serverUpdate(req, order.id, {
        status: 'courier-booked',
        shipment: {
          ...fresh.shipment,
          terminalShipmentId: booking.shipmentId,
          carrierName: rate.carrierName,
          trackingNumber: booking.trackingNumber,
          trackingUrl: booking.trackingUrl,
          labelUrl: booking.labelUrl,
          courierCostNGN: toNaira(rate.amountKobo),
          bookedAt: new Date().toISOString(),
          bookedBy,
          bookingStartedAt: null,
        },
        history: appendHistory(fresh.history, { from: fresh.status, to: 'courier-booked', by: bookedBy, note: `Booked with ${rate.carrierName} for ${formatNaira(rate.amountKobo)}` }),
      })
      await queueShopEmail(req, { kind: 'tracking', orderId: order.id })
      return updated
    })
  } catch (error) {
    req.payload.logger.error({ err: error, msg: `${order.orderNumber} was booked with Terminal but the booking could not be recorded. Check Terminal's dashboard.` })
    throw new Refusal(
      "Terminal booked the parcel but the order could not be updated. Check Terminal's dashboard for this order before doing anything else; the order stays held for 5 minutes.",
      502,
    )
  }
}
