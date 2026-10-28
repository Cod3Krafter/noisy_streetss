import config from '@payload-config'
import { createLocalReq, handleEndpoints, type Payload, type PayloadRequest } from 'payload'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Order } from '@/payload-types'
import { setShopClients } from '@/shop/clients'
import { appendHistory } from '@/shop/history'
import { markPaid } from '@/shop/markPaid'
import { serverUpdate } from '@/shop/orders'
import { hmacSha512Hex } from '@/shop/signatures'

import { getTestPayload, rest } from '../helpers/payload'
import { createOrder, setShopSettings } from '../helpers/shop'
import { type FakePaystack, useFakeShopClients } from '../helpers/shopFakes'

let payload: Payload
let req: PayloadRequest
let paystack: FakePaystack

const reference = (order: Order) => order.payment?.reference as string
const reload = (order: Order) => payload.findByID({ collection: 'orders', id: order.id, depth: 0 })
/** A request of its own. Calls made at the same moment each need one, as real requests have. */
const newReq = () => createLocalReq({}, payload)
const secret = () => process.env.PAYSTACK_SECRET_KEY as string

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

/** The newest job before this file ran. Test files run one at a time, so every later job is this file's. */
let lastJobBefore = 0

beforeAll(async () => {
  payload = await getTestPayload()
  req = await createLocalReq({}, payload)
  await setShopSettings(payload)
  const { docs } = await payload.find({ collection: 'payload-jobs', sort: '-id', limit: 1, depth: 0 })
  lastJobBefore = docs[0]?.id ?? 0
})

beforeEach(() => {
  paystack = useFakeShopClients().paystack
})

afterEach(() => {
  vi.restoreAllMocks()
})

