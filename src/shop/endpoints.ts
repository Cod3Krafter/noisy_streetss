import { addDataAndFileToRequest, type Endpoint, type PayloadRequest } from 'payload'

import { isShopUser } from '@/access'
import { Refusal } from '@/refusal'
import { bookCourier, courierOptions } from '@/shop/booking'
import { checkout } from '@/shop/checkout'
import { withOrderLock } from '@/shop/claims'
import { webhookKey } from '@/shop/clients'
import { markPaid, type MarkPaidResult } from '@/shop/markPaid'
import { findOrder, findOrderByReference, serverUpdate } from '@/shop/orders'
import { deliveryQuotes } from '@/shop/quotes'
import { receiptView } from '@/shop/receipt'
import { signatureMatches } from '@/shop/signatures'
import { applyTerminalEvent, eventKeyOf, readTerminalEvent } from '@/shop/terminalEvents'
import { parseStockChange, setStock } from '@/shop/stock'

/** The JSON body of a request, or an empty object. */
export async function bodyOf(req: PayloadRequest): Promise<Record<string, unknown>> {
  await addDataAndFileToRequest(req)
  return req.data && typeof req.data === 'object' ? (req.data as Record<string, unknown>) : {}
}

/** The return page asks Paystack about an unpaid order at most this often. */
const CHECK_EVERY_MS = 10_000

const dueForCheck = (lastCheckedAt: string | null | undefined) => !lastCheckedAt || Date.now() - Date.parse(lastCheckedAt) > CHECK_EVERY_MS

/**
 * Notes the time of a check on an order still awaiting payment, and says whether this caller made
 * it. Read and written under the order's lock, so of several requests arriving together only one
 * goes on to ask Paystack, and a payment recorded in the meantime is never written over.
 */
const startCheck = (req: PayloadRequest, orderId: number) =>
  withOrderLock(req, orderId, async () => {
    const order = await findOrder(req, orderId)
    if (order?.status !== 'awaiting-payment' || !dueForCheck(order.payment?.lastCheckedAt)) return false
    await serverUpdate(req, orderId, { payment: { ...order.payment, lastCheckedAt: new Date().toISOString() } })
    return true
  })

/** What the webhook logs when Paystack's notice of a payment does not lead to a Paid order. */
const WEBHOOK_WARNINGS: Partial<Record<MarkPaidResult, (reference: string) => string>> = {
  'unknown-order': (reference) => `Paystack sent a payment for ${reference}, which no order has.`,
  'not-paid': (reference) => `Paystack sent a payment for ${reference}, but asking Paystack shows it is not paid.`,
  mismatch: (reference) => `Paystack sent a payment for ${reference} that does not match the order's total or currency.`,
}

/** The raw body, exactly as sent: webhook signatures are made over it. */
const rawBody = async (req: PayloadRequest) => (typeof req.text === 'function' ? await req.text() : '')

