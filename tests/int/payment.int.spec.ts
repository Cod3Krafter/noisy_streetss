import { createLocalReq, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { Order } from '@/payload-types'
import { setShopClients } from '@/shop/clients'
import { markPaid } from '@/shop/markPaid'
import { hmacSha512Hex } from '@/shop/signatures'

import { getTestPayload, rest } from '../helpers/payload'
import { createOrder, setShopSettings } from '../helpers/shop'
import { type FakePaystack, useFakeShopClients } from '../helpers/shopFakes'

let payload: Payload
let req: PayloadRequest
let paystack: FakePaystack

const reference = (order: Order) => order.payment?.reference as string
const reload = (order: Order) => payload.findByID({ collection: 'orders', id: order.id, depth: 0 })

/** The kinds of shop email queued for an order, in order. */
async function emailsFor(order: Order): Promise<string[]> {
  const { docs } = await payload.find({ collection: 'payload-jobs', where: { taskSlug: { equals: 'sendShopEmail' } }, limit: 0, pagination: false, sort: 'id' })
  return docs
    .map((job) => job.input as { kind: string; orderId: number })
    .filter((input) => input.orderId === order.id)
    .map((input) => input.kind)
}

/** Pays the order on the fake for exactly its total, with a ₦200 fee on top. */
const payInFull = (order: Order, overrides = {}) =>
  paystack.pay(reference(order), { requestedAmountKobo: (order.totalNGN ?? 0) * 100, amountKobo: (order.totalNGN ?? 0) * 100 + 20_000, feesKobo: 20_000, ...overrides })

beforeAll(async () => {
  payload = await getTestPayload()
  req = await createLocalReq({}, payload)
  await setShopSettings(payload)
})

beforeEach(() => {
  paystack = useFakeShopClients().paystack
})

afterAll(() => setShopClients(null))

describe('markPaid', () => {
  it('marks an order Paid once Paystack confirms it, and queues the receipt and the staff alert', async () => {
    const order = await createOrder(payload)
    payInFull(order)
    expect(await markPaid(req, reference(order), 'Payment')).toBe('paid')
    const paid = await reload(order)
    expect(paid.status).toBe('paid')
    expect(paid.chargedNGN).toBe(13400)
    expect(paid.paystackFeeNGN).toBe(200)
    expect(paid.payment?.channel).toBe('card')
    expect(paid.payment?.paidLate).toBe(false)
    expect(paid.history?.at(-1)).toMatchObject({ from: 'awaiting-payment', to: 'paid', by: 'Payment' })
    expect(await emailsFor(order)).toEqual(['receipt', 'staff-paid'])
  })

  it('leaves an unpaid order alone', async () => {
    const order = await createOrder(payload)
    expect(await markPaid(req, reference(order), 'Payment')).toBe('not-paid')
    expect((await reload(order)).status).toBe('awaiting-payment')
  })

  it('records the payment once when two calls arrive together', async () => {
    const order = await createOrder(payload)
    payInFull(order)
    const results = await Promise.all([markPaid(req, reference(order), 'Payment'), markPaid(req, reference(order), 'Payment')])
    expect(results.sort()).toEqual(['paid', 'unchanged'])
    expect(await emailsFor(order)).toEqual(['receipt', 'staff-paid'])
    expect((await reload(order)).history).toHaveLength(2)
  })

  it('marks an expired order Paid late', async () => {
    const order = await createOrder(payload, { status: 'expired' })
    payInFull(order)
    expect(await markPaid(req, reference(order), 'Payment')).toBe('paid-late')
    const paid = await reload(order)
    expect(paid.status).toBe('paid')
    expect(paid.payment?.paidLate).toBe(true)
    expect(paid.history?.at(-1)).toMatchObject({ from: 'expired', to: 'paid', note: 'Paid after the order expired' })
  })

  it('never marks Paid on a wrong amount, and alerts staff once', async () => {
    const order = await createOrder(payload)
    payInFull(order, { requestedAmountKobo: 100 })
    expect(await markPaid(req, reference(order), 'Payment')).toBe('mismatch')
    expect(await markPaid(req, reference(order), 'Payment')).toBe('mismatch')
    const stored = await reload(order)
    expect(stored.status).toBe('awaiting-payment')
    expect(stored.payment?.problem).toBe('Paystack reported ₦1 in NGN, but the order total is ₦13,200.')
    expect(await emailsFor(order)).toEqual(['staff-mismatch'])
  })

  it('leaves an order that has moved on alone, and knows an unknown reference', async () => {
    const order = await createOrder(payload, { status: 'delivered' })
    expect(await markPaid(req, reference(order), 'Payment')).toBe('unchanged')
    expect(await markPaid(req, 'no-such-reference', 'Payment')).toBe('unknown-order')
  })
})

describe("Paystack's webhook", () => {
  const send = (event: unknown, signature?: string) =>
    rest('POST', '/paystack/webhook', {
      body: event,
      headers: { 'x-paystack-signature': signature ?? hmacSha512Hex(JSON.stringify(event), process.env.PAYSTACK_SECRET_KEY as string) },
    })

  it('refuses a body without the right signature', async () => {
    const order = await createOrder(payload)
    payInFull(order)
    const res = await send({ event: 'charge.success', data: { reference: reference(order) } }, 'f'.repeat(128))
    expect(res.status).toBe(401)
    expect((await reload(order)).status).toBe('awaiting-payment')
  })

  it('marks the order Paid on a signed charge.success', async () => {
    const order = await createOrder(payload)
    payInFull(order)
    const res = await send({ event: 'charge.success', data: { reference: reference(order) } })
    expect(res.status).toBe(200)
    expect((await reload(order)).status).toBe('paid')
  })

  it('acknowledges other events and unknown references without changing anything', async () => {
    const order = await createOrder(payload)
    payInFull(order)
    expect((await send({ event: 'transfer.success', data: { reference: reference(order) } })).status).toBe(200)
    expect((await reload(order)).status).toBe('awaiting-payment')
    expect((await send({ event: 'charge.success', data: { reference: 'no-such-reference' } })).status).toBe(200)
  })
})

describe('GET /api/shop/orders/:reference', () => {
  it('asks Paystack about an order still awaiting payment, and shows no street, phone or email', async () => {
    const order = await createOrder(payload)
    payInFull(order)
    const res = await rest('GET', `/shop/orders/${reference(order)}`)
    expect(res.status).toBe(200)
    const view = await res.json()
    expect(view).toMatchObject({ orderNumber: order.orderNumber, status: 'paid', city: 'Ikeja', state: 'lagos', totalNGN: 13200, chargedNGN: 13400 })
    const raw = JSON.stringify(view)
    for (const secret of ['5 Allen Avenue', '+2348031234567', 'ada@example.com', '100271']) expect(raw).not.toContain(secret)
  })

  it('asks Paystack at most once every 10 seconds', async () => {
    const order = await createOrder(payload)
    await rest('GET', `/shop/orders/${reference(order)}`)
    await rest('GET', `/shop/orders/${reference(order)}`)
    expect(paystack.verifyCalls).toBe(1)
  })

  it('answers 404 for a reference no order has', async () => {
    expect((await rest('GET', '/shop/orders/no-such-reference')).status).toBe(404)
  })
})
