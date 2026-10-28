import { createHash } from 'node:crypto'

import type { PayloadRequest } from 'payload'

import { readableDateTime } from '@/jobs/scheduledPublishAlerts'
import type { Order } from '@/payload-types'
import { recordEventOnce, withOrderLock } from '@/shop/claims'
import { queueShopEmail, type ShopEmailKind } from '@/shop/emails'
import { appendHistory } from '@/shop/history'
import { formatNaira, toKobo } from '@/shop/money'
import { findOrder, serverUpdate } from '@/shop/orders'
import { isForwardMove, type OrderStatus, statusLabel } from '@/shop/statuses'

export type TerminalEvent = { type: string; shipmentIds: string[]; data: Record<string, unknown> }

export type TerminalResult = 'moved' | 'noted' | 'alerted' | 'cancelled' | 'ignored' | 'unknown-shipment' | 'repeat'

const objectOf = (value: unknown) => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {})
const textOf = (value: unknown) => (typeof value === 'string' && value ? value : null)

/**
 * The event's id, name and shipment ids, where Terminal's docs put them: shipment and reconciliation
 * events carry data.shipment_id, a transaction carries the id as data.shipment, and a pickup lists
 * data.shipment_ids (possibly several). Only pickup events document an event_id. A top-level `id` is
 * never used: nothing says it is unique per event, and if it were not, every later event for the
 * order would look like a repeat and be dropped. Without an event_id the body hash is used instead.
 */
export function readTerminalEvent(body: unknown): { eventId: string | null; event: TerminalEvent } {
  const raw = objectOf(body)
  const data = objectOf(raw.data)
  const ids = [
    textOf(data.shipment_id),
    textOf(data.shipment),
    textOf(objectOf(data.shipment).shipment_id),
    ...(Array.isArray(data.shipment_ids) ? data.shipment_ids.map(textOf) : []),
  ].filter((id): id is string => id !== null)
  return {
    eventId: textOf(raw.event_id),
    event: { type: textOf(raw.event) ?? textOf(raw.type) ?? '', shipmentIds: [...new Set(ids)], data },
  }
}

/** What an event is remembered by: its id when Terminal sends one, otherwise a hash of the exact body. */
export const eventKeyOf = (eventId: string | null, rawBody: string) => eventId ?? `body:${createHash('sha256').update(rawBody).digest('hex')}`

const MOVES: Record<string, OrderStatus> = {
  'pickup.completed': 'in-transit',
  'shipment.in-transit': 'in-transit',
  'shipment.delivered': 'delivered',
  'shipment.returned': 'returned',
}

const ALERTS: Record<string, ShopEmailKind> = {
  'shipment.returned': 'staff-returned',
  'pickup.failed': 'staff-pickup-failed',
  'transaction.failed': 'staff-charge-failed',
  'reconciliation.flagged': 'staff-weight-claim',
}

const CANCELLED = new Set(['shipment.cancelled', 'pickup.cancelled'])

const note = (req: PayloadRequest, order: Order, text: string) =>
  serverUpdate(req, order.id, { history: appendHistory(order.history, { by: 'Terminal', note: text }) })

/** Only a weight claim carries an amount: Terminal's reconciliation events give it as exception_charge. */
function alertDetails(event: TerminalEvent): string | null {
  if (event.type !== 'reconciliation.flagged') return null
  const amount = event.data.exception_charge
  return typeof amount === 'number' ? `Amount claimed: ${formatNaira(toKobo(amount))}.` : null
}

/** The cancelled booking's details for its history note. A booking date that cannot be read is left out, never thrown over. */
function bookingNote(shipment: Order['shipment']): string {
  const cost = typeof shipment?.courierCostNGN === 'number' ? formatNaira(toKobo(shipment.courierCostNGN)) : 'cost unknown'
  const bookedAt = shipment?.bookedAt
  const when = bookedAt && !Number.isNaN(Date.parse(bookedAt)) ? readableDateTime(bookedAt) : null
  const booked = `booked by ${shipment?.bookedBy ?? 'unknown'}${when ? ` on ${when}` : ''}`
  return `Booking cancelled in Terminal (was ${shipment?.carrierName ?? 'a courier'}, ${cost}, ${booked}, shipment ${shipment?.terminalShipmentId}, tracking ${shipment?.trackingNumber ?? 'none'})`
}