/** The shop's own endpoints under /api. Expected "no"s are Refusals, which Payload answers with their message. */
export const shopEndpoints: Endpoint[] = [
  {
    path: '/shop/stock',
    method: 'post',
    handler: async (req) => {
      if (!isShopUser(req.user)) throw new Refusal('Only admins and shop staff can change stock here.', 403)
      await setStock(req, parseStockChange(await bodyOf(req)))
      return Response.json({ ok: true })
    },
  },
  {
    path: '/shop/quotes',
    method: 'post',
    handler: async (req) => Response.json(await deliveryQuotes(req, await bodyOf(req))),
  },
  {
    path: '/shop/checkout',
    method: 'post',
    handler: async (req) => Response.json(await checkout(req, await bodyOf(req)), { status: 201 }),
  },
  {
    path: '/shop/orders/:reference',
    method: 'get',
    handler: async (req) => {
      const reference = String(req.routeParams?.reference ?? '')
      let order = await findOrderByReference(req, reference)
      if (!order) throw new Refusal('No order has that reference.', 404)
      if (order.status === 'awaiting-payment' && dueForCheck(order.payment?.lastCheckedAt)) {
        if (await startCheck(req, order.id)) {
          try {
            await markPaid(req, reference, 'Payment')
          } catch (error) {
            req.payload.logger.warn({ err: error, msg: `Could not check the payment for ${order.orderNumber}.` })
          }
        }
        order = (await findOrder(req, order.id)) ?? order
      }
      return Response.json(receiptView(order))
    },
  },
  {
    path: '/paystack/webhook',
    method: 'post',
    handler: async (req) => {
      const raw = await rawBody(req)
      if (!signatureMatches(raw, req.headers.get('x-paystack-signature'), webhookKey('PAYSTACK_SECRET_KEY', req.payload.logger))) {
        return Response.json({ error: 'The signature does not match.' }, { status: 401 })
      }
      let event: { event?: unknown; data?: { reference?: unknown } }
      try {
        event = JSON.parse(raw)
      } catch {
        return Response.json({ error: 'The body is not JSON.' }, { status: 400 })
      }
      if (event.event === 'charge.success' && typeof event.data?.reference === 'string') {
        // An error here answers 500, so Paystack sends the notice again later.
        const result = await markPaid(req, event.data.reference, 'Payment')
        const warning = WEBHOOK_WARNINGS[result]
        if (warning) req.payload.logger.warn(warning(event.data.reference))
      }
      return Response.json({ received: true })
    },
  },
  {
    path: '/terminal/webhook',
    method: 'post',
    handler: async (req) => {
      const raw = await rawBody(req)
      if (!signatureMatches(raw, req.headers.get('x-terminal-signature'), webhookKey('TERMINAL_SECRET_KEY', req.payload.logger))) {
        return Response.json({ error: 'The signature does not match.' }, { status: 401 })
      }
      let body: unknown
      try {
        body = JSON.parse(raw)
      } catch {
        return Response.json({ error: 'The body is not JSON.' }, { status: 400 })
      }
      const { eventId, event } = readTerminalEvent(body)
      const key = eventKeyOf(eventId, raw)
      // An error here answers 500, and nothing was recorded, so Terminal sends the notice again.
      const result = await applyTerminalEvent(req, event, key)
      return Response.json(result === 'repeat' ? { received: true, repeat: true } : { received: true })
    },
  },
]

/** The order id in the path, or a 404 for anything that cannot be an id, before the database is asked. */
function orderIdOf(req: PayloadRequest): number {
  const raw = String(req.routeParams?.id ?? '')
  const id = Number(raw)
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id < 1) throw new Refusal('That order no longer exists.', 404)
  return id
}

function requireShopStaff(req: PayloadRequest): void {
  if (!isShopUser(req.user)) throw new Refusal('Only admins and shop staff can book couriers.', 403)
}

/** Mounted on the Orders collection, so they answer at /api/orders/:id/... */
export const orderEndpoints: Endpoint[] = [
  {
    path: '/:id/courier-options',
    method: 'get',
    handler: async (req) => {
      requireShopStaff(req)
      return Response.json(await courierOptions(req, orderIdOf(req)))
    },
  },
  {
    path: '/:id/book-courier',
    method: 'post',
    handler: async (req) => {
      requireShopStaff(req)
      const orderId = orderIdOf(req)
      const { rateId, fingerprint } = await bodyOf(req)
      if (typeof rateId !== 'string' || !rateId) throw new Refusal('Pick a courier first.')
      if (typeof fingerprint !== 'string' || !fingerprint) throw new Refusal('Reload the panel and pick again.')
      const bookedBy = (req.user as { name?: string } | null)?.name ?? 'Staff'
      const order = await bookCourier(req, orderId, rateId, bookedBy, fingerprint)
      return Response.json({ status: order.status, trackingNumber: order.shipment?.trackingNumber ?? null })
    },
  },
]
