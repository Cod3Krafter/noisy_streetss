import type { PayloadRequest } from 'payload'

import type { Order } from '@/payload-types'
import { recordEventOnce, withOrderLock } from '@/shop/claims'
import { queueShopEmail, type ShopEmailKind } from '@/shop/emails'
import { appendHistory } from '@/shop/history'
import { formatNaira, toKobo } from '@/shop/money'
import { findOrder, serverUpdate } from '@/shop/orders'
import { isForwardMove, type OrderStatus, statusLabel } from '@/shop/statuses'

export type TerminalEvent = { type: string; shipmentId: string | null; data: Record<string, unknown> }

export type TerminalResult = 'moved' | 'noted' | 'alerted' | 'cancelled' | 'ignored' | 'unknown-shipment' | 'repeat'

const objectOf = (value: unknown) => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {})
const textOf = (value: unknown) => (typeof value === 'string' && value ? value : null)

/**
 * The event's id, name and shipment id, where Terminal's docs put them: shipment and reconciliation
 * events carry data.shipment_id, a transaction carries the id as data.shipment, and a pickup lists
 * data.shipment_ids. Only pickup events document an event_id.
 */
export function readTerminalEvent(body: unknown): { eventId: string | null; event: TerminalEvent } {
  const raw = objectOf(body)
  const data = objectOf(raw.data)
  const shipment = data.shipment
  const shipmentIds = Array.isArray(data.shipment_ids) ? data.shipment_ids : []
  return {
    eventId: textOf(raw.event_id) ?? textOf(raw.id),
    event: {
      type: textOf(raw.event) ?? textOf(raw.type) ?? '',
      shipmentId: textOf(data.shipment_id) ?? textOf(shipment) ?? textOf(objectOf(shipment).shipment_id) ?? textOf(shipmentIds[0]),
      data,
    },
  }
}

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

/** The amount a weight claim is for: Terminal's reconciliation events give it as exception_charge. */
function alertDetails(event: TerminalEvent): string | null {
  const amount = typeof event.data.amount === 'number' ? event.data.amount : event.data.exception_charge
  return typeof amount === 'number' ? `Amount claimed: ${formatNaira(toKobo(amount))}.` : null
}

/**
 * Applies one Terminal event to its order, under the order's row lock. Webhooks only move an order
 * forward; a cancellation sends it back to Paid. When the event has an id it is recorded in the same
 * transaction as the change, so a failed apply is not remembered and Terminal's retry runs it again.
 * Events for no order, or of a kind the shop ignores, change and record nothing.
 */
export async function applyTerminalEvent(req: PayloadRequest, event: TerminalEvent, eventId: string | null = null): Promise<TerminalResult> {
  if (!MOVES[event.type] && !ALERTS[event.type] && !CANCELLED.has(event.type)) return 'ignored'
  const { docs } = event.shipmentId
    ? await req.payload.find({ collection: 'orders', where: { 'shipment.terminalShipmentId': { equals: event.shipmentId } }, depth: 0, limit: 1, overrideAccess: true, req })
    : { docs: [] as Order[] }
  const found = docs[0]
  if (!found) {
    req.payload.logger.warn(`Terminal sent ${event.type} for shipment ${event.shipmentId ?? 'with no ID'}, which no order has.`)
    return 'unknown-shipment'
  }

  return withOrderLock(req, found.id, async (): Promise<TerminalResult> => {
    if (eventId && !(await recordEventOnce(req, `terminal:${eventId}`))) return 'repeat'
    const order = await findOrder(req, found.id)
    if (!order) return 'unknown-shipment'

    if (CANCELLED.has(event.type)) {
      if (order.status !== 'courier-booked') {
        await note(req, order, `Terminal reported ${event.type} while the order was ${statusLabel(order.status)}. Nothing was changed.`)
        return 'noted'
      }
      const was = order.shipment
      await serverUpdate(req, order.id, {
        status: 'paid',
        shipment: { ...order.shipment, terminalShipmentId: null, carrierName: null, trackingNumber: null, trackingUrl: null, labelUrl: null, courierCostNGN: null, bookedAt: null, bookedBy: null, bookingStartedAt: null },
        history: appendHistory(order.history, {
          from: 'courier-booked',
          to: 'paid',
          by: 'Terminal',
          note: `Booking cancelled in Terminal (was ${was?.carrierName ?? 'a courier'}, shipment ${was?.terminalShipmentId}, tracking ${was?.trackingNumber ?? 'none'})`,
        }),
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
