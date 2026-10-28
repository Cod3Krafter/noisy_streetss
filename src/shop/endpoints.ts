import { addDataAndFileToRequest, type Endpoint, type PayloadRequest } from 'payload'

import { isShopUser } from '@/access'
import { Refusal } from '@/refusal'
import { checkout } from '@/shop/checkout'
import { withOrderLock } from '@/shop/claims'
import { markPaid, type MarkPaidResult } from '@/shop/markPaid'
import { findOrder, findOrderByReference, serverUpdate } from '@/shop/orders'
import { deliveryQuotes } from '@/shop/quotes'
import { receiptView } from '@/shop/receipt'
import { signatureMatches } from '@/shop/signatures'
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
      if (!signatureMatches(raw, req.headers.get('x-paystack-signature'), process.env.PAYSTACK_SECRET_KEY)) {
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
]
