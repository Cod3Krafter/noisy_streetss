import { addDataAndFileToRequest, type Endpoint, type PayloadRequest } from 'payload'

import { Refusal } from '@/refusal'
import { markPaid } from '@/shop/markPaid'
import { findOrderByReference, serverUpdate } from '@/shop/orders'
import { deliveryQuotes } from '@/shop/quotes'
import { receiptView } from '@/shop/receipt'
import { signatureMatches } from '@/shop/signatures'

/** The JSON body of a request, or an empty object. */
export async function bodyOf(req: PayloadRequest): Promise<Record<string, unknown>> {
  await addDataAndFileToRequest(req)
  return req.data && typeof req.data === 'object' ? (req.data as Record<string, unknown>) : {}
}

/** The return page asks Paystack about an unpaid order at most this often. */
const CHECK_EVERY_MS = 10_000

const dueForCheck = (lastCheckedAt: string | null | undefined) => !lastCheckedAt || Date.now() - Date.parse(lastCheckedAt) > CHECK_EVERY_MS

/** The raw body, exactly as sent: webhook signatures are made over it. */
const rawBody = async (req: PayloadRequest) => (typeof req.text === 'function' ? await req.text() : '')

/** The shop's own endpoints under /api. Expected "no"s are Refusals, which Payload answers with their message. */
export const shopEndpoints: Endpoint[] = [
  {
    path: '/shop/quotes',
    method: 'post',
    handler: async (req) => Response.json(await deliveryQuotes(req, await bodyOf(req))),
  },
  {
    path: '/shop/orders/:reference',
    method: 'get',
    handler: async (req) => {
      const reference = String(req.routeParams?.reference ?? '')
      let order = await findOrderByReference(req, reference)
      if (!order) throw new Refusal('No order has that reference.', 404)
      if (order.status === 'awaiting-payment' && dueForCheck(order.payment?.lastCheckedAt)) {
        await serverUpdate(req, order.id, { payment: { ...order.payment, lastCheckedAt: new Date().toISOString() } })
        try {
          await markPaid(req, reference, 'Payment')
        } catch (error) {
          req.payload.logger.warn({ err: error, msg: `Could not check the payment for ${order.orderNumber}.` })
        }
        order = (await findOrderByReference(req, reference)) ?? order
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
        if (result === 'unknown-order') req.payload.logger.warn(`Paystack sent a payment for ${event.data.reference}, which no order has.`)
      }
      return Response.json({ received: true })
    },
  },
]
