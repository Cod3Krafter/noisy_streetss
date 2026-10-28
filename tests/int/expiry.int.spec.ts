import { createLocalReq, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { setShopClients } from '@/shop/clients'
import { expireOrder } from '@/shop/expiry'
import { serverUpdate } from '@/shop/orders'

import { getTestPayload } from '../helpers/payload'
import { createOrder, setShopSettings } from '../helpers/shop'
import { type FakePaystack, useFakeShopClients } from '../helpers/shopFakes'

let payload: Payload
let req: PayloadRequest
let paystack: FakePaystack
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

afterAll(async () => {
  setShopClients(null)
  // The job runner takes the oldest 10 jobs a call, so jobs left queued here would crowd out the
  // job another file's runner test queues.
  await payload.db.deleteMany({ collection: 'payload-jobs', where: { id: { greater_than: lastJobBefore } } })
})

describe('expireOrder', () => {
  it('expires an order that is still unpaid', async () => {
    const order = await createOrder(payload)
    expect(await expireOrder(req, order.id, 0)).toBe('expired')
    const stored = await payload.findByID({ collection: 'orders', id: order.id })
    expect(stored.status).toBe('expired')
    expect(stored.history?.at(-1)).toMatchObject({ from: 'awaiting-payment', to: 'expired', by: 'Expiry check' })
  })

  it('marks it Paid instead when Paystack has the money', async () => {
    const order = await createOrder(payload)
    paystack.pay(order.payment?.reference as string, { requestedAmountKobo: 1_320_000, amountKobo: 1_340_000, feesKobo: 20_000 })
    expect(await expireOrder(req, order.id, 0)).toBe('paid')
    expect((await payload.findByID({ collection: 'orders', id: order.id })).status).toBe('paid')
  })

  it('leaves an order that has moved on alone', async () => {
    const order = await createOrder(payload, { status: 'paid' })
    expect(await expireOrder(req, order.id, 0)).toBe('unchanged')
  })

  it('tries again while Paystack is unreachable, then expires the order anyway', async () => {
    paystack.failVerify = true
    const order = await createOrder(payload)
    await expect(expireOrder(req, order.id, 0)).rejects.toThrow('could not be reached')
    expect(await expireOrder(req, order.id, 2)).toBe('expired')
  })

  it('leaves an order alone that became Paid between the first read and the lock', async () => {
    const order = await createOrder(payload)
    const realVerify = paystack.verify.bind(paystack)
    paystack.verify = async (reference: string) => {
      // Another request records the payment while this job is waiting on Paystack, which says "not paid".
      const other = await createLocalReq({}, payload)
      await serverUpdate(other, order.id, { status: 'paid' })
      return realVerify(reference)
    }
    expect(await expireOrder(req, order.id, 0)).toBe('unchanged')
    expect((await payload.findByID({ collection: 'orders', id: order.id })).status).toBe('paid')
  })

  it('runs as a queued job', async () => {
    const order = await createOrder(payload)
    const job = await payload.jobs.queue({ task: 'expireOrder', input: { orderId: order.id }, waitUntil: new Date(Date.now() - 1000) })
    await payload.jobs.runByID({ id: job.id })
    expect((await payload.findByID({ collection: 'orders', id: order.id })).status).toBe('expired')
  })
})