afterAll(async () => {
  setShopClients(null)
  // The job runner takes the oldest 10 jobs a call, so emails left queued here would crowd out
  // the job another file's runner test queues.
  await payload.db.deleteMany({ collection: 'payload-jobs', where: { id: { greater_than: lastJobBefore } } })
})

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
    const [reqA, reqB] = await Promise.all([newReq(), newReq()])
    const results = await Promise.all([markPaid(reqA, reference(order), 'Payment'), markPaid(reqB, reference(order), 'Payment')])
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

  it('alerts staff once when two calls with a wrong amount arrive together', async () => {
    const order = await createOrder(payload)
    payInFull(order, { requestedAmountKobo: 100 })
    const [reqA, reqB] = await Promise.all([newReq(), newReq()])
    const results = await Promise.all([markPaid(reqA, reference(order), 'Payment'), markPaid(reqB, reference(order), 'Payment')])
    expect(results).toEqual(['mismatch', 'mismatch'])
    expect(await emailsFor(order)).toEqual(['staff-mismatch'])
  })

  it('refuses a payment in another currency, and writes its amount as plain digits with the code', async () => {
    const order = await createOrder(payload)
    payInFull(order, { currency: 'USD' })
    expect(await markPaid(req, reference(order), 'Payment')).toBe('mismatch')
    const stored = await reload(order)
    expect(stored.status).toBe('awaiting-payment')
    expect(stored.payment?.problem).toBe('Paystack reported 13200.00 USD, but the order total is ₦13,200.')
  })

  it('records everything when the order expires while Paystack is being asked', async () => {
    const order = await createOrder(payload)
    payInFull(order)
    const verify = paystack.verify.bind(paystack)
    paystack.verify = async (ref) => {
      // The expiry job moves the order on while Paystack is still answering.
      const current = await reload(order)
      await serverUpdate(await newReq(), order.id, {
        status: 'expired',
        history: appendHistory(current.history, { from: 'awaiting-payment', to: 'expired', by: 'Expiry check' }),
      })
      return verify(ref)
    }
    expect(await markPaid(req, reference(order), 'Payment')).toBe('paid-late')
    const paid = await reload(order)
    expect(paid).toMatchObject({ status: 'paid', chargedNGN: 13400, paystackFeeNGN: 200, payment: { channel: 'card', paidLate: true } })
    expect(paid.payment?.paidAt).toBeTruthy()
    expect(paid.history?.map(({ from, to, by }) => ({ from, to, by }))).toEqual([
      { from: null, to: 'awaiting-payment', by: 'Checkout' },
      { from: 'awaiting-payment', to: 'expired', by: 'Expiry check' },
      { from: 'expired', to: 'paid', by: 'Payment' },
    ])
    expect(await emailsFor(order)).toEqual(['receipt', 'staff-paid'])
  })

  it('records nothing when a step fails part way, so trying again finishes the job', async () => {
    const order = await createOrder(payload)
    payInFull(order)
    vi.spyOn(payload.jobs, 'queue').mockRejectedValueOnce(new Error('The job queue is down (test).'))
    await expect(markPaid(req, reference(order), 'Payment')).rejects.toThrow('The job queue is down (test).')
    const after = await reload(order)
    expect(after.status).toBe('awaiting-payment')
    expect(after.payment?.paidAt).toBeFalsy()
    expect(after.history).toHaveLength(1)

    expect(await markPaid(req, reference(order), 'Payment')).toBe('paid')
    const paid = await reload(order)
    expect(paid.status).toBe('paid')
    expect(paid.payment?.paidAt).toBeTruthy()
    expect(paid.history).toHaveLength(2)
    expect(await emailsFor(order)).toEqual(['receipt', 'staff-paid'])
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
      headers: { 'x-paystack-signature': signature ?? hmacSha512Hex(JSON.stringify(event), secret()) },
    })

  /** Posts the text exactly as given; rest() serialises the body itself. */
  const postRaw = (text: string, headers: Record<string, string>) =>
    handleEndpoints({
      config,
      request: new Request('http://localhost:3000/api/paystack/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: text,
      }),
    })

  it('refuses a body with no signature header', async () => {
    const order = await createOrder(payload)
    payInFull(order)
    const res = await postRaw(JSON.stringify({ event: 'charge.success', data: { reference: reference(order) } }), {})
    expect(res.status).toBe(401)
    expect((await reload(order)).status).toBe('awaiting-payment')
  })

  it('checks the signature over the text exactly as sent', async () => {
    const order = await createOrder(payload)
    payInFull(order)
    const text = JSON.stringify({ event: 'charge.success', data: { reference: reference(order) } }, null, 2)
    const res = await postRaw(text, { 'x-paystack-signature': hmacSha512Hex(text, secret()) })
    expect(res.status).toBe(200)
    expect((await reload(order)).status).toBe('paid')
  })

  it('logs a warning, without the key or the body, when a signed charge.success is unpaid or does not match', async () => {
    const warn = vi.spyOn(payload.logger, 'warn').mockImplementation(() => undefined)
    const unpaid = await createOrder(payload)
    const wrong = await createOrder(payload)
    payInFull(wrong, { requestedAmountKobo: 100 })
    for (const order of [unpaid, wrong]) {
      expect((await send({ event: 'charge.success', data: { reference: reference(order) } })).status).toBe(200)
    }
    const logged = warn.mock.calls.map((call) => JSON.stringify(call))
    expect(logged.some((line) => line.includes(reference(unpaid)) && line.includes('not paid'))).toBe(true)
    expect(logged.some((line) => line.includes(reference(wrong)) && line.includes('does not match'))).toBe(true)
    for (const line of logged) {
      expect(line).not.toContain(secret())
      expect(line).not.toContain('charge.success')
    }
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

  it('asks Paystack once when five requests arrive together', async () => {
    const order = await createOrder(payload)
    const answers = await Promise.all(Array.from({ length: 5 }, () => rest('GET', `/shop/orders/${reference(order)}`)))
    expect(answers.map((res) => res.status)).toEqual([200, 200, 200, 200, 200])
    expect(paystack.verifyCalls).toBe(1)
  })

  it('asks Paystack again once 10 seconds have passed', async () => {
    const order = await createOrder(payload)
    await rest('GET', `/shop/orders/${reference(order)}`)
    const checked = await reload(order)
    await serverUpdate(req, order.id, { payment: { ...checked.payment, lastCheckedAt: new Date(Date.now() - 11_000).toISOString() } })
    await rest('GET', `/shop/orders/${reference(order)}`)
    expect(paystack.verifyCalls).toBe(2)
  })

  it('never wipes a payment recorded between its read and its write', async () => {
    const order = await createOrder(payload)
    payInFull(order)
    const find = payload.find.bind(payload)
    let paidInBetween = false
    let stored: Order | undefined
    vi.spyOn(payload, 'find').mockImplementation((async (args: Parameters<typeof find>[0]) => {
      const result = await find(args)
      if (!paidInBetween && args.collection === 'orders') {
        paidInBetween = true
        // Paystack's webhook records the payment after the page has read the order.
        expect(await markPaid(await newReq(), reference(order), 'Payment')).toBe('paid')
        stored = await reload(order)
      }
      return result
    }) as never)
    const res = await rest('GET', `/shop/orders/${reference(order)}`)
    expect(res.status).toBe(200)
    expect((await res.json()).status).toBe('paid')
    const after = await reload(order)
    expect(stored?.payment?.paidAt).toBeTruthy()
    expect(after.payment).toMatchObject({ paidAt: stored?.payment?.paidAt, channel: 'card', paidLate: false })
  })

  it('answers 404 for a reference no order has', async () => {
    expect((await rest('GET', '/shop/orders/no-such-reference')).status).toBe(404)
  })
})