/**
 * Applies one Terminal event to the order of every shipment it names, each under that order's row
 * lock. Webhooks only move an order forward; a cancellation sends it back to Paid. The event is
 * recorded per order in the same transaction as the change (key `terminal:<eventKey>:<orderId>`),
 * so a failed apply is not remembered and Terminal's retry runs it again, and a second order in the
 * same pickup is not mistaken for a repeat. Events for no order, or of a kind the shop ignores,
 * change and record nothing. `eventKey` comes from eventKeyOf.
 */
export async function applyTerminalEvent(req: PayloadRequest, event: TerminalEvent, eventKey: string): Promise<TerminalResult> {
  if (!MOVES[event.type] && !ALERTS[event.type] && !CANCELLED.has(event.type)) return 'ignored'
  const results: TerminalResult[] = []
  const done = new Set<number>()
  for (const shipmentId of event.shipmentIds.length ? event.shipmentIds : [null]) {
    const { docs } = shipmentId
      ? await req.payload.find({ collection: 'orders', where: { 'shipment.terminalShipmentId': { equals: shipmentId } }, depth: 0, limit: 1, overrideAccess: true, req })
      : { docs: [] as Order[] }
    const found = docs[0]
    if (!found) {
      req.payload.logger.warn(`Terminal sent ${event.type} for shipment ${shipmentId ?? 'with no ID'}, which no order has.`)
      results.push('unknown-shipment')
      continue
    }
    if (done.has(found.id)) continue
    done.add(found.id)
    results.push(await applyToOrder(req, event, shipmentId as string, found.id, eventKey))
  }
  return results.find((result) => result !== 'repeat' && result !== 'unknown-shipment' && result !== 'ignored') ?? results.find((result) => result === 'ignored') ?? results.find((result) => result === 'repeat') ?? 'unknown-shipment'
}

function applyToOrder(req: PayloadRequest, event: TerminalEvent, shipmentId: string, orderId: number, eventKey: string): Promise<TerminalResult> {
  return withOrderLock(req, orderId, async (): Promise<TerminalResult> => {
    const order = await findOrder(req, orderId)
    if (!order) return 'unknown-shipment'
    if (order.shipment?.terminalShipmentId !== shipmentId) {
      req.payload.logger.warn(`Terminal sent ${event.type} for shipment ${shipmentId}, but order ${orderId} no longer holds that shipment. Nothing was changed.`)
      return 'ignored'
    }
    if (!(await recordEventOnce(req, `terminal:${eventKey}:${orderId}`))) return 'repeat'

    if (CANCELLED.has(event.type)) {
      if (order.status !== 'courier-booked') {
        await note(req, order, `Terminal reported ${event.type} while the order was ${statusLabel(order.status)}. Nothing was changed.`)
        return 'noted'
      }
      await serverUpdate(req, order.id, {
        status: 'paid',
        shipment: { ...order.shipment, terminalShipmentId: null, carrierName: null, trackingNumber: null, trackingUrl: null, labelUrl: null, courierCostNGN: null, bookedAt: null, bookedBy: null, bookingStartedAt: null },
        history: appendHistory(order.history, { from: 'courier-booked', to: 'paid', by: 'Terminal', note: bookingNote(order.shipment) }),
      })
      return 'cancelled'
    }

    let result: 'moved' | 'noted' | 'alerted' = 'alerted'
    const to = MOVES[event.type]
    if (to) {
      if (isForwardMove(order.status, to)) {
        await serverUpdate(req, order.id, { status: to, history: appendHistory(order.history, { from: order.status, to, by: 'Terminal' }) })
        result = 'moved'
      } else {
        await note(req, order, `Late update ignored: Terminal reported ${event.type} while the order was ${statusLabel(order.status)}.`)
        result = 'noted'
      }
    }
    const alert = ALERTS[event.type]
    if (alert) await queueShopEmail(req, { kind: alert, orderId: order.id, details: alertDetails(event) })
    return result
  })
}
